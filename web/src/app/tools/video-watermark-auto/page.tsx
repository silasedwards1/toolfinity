'use client';

import * as React from 'react';

export default function AutoWatermarkRemoverPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [fileName, setFileName] = React.useState('');

  async function process() {
    if (!file) return;
    try {
      setProcessing(true);
      setStatus('Detecting and removing watermarks...');
      const res = await fetch('/api/auto-delogo', {
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
      a.download = 'auto-delogo.mp4';
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Done. Your download should start.');
    } catch (e) {
      setStatus((e as Error).message || 'Error');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Automatic Video Watermark Remover</h1>
        <p className="mt-2 text-foreground/70">Upload your video — we detect and remove watermarks automatically.</p>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-3 items-start">
        <div className="md:col-span-2">
          <div className="rounded-3xl border bg-card p-8">
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-muted/50 transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) { setFile(f); setFileName(f.name); } }}
            >
              <p className="text-sm text-foreground/70">Drag & drop your video here</p>
              <div className="mt-3">or</div>
              <label className="mt-4 inline-flex h-11 items-center rounded-full border px-5 text-sm font-medium hover:bg-muted cursor-pointer">
                <input hidden type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0] || null; setFile(f); setFileName(f?.name || ''); }} />
                Choose File {fileName ? <span className="ml-2 text-foreground/70 truncate max-w-[200px]">{fileName}</span> : null}
              </label>
            </div>

            <div className="mt-6">
              <button
                onClick={process}
                disabled={!file || processing}
                className="inline-flex h-11 items-center rounded-full bg-primary text-white px-6 text-sm font-medium disabled:opacity-50"
              >
                {processing ? 'Removing…' : 'Remove watermarks'}
              </button>
              {status && <p className="mt-3 text-sm text-foreground/80">{status}</p>}
              <p className="mt-2 text-xs text-foreground/60">For best results, use clear, non-recompressed sources.</p>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">What this does</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-foreground/70">
              <li>Samples frames to detect persistent overlays</li>
              <li>Targets likely watermark boxes near edges</li>
              <li>Removes them across the whole video</li>
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">Tips</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-foreground/70">
              <li>Upload the highest-quality source you have</li>
              <li>Busy backgrounds may need multiple passes</li>
              <li>Use manual tool if a box is missed</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}


