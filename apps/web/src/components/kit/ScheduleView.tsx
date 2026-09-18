'use client';

import React from 'react';
import { KitSchedule, Question } from '@jobprep/shared';
import { Calendar, Clock, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface ScheduleViewProps {
  schedule: KitSchedule;
  questions: Question[];
  onRegenerateSchedule: () => Promise<void>;
}

export function ScheduleView({ schedule, questions, onRegenerateSchedule }: ScheduleViewProps) {
  const questionMap = new Map<string, Question>();
  for (const q of questions) {
    questionMap.set(q.id, q);
  }

  const totalMinutes = schedule.days.reduce((acc, d) => acc + d.minutes, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            Day-by-Day Preparation Plan ({schedule.days_available} Days)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic arithmetic allocation — total time: {Math.round(totalMinutes / 60)}h {totalMinutes % 60}m across {schedule.days_available} days
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
            <ShieldCheck className="w-4 h-4" /> Harder Material First Guaranteed
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {schedule.days.map((day) => {
          return (
            <div
              key={day.day}
              className="glass-panel p-6 rounded-2xl border-slate-800/80 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-sky-600/20 border border-sky-500/30 text-sky-400 font-extrabold text-sm flex items-center justify-center">
                    D{day.day}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{day.focus}</h3>
                    <p className="text-xs text-slate-400">Day {day.day} of {schedule.days_available}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 border border-slate-800 text-sky-400 text-xs font-mono font-bold rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {day.minutes} Integer Minutes
                  </span>
                </div>
              </div>

              {/* Questions assigned to this day */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Target Questions & Practice Items ({day.question_ids.length})
                </h4>

                {day.question_ids.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Review day / mock interview preparation.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {day.question_ids.map((qId) => {
                      const q = questionMap.get(qId);
                      return (
                        <div key={qId} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-sky-400">{qId}</span>
                            {q && (
                              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                q.difficulty === 3 ? 'bg-red-500/10 text-red-400' :
                                q.difficulty === 2 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                Level {q.difficulty} • {q.category}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-200 line-clamp-2">
                            {q ? q.prompt : `Question ${qId}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
