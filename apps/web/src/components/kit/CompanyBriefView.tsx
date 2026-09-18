'use client';

import React, { useState } from 'react';
import { CompanyBrief } from '@jobprep/shared';
import { Building2, Globe, ExternalLink, Edit3, Save, RotateCw, Loader2, Sparkles } from 'lucide-react';

interface CompanyBriefViewProps {
  brief: CompanyBrief;
  onUpdate: (updatedBrief: CompanyBrief) => void;
  onRegenerate: () => Promise<void>;
}

export function CompanyBriefView({ brief, onUpdate, onRegenerate }: CompanyBriefViewProps) {
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(brief.summary || '');
  const [whatTheyDo, setWhatTheyDo] = useState(brief.what_they_do || '');
  const [culture, setCulture] = useState(brief.culture || '');
  const [hiringProcess, setHiringProcess] = useState(brief.hiring_process || '');
  const [interviewTips, setInterviewTips] = useState(brief.interview_tips || '');
  const [regenerating, setRegenerating] = useState(false);

  function handleSave() {
    onUpdate({
      ...brief,
      summary,
      what_they_do: whatTheyDo,
      culture,
      hiring_process: hiringProcess,
      interview_tips: interviewTips,
      _meta: { origin: 'user', edited: true, pinned: true },
    } as any);
    setEditing(false);
  }

  async function handleRegen() {
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            Company Intelligence Brief
          </h2>
          <p className="text-xs text-slate-400 mt-1">Research gathered from company site crawling and public interview discussions</p>
        </div>

        <div className="flex items-center gap-3">
          {editing ? (
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Inline
            </button>
          )}

          <button
            onClick={handleRegen}
            disabled={regenerating}
            className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Regenerate company brief"
          >
            {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
            Regenerate Section
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-4 font-sans text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Summary</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">What They Do</label>
            <textarea
              rows={4}
              value={whatTheyDo}
              onChange={(e) => setWhatTheyDo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Culture & Values</label>
            <textarea
              rows={3}
              value={culture}
              onChange={(e) => setCulture(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Hiring Process Details</label>
            <textarea
              rows={3}
              value={hiringProcess}
              onChange={(e) => setHiringProcess(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Interview Tips</label>
            <textarea
              rows={3}
              value={interviewTips}
              onChange={(e) => setInterviewTips(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Summary & Core Product</h3>
            <p className="text-sm text-slate-200 leading-relaxed">{brief.summary}</p>
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-400 mb-1">What They Do</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{brief.what_they_do}</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Hiring Process & Interview Tips</h3>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-1">Hiring Process</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{brief.hiring_process || 'No explicit hiring page was discovered on their website.'}</p>
            </div>
            {brief.interview_tips && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-slate-400 mb-1">Interview Tips</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{brief.interview_tips}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sources list */}
      {brief.sources && brief.sources.length > 0 && (
        <div className="glass-panel p-4 rounded-xl border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            Research Sources Crawled ({brief.sources.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {brief.sources.map((src, idx) => (
              <a
                key={idx}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800"
              >
                <ExternalLink className="w-3 h-3" />
                {src}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
