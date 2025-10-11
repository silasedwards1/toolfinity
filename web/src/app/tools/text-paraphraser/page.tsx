'use client';

import * as React from 'react';

export default function TextParaphraserPage() {
  const [input, setInput] = React.useState('Paste or type the text you want to paraphrase.');
  const [output, setOutput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [tone, setTone] = React.useState<'neutral' | 'formal' | 'casual'>('neutral');
  const pipeRef = React.useRef<any>(null);
  const [modelReady, setModelReady] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError('');
        if (typeof window === 'undefined') return;
        const w = window as any;
        if (!w.transformers && !w.Transformers) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.getElementById('xenova-transformers');
            if (existing) {
              existing.addEventListener('load', () => resolve(), { once: true });
              existing.addEventListener('error', () => reject(new Error('Failed to load transformers script')), { once: true });
              return;
            }
            const s = document.createElement('script');
            s.id = 'xenova-transformers';
            s.src = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';
            s.async = false; // ensure execution before load resolves
            // @ts-ignore
            s.defer = false;
            s.crossOrigin = 'anonymous';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load transformers script'));
            document.head.appendChild(s);
          });
          // Some environments dispatch load before globals attach; poll briefly
          const start = Date.now();
          while (!w.transformers && !w.Transformers && Date.now() - start < 3000) {
            await new Promise((r) => setTimeout(r, 50));
          }
        }
        if (cancelled) return;
        const tf = (window as any).transformers || (globalThis as any).transformers || (window as any).Transformers || (globalThis as any).Transformers;
        // If still not available, skip local model (API will be used). Do not error here.
        if (!tf) {
          return;
        }
        const { pipeline } = tf;
        // Use a small model for fast startup (runs in-browser via WASM/WebGPU)
        const p = await pipeline('text2text-generation', 'Xenova/t5-small');
        if (cancelled) return;
        pipeRef.current = p;
        setModelReady(true);
      } catch (e) {
        if (!cancelled) setError((e as Error)?.message || 'Failed to load model');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function buildPrompt(text: string) {
    const prefix = tone === 'formal'
      ? 'paraphrase formally: '
      : tone === 'casual'
      ? 'paraphrase casually: '
      : 'paraphrase: ';
    return `${prefix}${text}`;
  }

  async function paraphrase() {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      // 1) Try server API (OpenRouter)
      const r = await fetch('/api/paraphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, tone }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data?.text ?? '';
        if (text) {
          setOutput(text);
          return;
        }
      }
      // 2) Fallback to local T5
      if (!pipeRef.current) throw new Error('Model not ready');
      const res = await pipeRef.current(buildPrompt(input), { max_new_tokens: 120 });
      const text = Array.isArray(res) ? res[0]?.generated_text ?? '' : res?.generated_text ?? '';
      setOutput(text);
    } catch (e) {
      setError((e as Error)?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Text Paraphraser (Free, On-Device)</h1>
        <p className="mt-2 text-foreground/70">Runs entirely in your browser. No logins, no API keys.</p>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-3 items-start">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-3xl border bg-card p-4">
            <label className="text-sm font-medium">Input text</label>
            <textarea
              className="mt-2 w-full min-h-40 rounded-xl border bg-background p-3 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to paraphrase"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm">Tone</label>
                <select
                  className="h-9 rounded-full border bg-background px-3 text-sm"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                >
                  <option value="neutral">Neutral</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              <button
                onClick={paraphrase}
                disabled={loading || !input.trim()}
                className="inline-flex h-10 items-center rounded-full bg-primary text-white px-5 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Paraphrasing…' : 'Paraphrase'}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </div>

          <div className="rounded-3xl border bg-card p-4">
            <label className="text-sm font-medium">Output</label>
            <textarea
              readOnly
              className="mt-2 w-full min-h-40 rounded-xl border bg-background p-3 text-sm"
              value={output}
              placeholder="Your paraphrased text will appear here"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-foreground/60">Quality depends on model size; this uses a fast small model.</div>
              <button
                onClick={copy}
                disabled={!output}
                className="inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium disabled:opacity-50"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">How it works</h3>
            <p className="mt-2 text-sm text-foreground/70">A small T5 model runs in your browser using WebAssembly/WebGPU via Transformers.js. No data leaves your device.</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">Tips</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-foreground/70">
              <li>Shorter inputs generate faster results.</li>
              <li>Try different tones if results feel off.</li>
              <li>For higher quality, we can later add a larger local model option.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}


