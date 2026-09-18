'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { apiFetch } from '../../../lib/api';
import { Sparkles, Building2, Globe, Calendar, FileText, Upload, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function NewKitPage() {
  const [mode, setMode] = useState<'single' | 'batch'>('single');

  // Single form state
  const [jdText, setJdText] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [daysAvailable, setDaysAvailable] = useState(5);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Batch form state
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchStatus, setBatchStatus] = useState('');

  const router = useRouter();

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (jdText.trim().length < 20) {
      setError('Job description must be at least 20 characters long.');
      return;
    }

    if (!companyUrl.trim()) {
      setError('Company website URL is required.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiFetch<{ id: string }>('/kits', {
        method: 'POST',
        body: JSON.stringify({
          jdText,
          companyUrl: companyUrl.trim(),
          daysAvailable,
        }),
      });

      router.push(`/kits/${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger kit generation.');
      setSubmitting(false);
    }
  }

  async function handleBatchFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBatchFile(file);
    setError('');

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        setError('Batch JSON file must contain an array of objects.');
        return;
      }

      setBatchStatus(`Parsed file with ${parsed.length} role pairs. Submitting batch...`);
      setSubmitting(true);

      let createdCount = 0;
      let firstCreatedId = '';

      for (const item of parsed) {
        if (item.jd && item.company_url) {
          const res = await apiFetch<{ id: string }>('/kits', {
            method: 'POST',
            body: JSON.stringify({
              jdText: item.jd,
              companyUrl: item.company_url,
              daysAvailable: item.days || 5,
            }),
          });
          createdCount++;
          if (!firstCreatedId) firstCreatedId = res.id;
        }
      }

      setBatchStatus(`Successfully created ${createdCount} kits! Redirecting...`);
      setTimeout(() => {
        router.push(firstCreatedId ? `/kits/${firstCreatedId}` : '/dashboard');
      }, 1500);
    } catch (err: any) {
      setError('Invalid JSON file format. Ensure it strictly matches array of { id, jd, company_url, days }.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            AI Research Pipeline
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100">Create Interview Prep Kit</h1>
          <p className="text-sm text-slate-400 mt-1">
            Provide the job details and company site — our autonomous crawler and LLM will handle the rest.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-8 max-w-md mx-auto sm:mx-0">
          <button
            onClick={() => setMode('single')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              mode === 'single'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Single Job Description
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              mode === 'batch'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Batch File Upload
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="glass-panel p-8 rounded-2xl space-y-6 border-slate-800 shadow-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                Company Website Address *
              </label>
              <input
                type="text"
                required
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://gitlab.com or https://posthog.com"
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Our agent will crawl this site to find hiring pages, engineering handbook, and company values.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  Days Available for Prep *
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={daysAvailable}
                  onChange={(e) => setDaysAvailable(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  The schedule allocator will distribute topics across exactly this many days.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                Job Description Text *
              </label>
              <textarea
                required
                rows={10}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the complete job description here..."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Initiating AI Crawler & Generator...
                </>
              ) : (
                <>
                  Generate Prep Kit Now
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="glass-panel p-8 rounded-2xl border-slate-800 shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-100 mb-2">Upload Batch Cases JSON</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Upload a JSON file containing an array of description-and-company pairs to prepare for multiple roles simultaneously.
            </p>

            <label className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-600/20 cursor-pointer transition-all">
              <Upload className="w-5 h-5" />
              Select JSON File
              <input
                type="file"
                accept=".json"
                onChange={handleBatchFileUpload}
                className="hidden"
              />
            </label>

            {batchStatus && (
              <p className="text-sm text-sky-400 mt-4 font-medium animate-pulse">
                {batchStatus}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
