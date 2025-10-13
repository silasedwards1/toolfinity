import { NextRequest } from 'next/server';
import { createWriteStream, promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { ReadableStream as NodeWebReadableStream } from 'stream/web';

// On Windows dev and Next server, prefer absolute path from ffmpeg-static, else fallback
// Set inside the handler after verifying existence to avoid ENOENT on dev/build

export const runtime = 'nodejs';
export const maxDuration = 60; // vercel serverless safeguard

export async function POST(req: NextRequest) {
  try {
    const { applyRateLimit } = await import('@/lib/rateLimit');
    const limited = applyRateLimit(req as unknown as Request, { routeName: 'delogo', points: 6, intervalMs: 60_000 });
    if (limited) return limited;

    // Resolve ffmpeg binary path on each request in dev to avoid stale .next paths
    try {
      const stat = await fs.stat(ffmpegPath as string).catch(() => null);
      ffmpeg.setFfmpegPath(stat ? (ffmpegPath as string) : 'ffmpeg');
    } catch {
      ffmpeg.setFfmpegPath('ffmpeg');
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/octet-stream')) {
      return new Response('Expected application/octet-stream', { status: 400 });
    }

    const url = new URL(req.url);
    const x = parseInt(url.searchParams.get('x') || '0', 10);
    const y = parseInt(url.searchParams.get('y') || '0', 10);
    const w = parseInt(url.searchParams.get('w') || '0', 10);
    const h = parseInt(url.searchParams.get('h') || '0', 10);
    const vw = parseInt(url.searchParams.get('vw') || '0', 10);
    const vh = parseInt(url.searchParams.get('vh') || '0', 10);

    if (w <= 0 || h <= 0) {
      return new Response('Invalid rectangle', { status: 400 });
    }

    // write input to temp file
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'delogo-'));
    const inputPath = path.join(tmpDir, 'input.mp4');
    const outputPath = path.join(tmpDir, 'output.mp4');

    const body = req.body;
    if (!body) return new Response('Missing body', { status: 400 });
    const ws = createWriteStream(inputPath);
    await pipeline(Readable.fromWeb(body as unknown as NodeWebReadableStream<Uint8Array>), ws);

    const maxW = vw > 0 ? vw : undefined; // original frame width
    const maxH = vh > 0 ? vh : undefined; // original frame height
    const safe = {
      x: Math.max(0, x | 0),
      y: Math.max(0, y | 0),
      w: Math.max(1, w | 0),
      h: Math.max(1, h | 0),
    };
    if (maxW) safe.w = Math.min(safe.w, maxW - safe.x);
    if (maxH) safe.h = Math.min(safe.h, maxH - safe.y);
    const portrait = !!(maxW && maxH && maxH > maxW);
    // If portrait, rotate frame 90° CW to apply delogo in rotated space,
    // map rectangle accordingly, then rotate back
    let vf = `delogo=x=${safe.x}:y=${safe.y}:w=${safe.w}:h=${safe.h}:show=0,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`;
    if (portrait && maxW && maxH) {
      // After transpose=1 (CW): newW = H, newH = W
      // Map original rect (x,y,w,h) -> rotated rect (x',y',w',h')
      const rx = safe.y;
      const ry = Math.max(0, maxW - (safe.x + safe.w));
      const rw = safe.h;
      const rh = safe.w;
      // Clamp in rotated space (width=H, height=W)
      const rotW = maxH;
      const rotH = maxW;
      const clamped = {
        x: Math.max(0, Math.min(rx, rotW - 1)),
        y: Math.max(0, Math.min(ry, rotH - 1)),
        w: Math.max(1, Math.min(rw, rotW - Math.max(0, Math.min(rx, rotW - 1)))),
        h: Math.max(1, Math.min(rh, rotH - Math.max(0, Math.min(ry, rotH - 1)))),
      };
      vf = `transpose=1,delogo=x=${clamped.x}:y=${clamped.y}:w=${clamped.w}:h=${clamped.h}:show=0,transpose=2,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`;
    }

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(vf)
        .outputOptions(['-c:v libx264', '-preset veryfast', '-crf 23', '-c:a copy'])
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });

    const file = await fs.readFile(outputPath);
    await fs.rm(tmpDir, { recursive: true, force: true });

    return new Response(new Uint8Array(file), {
      headers: {
        'content-type': 'video/mp4',
        'content-disposition': 'attachment; filename="delogo.mp4"',
      },
    });
  } catch (e) {
    console.error('[delogo] error', e);
    const msg = e instanceof Error ? e.message : 'Processing failed';
    return new Response(msg, { status: 500 });
  }
}


