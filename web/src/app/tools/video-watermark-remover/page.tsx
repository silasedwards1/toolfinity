'use client';

import * as React from 'react';
import FeaturedTools from '@/components/FeaturedTools';

type Rect = { x: number; y: number; w: number; h: number };

export default function VideoWatermarkRemoverPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const [rect, setRect] = React.useState<Rect | null>(null);
  const [dragStart, setDragStart] = React.useState<{ x: number; y: number } | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [status, setStatus] = React.useState<string>("");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function getPointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function onCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = getPointerPos(e);
    setDragStart({ x: p.x, y: p.y });
  }
  function onCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragStart) return;
    const p = getPointerPos(e);
    const x = Math.min(dragStart.x, p.x);
    const y = Math.min(dragStart.y, p.y);
    const w = Math.abs(p.x - dragStart.x);
    const h = Math.abs(p.y - dragStart.y);
    setRect({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
  }
  function onCanvasPointerUp() {
    setDragStart(null);
  }

  React.useEffect(() => {
    let raf = 0;
    function draw() {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) { raf = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { raf = requestAnimationFrame(draw); return; }
      // Match canvas intrinsic pixels to video frame to keep coordinates accurate
      canvas.width = Math.max(2, video.videoWidth || 640);
      canvas.height = Math.max(2, video.videoHeight || 360);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (rect) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        ctx.setLineDash([]);
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [rect]);

  function getScaledRectToVideoPixels(r: Rect): Rect {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay) return r;
    const displayW = overlay.clientWidth;
    const displayH = overlay.clientHeight;
    const vidW = video.videoWidth || displayW;
    const vidH = video.videoHeight || displayH;
    // object-contain letterboxing: compute scale and offsets
    const scale = Math.min(displayW / vidW, displayH / vidH);
    const renderW = vidW * scale;
    const renderH = vidH * scale;
    const offsetX = (displayW - renderW) / 2;
    const offsetY = (displayH - renderH) / 2;
    // subtract offsets, then divide by scale
    const x = Math.max(0, Math.round((r.x - offsetX) / scale));
    const y = Math.max(0, Math.round((r.y - offsetY) / scale));
    const w = Math.max(0, Math.round(r.w / scale));
    const h = Math.max(0, Math.round(r.h / scale));
    return { x, y, w, h };
  }

  async function processVideo() {
    if (!file || !rect) return;
    try {
      setProcessing(true);
      setStatus('Uploading and processing...');
      const r = getScaledRectToVideoPixels(rect);
      const vw = String(videoRef.current?.videoWidth || 0);
      const vh = String(videoRef.current?.videoHeight || 0);
      const query = new URLSearchParams({ x: String(r.x), y: String(r.y), w: String(r.w), h: String(r.h), vw, vh });
      const res = await fetch(`/api/delogo?${query.toString()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/octet-stream' },
        body: await file.arrayBuffer(),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => 'Processing failed');
        throw new Error(errText || 'Processing failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'video-delogo.mp4';
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Done. Your download should start.');
    } catch (e) {
      setStatus((e as Error)?.message || 'Error');
    } finally {
      setProcessing(false);
    }
  }

  const videoUrl = React.useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  return (
    <>
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl md:text-3xl font-semibold">Video Watermark Remover</h1>
      <p className="text-foreground/70">Select a rectangle over the watermark, then process.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="relative rounded-xl border bg-card overflow-hidden" style={{ aspectRatio: 'auto' }} ref={overlayRef} onDrop={onDrop} onDragOver={onDragOver}>
            {videoUrl ? (
              <>
                <video ref={videoRef} className="block max-h-[70vh] w-auto mx-auto object-contain" src={videoUrl} controls playsInline />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 cursor-crosshair"
                  onPointerDown={onCanvasPointerDown}
                  onPointerMove={onCanvasPointerMove}
                  onPointerUp={onCanvasPointerUp}
                />
              </>
            ) : (
              <div className="h-full w-full grid place-items-center text-sm text-foreground/70">
                <div className="text-center">
                  <div>Drag & drop a video here</div>
                  <div className="mt-2">or</div>
                  <button
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="file"][accept^="video/"]')?.click()}
                    className="mt-3 inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium hover:bg-muted"
                  >
                    Upload video
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Video file</label>
            <input className="mt-2 block w-full text-sm" type="file" accept="video/*" onChange={onFileChange} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border p-3">
              <div className="text-foreground/70">X</div>
              <div className="font-mono">{rect?.x ?? 0}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-foreground/70">Y</div>
              <div className="font-mono">{rect?.y ?? 0}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-foreground/70">W</div>
              <div className="font-mono">{rect?.w ?? 0}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-foreground/70">H</div>
              <div className="font-mono">{rect?.h ?? 0}</div>
            </div>
          </div>
          <button
            onClick={processVideo}
            disabled={!file || !rect || processing}
            className="w-full h-11 rounded-full bg-primary text-white text-sm font-medium disabled:opacity-50"
          >
            {processing ? 'Processing…' : 'Remove watermark'}
          </button>
          {status && <p className="text-sm text-foreground/80">{status}</p>}
          <p className="text-xs text-foreground/60">Use only with videos you own or have rights to modify.</p>
        </div>
      </div>
    </div>
    <FeaturedTools selectedCategory="Video" titleOverride="Explore More Video Tools" headerAlign="center" />
    </>
  );
}


