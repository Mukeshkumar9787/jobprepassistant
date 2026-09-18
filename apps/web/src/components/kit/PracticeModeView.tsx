'use client';

import React, { useState, useEffect } from 'react';
import { Kit } from '@jobprep/shared';
import { apiFetch } from '../../lib/api';
import { Play, RotateCcw, CheckCircle2, ChevronRight, ChevronLeft, Eye, EyeOff, Award, TrendingDown, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

interface PracticeModeViewProps {
  kit: Kit;
  kitId: string;
}

interface WeakSpot {
  requirement_id: string;
  requirement_text: string;
  average_confidence: number;
}

interface PracticeProgressData {
  total_cards: number;
  covered_cards: number;
  average_confidence: number;
  weakest_areas: WeakSpot[];
  sessions_completed: number;
}

export function PracticeModeView({ kit, kitId }: PracticeModeViewProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [cardRatings, setCardRatings] = useState<Record<string, number>>({});
  const [progressData, setProgressData] = useState<PracticeProgressData | null>(null);
  const [starting, setStarting] = useState(false);

  const flashcards = kit.flashcards || [];
  const currentCard = flashcards[cardIndex];

  useEffect(() => {
    fetchProgress();
  }, [kitId]);

  async function fetchProgress() {
    try {
      const data = await apiFetch<{ progress: PracticeProgressData }>(`/practice/kit/${kitId}/progress`);
      setProgressData(data.progress);
    } catch {
      // Ignore if not started yet
    }
  }

  async function startSession() {
    setStarting(true);
    try {
      const data = await apiFetch<{ session: { _id: string } }>('/practice/session', {
        method: 'POST',
        body: JSON.stringify({ kitId }),
      });
      setSessionId(data.session._id);
      setCardIndex(0);
      setRevealed(false);
      setCardRatings({});
    } catch (err) {
      alert('Failed to start practice session.');
    } finally {
      setStarting(false);
    }
  }

  async function rateConfidence(rating: number) {
    if (!currentCard || !sessionId) return;

    setCardRatings((prev) => ({ ...prev, [currentCard.id]: rating }));

    try {
      await apiFetch(`/practice/session/${sessionId}/card`, {
        method: 'PUT',
        body: JSON.stringify({
          flashcard_id: currentCard.id,
          confidence: rating,
        }),
      });
    } catch (err) {
      console.warn('Failed to save rating:', err);
    }

    // Move to next card
    if (cardIndex < flashcards.length - 1) {
      setCardIndex((prev) => prev + 1);
      setRevealed(false);
    } else {
      // Session complete
      fetchProgress();
    }
  }

  if (flashcards.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-xl text-center">
        <p className="text-sm text-slate-400">No flashcards available in this kit for practice.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Session Controls & Progress Summary Header */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Play className="w-5 h-5 text-sky-400" />
            Interactive Active-Recall Practice
          </h2>
          <p className="text-xs text-slate-400 mt-1">Test your memory and receive real-time confidence analytics & weak spot reports</p>
        </div>

        <button
          onClick={startSession}
          disabled={starting}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2"
        >
          {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          {sessionId ? 'Restart Session' : 'Start Practice Session'}
        </button>
      </div>

      {/* Main Flashcard Practice Box */}
      {sessionId ? (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Card Counter */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Card {cardIndex + 1} of {flashcards.length}</span>
            <span>ID: {currentCard.id}</span>
          </div>

          {/* Flip Card */}
          <div
            onClick={() => setRevealed(!revealed)}
            className="glass-panel p-8 rounded-2xl border-slate-800 min-h-[260px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-sky-500/50 transition-all shadow-xl relative group"
          >
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest absolute top-4 left-4 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
              {revealed ? 'Answer Key (Click to Flip)' : 'Prompt (Click to Flip)'}
            </span>

            <div className="my-auto px-4">
              {!revealed ? (
                <h3 className="text-xl font-bold text-slate-100 leading-snug">{currentCard.front}</h3>
              ) : (
                <p className="text-base text-slate-200 font-mono leading-relaxed bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-left">
                  {currentCard.back}
                </p>
              )}
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5 absolute bottom-4">
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {revealed ? 'Click to show prompt' : 'Click to reveal answer'}
            </div>
          </div>

          {/* Rating Scale Buttons (1-5) */}
          {revealed && (
            <div className="glass-panel p-6 rounded-2xl border-slate-800 text-center space-y-3 animate-fade-in">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">How confident were you with this answer?</h4>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { rating: 1, label: 'Again', color: 'hover:bg-red-500/20 text-red-400 border-red-500/30' },
                  { rating: 2, label: 'Hard', color: 'hover:bg-orange-500/20 text-orange-400 border-orange-500/30' },
                  { rating: 3, label: 'Good', color: 'hover:bg-amber-500/20 text-amber-400 border-amber-500/30' },
                  { rating: 4, label: 'Easy', color: 'hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                  { rating: 5, label: 'Mastered', color: 'hover:bg-sky-500/20 text-sky-400 border-sky-500/30' },
                ].map((btn) => (
                  <button
                    key={btn.rating}
                    onClick={() => rateConfidence(btn.rating)}
                    className={`p-3 bg-slate-900 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${btn.color}`}
                  >
                    <span className="text-base font-extrabold">{btn.rating}</span>
                    <span className="text-[10px] font-normal">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Weak Spots Report (Creative Feature - Section 5 of Brief) */}
      {progressData && (
        <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-400" />
                Weak Spots & Mastery Report
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Aggregated analytics across your active-recall practice sessions</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-slate-300">
                Average Confidence: <span className="text-sky-400 font-mono font-bold text-sm">{progressData.average_confidence} / 5</span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Targeted Weak Areas (Lowest Average Confidence)
            </h4>

            {progressData.weakest_areas.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Complete a practice session to generate your weak spots report.</p>
            ) : (
              <div className="space-y-2">
                {progressData.weakest_areas.map((ws) => (
                  <div key={ws.requirement_id} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono font-bold text-amber-400">{ws.requirement_id}</span>
                      <p className="text-xs font-medium text-slate-200">{ws.requirement_text}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                        {ws.average_confidence} / 5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
