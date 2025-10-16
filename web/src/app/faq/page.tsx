'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Disclosure, DisclosureButton } from '@headlessui/react';
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline';

type FaqItem = {
  question: string;
  answer: string;
};

const faqs: FaqItem[] = [
  {
    question: 'What is Toolfinity?',
    answer:
      'Toolfinity offers a suite of **free AI tools** designed for creators, students, and professionals, enabling quick and efficient access to various utilities.',
  },
  {
    question: 'Do I need to register to use the tools?',
    answer:
      'No registration is required for most tools, allowing you to use them instantly.',
  },
  {
    question: 'Is Toolfinity really free?',
    answer:
      'Yes, you can access core tools without any payment.',
  },
  {
    question: 'What types of tools are available?',
    answer:
      'You can find tools for image, video, text, music, code, and more.',
  },
  {
    question: 'How do I use the tools?',
    answer:
      'Simply pick a tool, enter your content by dropping files or pasting text, and then enjoy the results by downloading or sharing as needed.',
  },
  {
    question: 'Are the tools mobile-friendly?',
    answer:
      'Yes, Toolfinity features a responsive user interface that works well on any device.',
  },
  {
    question: 'How often are new tools added?',
    answer:
      'New tools and features are continually being introduced, typically on a weekly basis.',
  },
  {
    question: 'Is my content secure when using Toolfinity?',
    answer:
      'Yes, Toolfinity is privacy-focused, ensuring that your content stays yours.',
  },
  {
    question: 'Can I provide feedback or suggestions?',
    answer:
      'Yes, you can join the Toolfinity community via Discord for updates and discussions.',
  },
  {
    question: 'What types of content can I input into the tools?',
    answer:
      'You can use various formats including images, text files, and videos.',
  },
  {
    question: 'What happens to my content after using the tools?',
    answer:
      'You can download, share, or iterate on your content, and no account is needed for most actions.',
  },
  {
    question: 'Is there customer support available?',
    answer:
      'You can reach out through the contact options available on the site for any support-related queries.',
  },
  {
    question: 'How do I stay updated about new tools?',
    answer:
      'You can subscribe to updates or join their Discord community for the latest news and tips.',
  },
  {
    question: 'Is there a demo available to try the tools?',
    answer:
      'Yes, you can watch a demo on the website to understand how the tools work.',
  },
  {
    question: 'What is the primary goal of Toolfinity?',
    answer:
      'The goal of Toolfinity is to empower users with easy-to-use AI tools that enhance creativity and productivity.',
  },
  {
    question: 'Can I use Toolfinity for commercial purposes?',
    answer:
      'While the tools are free to use, please check the specific terms and conditions regarding commercial use.',
  },
  {
    question: 'Are there any limitations on the tools?',
    answer:
      'Most tools have no restrictions, but some may have specific limitations based on file size or content type.',
  },
  {
    question: 'What if I encounter issues while using the tools?',
    answer:
      'If you encounter issues, check the FAQ section or contact customer support for assistance.',
  },
];

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
  // line breaks
  html = html.replace(/\n/g, '<br />');
  return { __html: html };
}

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently asked questions</h1>
        <p className="mt-2 text-foreground/70">Answers about Toolfinity and how to use our free tools.</p>
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-5">
        <dl className="divide-y divide-foreground/10">
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
                        <p className="text-sm text-foreground/70" dangerouslySetInnerHTML={renderMinimalMarkdown(faq.answer)} />
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
  );
}


