'use client';

import * as React from 'react';

export default function ModelMatchmakerPage() {
  const [goal, setGoal] = React.useState('I want help with my trigonometry homework');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ modelId: string; modelName: string; summary: string } | null>(null);
  const [error, setError] = React.useState('');

  async function submit() {
    if (!goal.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch('/api/model-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });
      if (!r.ok) throw new Error(await r.text().catch(() => 'Request failed'));
      const data = await r.json();
      setResult(data);
    } catch (e) {
      setError((e as Error)?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Model Matchmaker</h1>
        <p className="mt-2 text-foreground/70">Describe your task. We recommend one AI model and explain why.</p>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-3 items-start">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-3xl border bg-card p-4">
            <label className="text-sm font-medium">Your task or problem</label>
            <textarea
              className="mt-2 w-full min-h-40 rounded-xl border bg-background p-3 text-sm"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., I need to extract tables from scanned PDFs and summarize them."
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-xs text-foreground/60">Tip: include modality (text/vision/audio), coding/math needs, and constraints.</div>
              <button
                onClick={submit}
                disabled={loading || !goal.trim()}
                className="inline-flex h-10 items-center rounded-full bg-primary text-white px-5 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Matching…' : 'Find the best model'}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </div>

          {result && (
            <div className="rounded-3xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-foreground/60">Recommended model</div>
                  <h2 className="text-lg font-semibold">{result.modelName}</h2>
                  <div className="text-xs text-foreground/60 font-mono">{result.modelId}</div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(result.modelId).catch(() => {})}
                  className="inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium hover:bg-muted"
                >
                  Copy model id
                </button>
              </div>
              <p className="mt-3 text-sm text-foreground/80">{result.summary}</p>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">What it considers</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-foreground/70">
              <li>Modality needs (text, images, audio)</li>
              <li>Math/coding ability and tool-use</li>
              <li>Context length, speed, and cost</li>
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">Privacy & cost</h3>
            <p className="mt-2 text-sm text-foreground/70">This calls a model through your server using your API key. Some providers may use prompts/responses to improve future models.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}


