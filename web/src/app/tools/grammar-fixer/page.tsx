'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Disclosure, DisclosureButton } from '@headlessui/react';
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline';
import FeaturedTools from '@/components/FeaturedTools';

type GrammarIssue = {
  start: number;
  end: number;
  type: string;
  message: string;
  replacement?: string;
  text?: string;
};

type GrammarResponse = {
  fixedText: string;
  issues: GrammarIssue[];
  tips: string[];
};

export default function GrammarFixerPage() {
  const [input, setInput] = React.useState('');
  const [result, setResult] = React.useState<GrammarResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showAnnotated, setShowAnnotated] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const loadingPhrases = React.useMemo(() => [
    'Analyzing…',
    'Finding issues…',
    'Applying fixes…',
    'Polishing…',
    'Finalizing…',
  ], []);
  const [loadingIdx, setLoadingIdx] = React.useState(0);

  React.useEffect(() => {
    if (!loading) return;
    setLoadingIdx(0);
    const id = window.setInterval(() => {
      setLoadingIdx((i) => (i + 1) % loadingPhrases.length);
    }, 900);
    return () => window.clearInterval(id);
  }, [loading, loadingPhrases.length]);

  const fetchFix = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch('/api/grammar-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => 'Request failed');
        throw new Error(t || 'Request failed');
      }
      const data = (await r.json()) as GrammarResponse;
      setResult(data);
    } catch (e) {
      setError((e as Error)?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyFixed = () => {
    if (!result?.fixedText) return;
    navigator.clipboard.writeText(result.fixedText).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  function normalizeIssueType(raw: string) {
    const s = (raw || '').toLowerCase();
    if (s.includes('spell')) return 'spelling';
    if (s.includes('punct') || s.includes('comma') || s.includes('period') || s.includes('semicolon') || s.includes('quote')) return 'punctuation';
    if (s.includes('style') || s.includes('clarity') || s.includes('concise') || s.includes('wordy') || s.includes('passive')) return 'style';
    if (s.includes('grammar') || s.includes('agreement') || s.includes('tense') || s.includes('article') || s.includes('preposition')) return 'grammar';
    return 'grammar';
  }

  function typeHighlightClasses(type: string) {
    const t = normalizeIssueType(type);
    if (t === 'spelling') return 'bg-red-500/10 hover:bg-red-500/20 underline decoration-wavy decoration-red-500/80';
    if (t === 'punctuation') return 'bg-blue-500/10 hover:bg-blue-500/20 underline decoration-wavy decoration-blue-500/80';
    if (t === 'style') return 'bg-violet-500/10 hover:bg-violet-500/20 underline decoration-wavy decoration-violet-500/80';
    return 'bg-amber-500/10 hover:bg-amber-500/20 underline decoration-wavy decoration-amber-500/80';
  }

  function typeBadgeClasses(type: string) {
    const t = normalizeIssueType(type);
    if (t === 'spelling') return 'bg-red-900/30 text-red-300';
    if (t === 'punctuation') return 'bg-blue-900/30 text-blue-300';
    if (t === 'style') return 'bg-violet-900/30 text-violet-300';
    return 'bg-amber-900/30 text-amber-200';
  }

  // Render annotated original text with highlights using issue ranges (code point accurate)
  function renderAnnotatedOriginal(text: string, issues: GrammarIssue[]) {
    if (!text) return null;
    if (!issues || issues.length === 0) {
      return <p className="text-sm text-foreground/70">No specific issues detected.</p>;
    }
    const codepoints = Array.from(text);
    const N = codepoints.length;
    // Re-anchor any issues with a provided snippet if indices look off
    const sorted = [...issues].sort((a, b) => a.start - b.start).map((i) => {
      let start = i.start;
      let end = i.end;
      if (i.text) {
        const snippet = i.text;
        // try exact match in codepoint-joined string
        const joined = codepoints.join('');
        let idx = joined.indexOf(snippet);
        if (idx === -1) {
          // normalize smart quotes and dashes
          const norm = (s: string) => s
            .replace(/[\u2018\u2019\u02BC]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/\u00A0/g, ' ');
          const jn = norm(joined);
          const sn = norm(snippet);
          idx = jn.indexOf(sn);
        }
        if (idx !== -1) {
          // convert char index to codepoint index (1:1 here since joined is codepoints.join(''))
          start = idx;
          end = idx + Array.from(snippet).length;
        }
      }
      return { ...i, start, end };
    });
    const clamped = sorted
      .map((i) => ({ ...i, start: Math.max(0, Math.min(N, i.start)), end: Math.max(0, Math.min(N, i.end)) }))
      .filter((i) => i.end > i.start);

    const segments: React.ReactNode[] = [];
    let cursor = 0;
    for (let idx = 0; idx < clamped.length; idx++) {
      const issue = clamped[idx];
      if (issue.start > cursor) {
        segments.push(<span key={`plain-${idx}-${cursor}`}>{codepoints.slice(cursor, issue.start).join('')}</span>);
      }
      const problem = codepoints.slice(issue.start, issue.end).join('');
      const title = [issue.type ? `[${issue.type}]` : '', issue.message].filter(Boolean).join(' ');
      segments.push(
        <span
          key={`iss-${idx}-${issue.start}-${issue.end}`}
          className={`px-0.5 rounded-sm cursor-help ${typeHighlightClasses(issue.type)}`}
          title={title}
        >
          {problem}
        </span>
      );
      cursor = issue.end;
    }
    if (cursor < N) {
      segments.push(<span key={`tail-${cursor}`}>{codepoints.slice(cursor).join('')}</span>);
    }
    return <p className="whitespace-pre-wrap break-words text-sm leading-6">{segments}</p>;
  }

  return (
    <>
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Grammar Fixer</h1>
        <p className="mt-2 text-foreground/70">Fix grammar, spelling, and punctuation. Highlight issues with explanations.</p>
      </div>

      <div className="mt-8 max-w-2xl mx-auto space-y-4">
        <div className="rounded-3xl border bg-card p-4">
          <label className="text-sm font-medium">Your text</label>
          <textarea
            className="mt-2 w-full min-h-40 rounded-xl border bg-background p-3 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your text here."
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <motion.button
              whileHover={{ scale: (loading || !input.trim()) ? 1 : 1.02 }}
              whileTap={{ scale: (loading || !input.trim()) ? 1 : 0.98 }}
              onClick={fetchFix}
              disabled={loading || !input.trim()}
              aria-busy={loading}
              className={`relative inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors shadow-sm hover:shadow disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed ${loading ? 'bg-primary/80 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
            >
              {loading && (
                <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                  <motion.span
                    className="absolute -left-1/3 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  />
                </span>
              )}
              <span className="relative z-10">{loading ? loadingPhrases[loadingIdx] : 'Fix grammar'}</span>
            </motion.button>
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        <div className="rounded-3xl border bg-card p-4">
          <label className="text-sm font-medium">{!result ? 'Tips' : 'Corrected text'}</label>
          {!result ? (
            <div className="mt-2 space-y-3 text-sm">
              <div className="text-foreground/70">Tips for clearer writing:</div>
              <ul className="list-disc pl-5 text-foreground/80">
                <li>Prefer short, direct sentences.</li>
                <li>Use consistent tense and subject-verb agreement.</li>
                <li>Read aloud to catch awkward phrasing or punctuation.</li>
              </ul>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              <motion.div
                key={`res-${result.fixedText.length}-${result.issues.length}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mt-2"
              >
                <div className="rounded-xl border border-foreground/10 bg-background/40 shadow-inner p-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Fixed version</span>
                    <div className="flex items-center gap-3">
                      <label className="hidden sm:inline-flex items-center gap-2 text-xs select-none">
                        <input type="checkbox" className="size-4" checked={showAnnotated} onChange={(e) => setShowAnnotated(e.target.checked)} />
                        <span>Show annotated original</span>
                      </label>
                      <button onClick={copyFixed} className="inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium">
                        {copied ? '✅ Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-foreground/80">{result.fixedText}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {result && (
          <div className="rounded-3xl border bg-card p-4">
            <label className="text-sm font-medium">Annotated original</label>
            <div className="mt-2">
              {showAnnotated ? (
                <div className="rounded-xl border border-foreground/10 bg-background/40 shadow-inner p-4">
                  {renderAnnotatedOriginal(input, result.issues)}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground/70">Enable "Show annotated original" to see highlights with explanations.</p>
                  <label className="inline-flex items-center gap-2 text-xs select-none sm:hidden">
                    <input type="checkbox" className="size-4" checked={showAnnotated} onChange={(e) => setShowAnnotated(e.target.checked)} />
                    <span>Show annotated</span>
                  </label>
                </div>
              )}
            </div>
            {result.issues.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium">Issues ({result.issues.length})</div>
                <ul className="mt-2 divide-y divide-foreground/10 text-sm">
                  {result.issues.map((iss, i) => (
                    <li key={i} className="py-2 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex items-center gap-2">
                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full capitalize ${typeBadgeClasses(iss.type)}`}>{iss.type || 'grammar'}</span>
                            <span className="text-foreground/80">{iss.message}</span>
                          </span>
                          <div className="mt-1 text-foreground/60">
                            <span className="text-xs">Span:</span> <code className="text-xs">[{iss.start}, {iss.end})</code>
                            {iss.text && (
                              <>
                                <span className="mx-2 text-xs">•</span>
                                <span className="text-xs">Text:</span> <span className="font-mono text-xs bg-foreground/5 px-1 rounded">{iss.text}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {iss.replacement && (
                          <div className="ml-2 shrink-0 text-xs text-foreground/70">
                            Suggestion: <span className="font-mono bg-foreground/5 px-1 rounded">{iss.replacement}</span>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="rounded-3xl border bg-card p-4">
            <label className="text-sm font-medium">Tailored tips</label>
            <ul className="mt-2 list-disc pl-5 text-sm text-foreground/80">
              {result.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        {/* FAQs */}
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold">Frequently asked questions</h3>
          <dl className="mt-4 divide-y divide-foreground/10">
            {[
              {
                question: 'Is this grammar checker free?',
                answer: 'Yes, it\'s free to use with no account required.',
              },
              {
                question: 'Do you store or use my text for training?',
                answer: 'No. Inputs are processed to generate results and not stored server-side. Always avoid pasting sensitive data.',
              },
              {
                question: 'What kinds of mistakes can it fix?',
                answer: 'It detects and suggests fixes for spelling, punctuation, grammar (tense, agreement, articles, prepositions), and style issues.',
              },
              {
                question: 'Does it keep my original meaning and tone?',
                answer: 'Yes. Corrections aim to preserve your voice while improving clarity and correctness.',
              },
              {
                question: 'Can it handle long paragraphs or essays?',
                answer: 'Short to medium passages work best for fast results. For very long documents, process them in sections.',
              },
              {
                question: 'Is it suitable for resumes, academic work, or professional emails?',
                answer: 'Yes, but you should review the suggestions before submitting important documents.',
              },
            ].map((faq) => (
              <Disclosure key={faq.question} as="div" className="py-4 first:pt-0 last:pb-0">
                {({ open }) => (
                  <div>
                    <dt>
                      <DisclosureButton className="group flex w-full items-start justify-between text-left cursor-pointer">
                        <span className="text-sm font-semibold">{faq.question}</span>
                        <span className="ml-4 flex h-7 items-center">
                          <PlusSmallIcon aria-hidden="true" className="size-5 group-data-[open]:hidden" />
                          <MinusSmallIcon aria-hidden="true" className="size-5 group-[:not([data-open])]:hidden" />
                        </span>
                      </DisclosureButton>
                    </dt>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.dd
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          style={{ overflow: 'hidden' }}
                          className="mt-2 pr-10"
                        >
                          <p className="text-sm text-foreground/70">{faq.answer}</p>
                        </motion.dd>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </Disclosure>
            ))}
          </dl>
        </div>
      </div>
    </div>
    <FeaturedTools selectedCategory="Text" titleOverride="Explore More Text Tools" headerAlign="center" />
    </>
  );
}


