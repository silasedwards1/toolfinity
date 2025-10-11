'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Disclosure, DisclosureButton } from '@headlessui/react';
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline';

type ToneResult = { tone: string; summary: string; suggestions: string[] };

export default function EmailToneCheckerPage() {
  const [input, setInput] = React.useState('Paste your email here.');
  const [result, setResult] = React.useState<ToneResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [howOpen, setHowOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  function toneBadgeClasses(t: string) {
    const tone = (t || '').toLowerCase();
    if (tone.includes('harsh') || tone.includes('frustrated') || tone.includes('urgent')) {
      return 'bg-red-900/30 text-red-300';
    }
    if (tone.includes('apologetic')) {
      return 'bg-amber-900/30 text-amber-300';
    }
    if (tone.includes('friendly') || tone.includes('informal')) {
      return 'bg-teal-900/30 text-teal-300';
    }
    if (tone.includes('formal') || tone.includes('professional')) {
      return 'bg-blue-900/30 text-blue-300';
    }
    if (tone.includes('neutral')) {
      return 'bg-zinc-800/60 text-zinc-300';
    }
    return 'bg-zinc-800/60 text-zinc-300';
  }

  function escapeHtml(raw: string) {
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderMinimalMarkdown(raw: string) {
    let html = escapeHtml(raw);
    // bold **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // italics *text*
    html = html.replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`);
    // allow underline via <u>...</u> (whitelisted)
    html = html.replace(/&lt;u&gt;/g, '<u>').replace(/&lt;\/u&gt;/g, '</u>');
    // line breaks
    html = html.replace(/\n/g, '<br />');
    return { __html: html };
  }

  async function analyze() {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch('/api/email-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => 'Request failed');
        throw new Error(t || 'Request failed');
      }
      const data = (await r.json()) as ToneResult;
      setResult(data);
    } catch (e) {
      setError((e as Error)?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!result) return;
    const text = [
      `Tone: ${result.tone}`,
      `Summary: ${result.summary}`,
      'Suggestions:',
      ...result.suggestions.map((s, i) => `${i + 1}. ${s}`),
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  const faqs = [
    {
      question: 'Is this email tone checker free to use?',
      answer:
        'Yes. It uses the server\'s OpenAI API key. There are no logins on this page.',
    },
    {
      question: 'Does my email stay private?',
      answer:
        'Your input is sent securely to OpenAI through the server key to analyze tone. We do not store your email content server-side.',
    },
    {
      question: 'What does the result include?',
      answer:
        'You get an overall tone classification, a one-line summary, and 3–6 specific suggestions to improve clarity or professionalism.',
    },
    {
      question: 'Will it rewrite my email?',
      answer:
        'This tool focuses on analysis and suggestions. You can apply the tips manually or use the paraphraser tool to rewrite.',
    },
    {
      question: 'Which languages are supported?',
      answer:
        'English works best. Other languages may work but quality can vary.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Email Tone Checker</h1>
        <p className="mt-2 text-foreground/70">Paste your email to see its tone and how to improve it.</p>
      </div>

      <div className="mt-8 max-w-2xl mx-auto space-y-4">
          <div className="rounded-3xl border bg-card p-4">
            <label className="text-sm font-medium">Your email</label>
            <textarea
              className="mt-2 w-full min-h-40 rounded-xl border bg-background p-3 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your email here to analyze tone"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <motion.button
                whileHover={{ scale: (loading || !input.trim()) ? 1 : 1.02 }}
                whileTap={{ scale: (loading || !input.trim()) ? 1 : 0.98 }}
                onClick={analyze}
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
                <span className="relative z-10">{loading ? 'Analyzing…' : 'Analyze tone'}</span>
              </motion.button>
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </div>

          <div className="rounded-3xl border bg-card p-4">
            <label className="text-sm font-medium">{!result ? 'Tips' : 'Results'}</label>
            {!result ? (
              <div className="mt-2 space-y-3 text-sm">
                <div className="text-foreground/70">Tips for an effective, professional email:</div>
                <ul className="list-disc pl-5 text-foreground/80">
                  <li>Keep emails concise with one clear ask.</li>
                  <li>Use a polite greeting and clear subject line.</li>
                  <li>Read aloud to catch unintended tone.</li>
                </ul>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                <motion.div
                  key={`res-${result.tone}-${result.summary.length}-${result.suggestions.length}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="mt-2"
                >
                  <div className="rounded-xl border border-foreground/10 bg-background/40 shadow-inner p-4 space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Tone:</span>
                      <span className={`inline-block px-2 py-1 rounded text-sm capitalize ${toneBadgeClasses(result.tone)}`}>{result.tone}</span>
                    </div>
                    <div>
                      <span className="font-medium">Summary:</span>
                      <div className="mt-1 text-foreground/80" dangerouslySetInnerHTML={renderMinimalMarkdown(result.summary)} />
                    </div>
                    <div>
                      <span className="font-medium">Suggestions:</span>
                      <ul className="mt-2 divide-y divide-foreground/10 text-foreground/80">
                        {result.suggestions.map((s, idx) => (
                          <li key={idx} className="py-2 first:pt-0 last:pb-0 flex items-start gap-2">
                            <span aria-hidden>💡</span>
                            <span dangerouslySetInnerHTML={renderMinimalMarkdown(s)} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
            <hr className="my-3 border-foreground/10" />
            <div className="mt-1 flex items-center justify-between">
              <div className="text-xs text-foreground/60">Results are AI-generated; review before sending important emails.</div>
              <button
                onClick={copy}
                disabled={!result}
                className="inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium disabled:opacity-50"
              >
                {copied ? '✅ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card">
            <button
              type="button"
              onClick={() => setHowOpen((v) => !v)}
              className="w-full p-5 flex items-center justify-between cursor-pointer text-left"
            >
              <span className="text-sm font-semibold flex items-center gap-2"><span aria-hidden>🧩</span> How it works</span>
              <span className={`transition-transform ${howOpen ? 'rotate-180' : 'rotate-0'}`} aria-hidden>▾</span>
            </button>
            <AnimatePresence initial={false}>
              {howOpen && (
                <motion.div
                  key="how"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="px-5 pb-5">
                    <p className="mt-2 text-sm text-foreground/70">
                      This tool calls a server API that uses OpenAI to analyze your email and return the overall tone
                      plus targeted suggestions to improve clarity and professionalism. We do not store your inputs.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">Frequently asked questions</h3>
            <dl className="mt-4 divide-y divide-foreground/10">
              {faqs.map((faq) => (
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
  );
}


