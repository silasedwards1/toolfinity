import { NextRequest } from 'next/server';
import { createWriteStream, promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { ReadableStream as NodeWebReadableStream } from 'stream/web';

export const runtime = 'nodejs';
export const maxDuration = 300;

function setFfmpegPath() {
  try {
    // @ts-ignore
    const p = ffmpegPath as string;
    ffmpeg.setFfmpegPath(p || 'ffmpeg');
  } catch {
    ffmpeg.setFfmpegPath('ffmpeg');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { applyRateLimit } = await import('@/lib/rateLimit');
    const limited = applyRateLimit(req as unknown as Request, { routeName: 'auto-delogo', points: 3, intervalMs: 60_000 });
    if (limited) return limited;

    setFfmpegPath();

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/octet-stream')) {
      return new Response('Expected application/octet-stream', { status: 400 });
    }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'auto-delogo-'));
    const inputPath = path.join(tmpDir, 'input.mp4');
    const outputPath = path.join(tmpDir, 'output.mp4');
    const framesDir = path.join(tmpDir, 'frames');
    await fs.mkdir(framesDir);

    const body = req.body;
    if (!body) return new Response('Missing body', { status: 400 });
    const ws = createWriteStream(inputPath);
    await pipeline(Readable.fromWeb(body as unknown as NodeWebReadableStream<Uint8Array>), ws);

    // 1) Extract frames at an adaptive sampling rate (0.5s to ~24 samples)
    const targetSamples = 24;
    const probe = await new Promise<number>((resolve) => {
      // try to get duration quickly; if it fails, fall back to 12s default
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) return resolve(12);
        resolve((data.format.duration as number) || 12);
      });
    });
    const interval = Math.max(0.5, probe / targetSamples);
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(['-vf', `fps=1/${interval}`])
        .output(path.join(framesDir, 'frame-%03d.png'))
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });

    // 2) Heuristic detection: persistent overlays near edges
    // Downscale frames, compute per-pixel frequency of bright and dark hits, then threshold + cluster
    let files = (await fs.readdir(framesDir)).filter((f) => f.endsWith('.png')).sort();
    if (files.length === 0) throw new Error('No frames extracted');
    files = files.slice(0, targetSamples);

    // Determine original width/height from first frame
    const firstMeta = await sharp(path.join(framesDir, files[0])).metadata();
    const srcW = firstMeta.width || 320;
    const srcH = firstMeta.height || 320;
    const targetW = Math.min(320, srcW);
    const targetH = Math.round((targetW * srcH) / srcW);
    const N = files.length;
    const sum = new Float32Array(targetW * targetH);
    const sumSq = new Float32Array(targetW * targetH);
    const minArr = new Uint8Array(targetW * targetH).fill(255);
    const maxArr = new Uint8Array(targetW * targetH).fill(0);
    for (const f of files) {
      const buf = await fs.readFile(path.join(framesDir, f));
      const raw = await sharp(buf).resize(targetW, targetH).greyscale().raw().toBuffer();
      for (let i = 0; i < raw.length; i++) {
        const v = raw[i];
        sum[i] += v;
        sumSq[i] += v * v;
        if (v < minArr[i]) minArr[i] = v;
        if (v > maxArr[i]) maxArr[i] = v;
      }
    }
    // Build mask of persistent, high-contrast overlays: low temporal variance and very bright or very dark
    const mask = new Uint8Array(targetW * targetH);
    const meanArr = new Uint8Array(targetW * targetH);
    const varThreshold = 8; // stddev ~ sqrt(var) <= ~8
    for (let i = 0; i < mask.length; i++) {
      const mean = sum[i] / Math.max(1, N);
      meanArr[i] = mean;
      const variance = Math.max(0, sumSq[i] / Math.max(1, N) - mean * mean);
      const stable = Math.sqrt(variance) <= varThreshold || (maxArr[i] - minArr[i]) <= 15;
      const bright = mean >= 200;
      const dark = mean <= 40;
      mask[i] = stable && (bright || dark) ? 1 : 0;
    }

    // Extract bounding boxes for connected regions (simple grid-based clustering)
    type Box = { x: number; y: number; w: number; h: number };
    const boxes: Box[] = [];
    const visited = new Uint8Array(mask.length);
    const dirs = [1, -1, targetW, -targetW];
    function flood(start: number) {
      let minX = targetW, minY = targetH, maxX = 0, maxY = 0;
      const stack = [start];
      visited[start] = 1;
      while (stack.length) {
        const idx = stack.pop()!;
        const x = idx % targetW;
        const y = (idx / targetW) | 0;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        for (const d of dirs) {
          const j = idx + d;
          if (j < 0 || j >= mask.length) continue;
          if (visited[j]) continue;
          if (!mask[j]) continue;
          visited[j] = 1;
          stack.push(j);
        }
      }
      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      if (w * h > 100) boxes.push({ x: minX, y: minY, w, h });
    }
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] && !visited[i]) flood(i);
    }
    // Merge overlapping/adjacent boxes & prefer edges
    function iou(a: Box, b: Box) {
      const x1 = Math.max(a.x, b.x);
      const y1 = Math.max(a.y, b.y);
      const x2 = Math.min(a.x + a.w, b.x + b.w);
      const y2 = Math.min(a.y + a.h, b.y + b.h);
      const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
      return inter / (a.w * a.h + b.w * b.h - inter + 1e-6);
    }
    const merged: Box[] = [];
    for (const b of boxes.sort((a, b) => b.w * b.h - a.w * a.h)) {
      let mergedIn = false;
      for (const m of merged) {
        if (iou(m, b) > 0.3) {
          const minX = Math.min(m.x, b.x), minY = Math.min(m.y, b.y);
          const maxX = Math.max(m.x + m.w, b.x + b.w), maxY = Math.max(m.y + m.h, b.y + b.h);
          m.x = minX; m.y = minY; m.w = maxX - minX; m.h = maxY - minY;
          mergedIn = true; break;
        }
      }
      if (!mergedIn) merged.push({ ...b });
    }
    // Filter by size range; prefer edges but allow mid-frame if edges empty
    const area = targetW * targetH;
    const minArea = area * 0.002; // 0.2%
    const maxArea = area * 0.12;  // 12%
    const edgeMargin = Math.round(0.25 * targetW);
    const withinArea = merged
      .filter((b) => b.w * b.h >= minArea && b.w * b.h <= maxArea);
    const nearEdge = withinArea
      .filter((b) => b.x < edgeMargin || b.y < edgeMargin || (b.x + b.w) > targetW - edgeMargin || (b.y + b.h) > targetH - edgeMargin);
    const candidates = (nearEdge.length ? nearEdge : withinArea);
    // Score by average absolute brightness distance from mid-gray to reduce random regions
    function boxScore(b: { x: number; y: number; w: number; h: number }) {
      let s = 0;
      for (let yy = b.y; yy < b.y + b.h; yy++) {
        for (let xx = b.x; xx < b.x + b.w; xx++) {
          const idx = yy * targetW + xx;
          s += Math.abs(meanArr[idx] - 128);
        }
      }
      return s / Math.max(1, b.w * b.h);
    }
    const finalBoxes = candidates
      .map((b) => ({ ...b, _score: boxScore(b) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 6)
      .map(({ _score, ...rest }) => rest);

    // Map boxes back to full resolution
    const scaleX = srcW / targetW;
    const scaleY = srcH / targetH;
    // Expand, then clamp boxes to the source frame to avoid invalid delogo args
    const expanded = finalBoxes.map((b) => ({
      x: Math.floor(b.x * scaleX) - 4,
      y: Math.floor(b.y * scaleY) - 4,
      w: Math.floor(b.w * scaleX) + 8,
      h: Math.floor(b.h * scaleY) + 8,
    }));
    const fullBoxes = expanded.map((b) => {
      let x = Math.max(0, b.x);
      let y = Math.max(0, b.y);
      let w = Math.max(2, b.w);
      let h = Math.max(2, b.h);
      if (x + w > srcW) w = Math.max(2, srcW - x);
      if (y + h > srcH) h = Math.max(2, srcH - y);
      return { x, y, w, h };
    }).filter((b) => b.w >= 2 && b.h >= 2);

    if (fullBoxes.length === 0) {
      await fs.rm(tmpDir, { recursive: true, force: true });
      return new Response('No watermark detected', { status: 400 });
    }

    // 4) Apply delogo one box at a time; skip any box that causes ffmpeg to fail
    let currentIn = inputPath;
    let applied = 0;
    for (let i = 0; i < fullBoxes.length; i++) {
      const b = fullBoxes[i];
      const nextOut = path.join(tmpDir, `pass-${i}.mp4`);
      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(currentIn)
            .videoFilters(`delogo=${b.x}:${b.y}:${b.w}:${b.h}`)
            .outputOptions(['-c:v libx264', '-preset veryfast', '-crf 23', '-c:a copy'])
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .save(nextOut);
        });
        if (currentIn !== inputPath) {
          try { await fs.unlink(currentIn); } catch {}
        }
        currentIn = nextOut;
        applied++;
      } catch (err) {
        console.error('[auto-delogo] skipping box due to ffmpeg error', b, err);
        try { await fs.unlink(nextOut); } catch {}
      }
    }

    if (applied === 0) {
      await fs.rm(tmpDir, { recursive: true, force: true });
      return new Response('No valid watermark region detected', { status: 400 });
    }

    // Finalize with safe scale/pixel format
    await new Promise<void>((resolve, reject) => {
      ffmpeg(currentIn)
        .videoFilters('scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p')
        .outputOptions(['-c:v libx264', '-preset veryfast', '-crf 23', '-c:a copy'])
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
    if (currentIn !== inputPath) {
      try { await fs.unlink(currentIn); } catch {}
    }

    const out = await fs.readFile(outputPath);
    await fs.rm(tmpDir, { recursive: true, force: true });
    return new Response(new Uint8Array(out), { headers: { 'content-type': 'video/mp4', 'content-disposition': 'attachment; filename="auto-delogo.mp4"' } });
  } catch (e) {
    console.error('[auto-delogo] error', e);
    const msg = e instanceof Error ? e.message : 'Processing failed';
    return new Response(msg, { status: 500 });
  }
}


