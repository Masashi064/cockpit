// app/contact/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

type Category = 'bug' | 'feature' | 'other';

export default function ContactPage() {
  const [category, setCategory] = useState<Category>('feature');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!message.trim()) {
      setError('Please enter your message.');
      return;
    }

    setSubmitting(true);
    try {
      const userAgent =
        typeof navigator !== 'undefined' ? navigator.userAgent : null;
      const pagePath =
        typeof window !== 'undefined' ? window.location.pathname : null;

      // inside handleSubmit in app/contact/page.tsx
      const { error: insertError } = await supabase
        .from('vol_feedback')
        .insert({
          category,
          message,
          contact: contact || null,
          user_agent: userAgent,
          page_path: pagePath,
        });

      if (insertError) {
        // Log details
        console.error('insertError message:', (insertError as any).message);
        console.error('insertError code:', (insertError as any).code);
        console.error('insertError details:', (insertError as any).details);

        // Optional: visualize via alert
        alert(
          'Supabase Error:\n' +
          JSON.stringify(insertError, null, 2),
        );

        setError(
          'An error occurred while sending. Please try again later.',
        );
        return;
      }

      setMessage('');
      setContact('');
      setCategory('feature');
      setInfo(
        'Thank you for your feedback! We will use it to improve this site.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-xl px-4 py-8">
        {/* Icon + title + intro */}
        <div className="mb-4 flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">Feedback</h1>
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-400">
          You can use this form to report bugs or suggest new features for this site.
          I may not be able to reply to every message, but all feedback will be used
          to improve the service.
        </p>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow"
        >
          {/* Type */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Type
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCategory('bug')}
                className={
                  category === 'bug'
                    ? 'rounded-full bg-rose-500/20 px-3 py-1 font-semibold text-rose-300'
                    : 'rounded-full bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700'
                }
              >
                Bug
              </button>
              <button
                type="button"
                onClick={() => setCategory('feature')}
                className={
                  category === 'feature'
                    ? 'rounded-full bg-sky-500/20 px-3 py-1 font-semibold text-sky-300'
                    : 'rounded-full bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700'
                }
              >
                Feature request
              </button>
              <button
                type="button"
                onClick={() => setCategory('other')}
                className={
                  category === 'other'
                    ? 'rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-300'
                    : 'rounded-full bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700'
                }
              >
                Other
              </button>
            </div>
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Message (required)
            </label>
            <textarea
              className="h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              placeholder="e.g. Something does not work as expected, error details, etc."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Contact info */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Contact info (optional)
            </label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              placeholder="Email address or X (Twitter) handle (only if you need a reply)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              I can’t promise individual replies, but I may contact you depending on your message.
            </p>
          </div>

          {/* Error / Info */}
          {error && (
            <div className="mb-3 text-xs text-rose-300">{error}</div>
          )}
          {info && (
            <div className="mb-3 text-xs text-emerald-300">{info}</div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
