'use client';

import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Sparkles, Globe, Brain, Calendar, ShieldCheck } from 'lucide-react';

interface GenerationProgressProps {
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  error?: string;
}

export function GenerationProgressView({
  currentStep,
  completedSteps = [],
  totalSteps = 15,
  error,
}: GenerationProgressProps) {
  const percent = Math.min(100, Math.round(((completedSteps.length + 1) / totalSteps) * 100));

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-sky-500/10">
        {error ? (
          <AlertTriangle className="w-10 h-10 text-red-400" />
        ) : (
          <Sparkles className="w-10 h-10 animate-pulse" />
        )}
      </div>

      <h2 className="text-2xl font-extrabold text-slate-100 mb-2">
        {error ? 'Generation Encountered an Error' : 'Generating Your Prep Kit...'}
      </h2>

      <p className="text-sm text-slate-400 mb-8">
        {error
          ? error
          : 'Our agent is crawling the company site, searching public discussions, and generating structured questions.'}
      </p>

      {!error && (
        <>
          {/* Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden mb-6 p-0.5">
            <div
              className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-6 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {currentStep || 'Processing...'}
          </p>

          {/* Live Step Log */}
          <div className="glass-panel p-4 rounded-xl text-left max-h-48 overflow-y-auto font-mono text-xs space-y-2 border-slate-800">
            {completedSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
