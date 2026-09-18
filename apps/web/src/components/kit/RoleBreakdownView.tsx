'use client';

import React from 'react';
import { KitRole, Requirement } from '@jobprep/shared';
import { Briefcase, CheckCircle2, ShieldAlert, Code2, Users, Compass } from 'lucide-react';

interface RoleBreakdownViewProps {
  role: KitRole;
}

export function RoleBreakdownView({ role }: RoleBreakdownViewProps) {
  const mustReqs = role.requirements.filter((r) => r.priority === 'must');
  const niceReqs = role.requirements.filter((r) => r.priority === 'nice');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-sky-400" />
            Role Breakdown & Requirements
          </h2>
          <p className="text-xs text-slate-400 mt-1">Extracted from job posting with must vs. nice priority classification</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold rounded-full">
            {role.seniority || 'Mid-Senior'} Level
          </span>
        </div>
      </div>

      {/* Key Responsibilities */}
      {role.responsibilities && role.responsibilities.length > 0 && (
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Responsibilities</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300">
            {role.responsibilities.map((resp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Must-Have Requirements */}
        <div className="glass-panel p-5 rounded-xl border-amber-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Must-Have Requirements ({mustReqs.length})
            </h3>
            <span className="text-xs text-amber-400/80 font-medium">Critical focus area</span>
          </div>

          <div className="space-y-2.5">
            {mustReqs.map((req) => (
              <div key={req.id} className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {req.id}
                    </span>
                    <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1">
                      {req.kind === 'technical' && <Code2 className="w-3 h-3 text-sky-400" />}
                      {req.kind === 'behavioural' && <Users className="w-3 h-3 text-indigo-400" />}
                      {req.kind === 'domain' && <Compass className="w-3 h-3 text-purple-400" />}
                      {req.kind}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{req.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nice-to-Have Requirements */}
        <div className="glass-panel p-5 rounded-xl border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Nice-to-Have Requirements ({niceReqs.length})
            </h3>
            <span className="text-xs text-slate-500">Bonus points</span>
          </div>

          <div className="space-y-2.5">
            {niceReqs.map((req) => (
              <div key={req.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {req.id}
                    </span>
                    <span className="text-xs uppercase font-semibold text-slate-500 flex items-center gap-1">
                      {req.kind}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{req.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
