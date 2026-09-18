'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/auth';
import { Navbar } from '../../../components/Navbar';
import { apiFetch } from '../../../lib/api';
import { Kit, Question, Flashcard, CompanyBrief, QuestionCategory } from '@jobprep/shared';
import { GenerationProgressView } from '../../../components/kit/GenerationProgressView';
import { CompanyBriefView } from '../../../components/kit/CompanyBriefView';
import { RoleBreakdownView } from '../../../components/kit/RoleBreakdownView';
import { QuestionBankView } from '../../../components/kit/QuestionBankView';
import { FlashcardsView } from '../../../components/kit/FlashcardsView';
import { ScheduleView } from '../../../components/kit/ScheduleView';
import { PracticeModeView } from '../../../components/kit/PracticeModeView';
import { Building2, Briefcase, HelpCircle, Layers, Calendar, Play, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeft } from 'lucide-react';

type TabType = 'brief' | 'role' | 'questions' | 'flashcards' | 'schedule' | 'practice';

export default function KitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const kitId = resolvedParams.id;

  const { user, loading: authLoading } = useAuth();
  const [kit, setKit] = useState<Kit | null>(null);
  const [status, setStatus] = useState<string>('loading');
  const [activeTab, setActiveTab] = useState<TabType>('brief');
  const [saving, setSaving] = useState(false);
  const [progressInfo, setProgressInfo] = useState<{
    currentStep: string;
    completedSteps: string[];
    totalSteps: number;
    error?: string;
  }>({
    currentStep: 'Initializing...',
    completedSteps: [],
    totalSteps: 15,
  });

  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchKit();
    }
  }, [user, authLoading, kitId]);

  // Subscribe to SSE progress stream if kit status is pending/generating
  useEffect(() => {
    if (['pending', 'generating'].includes(status)) {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const eventSource = new EventSource(`${baseUrl}/kits/${kitId}/stream`);

      eventSource.addEventListener('progress', (e: any) => {
        const data = JSON.parse(e.data);
        setProgressInfo({
          currentStep: data.step,
          completedSteps: data.completedSteps || [],
          totalSteps: data.totalSteps || 15,
          error: data.error,
        });

        if (data.step === 'Complete') {
          eventSource.close();
          fetchKit();
        } else if (data.step === 'Failed') {
          eventSource.close();
          setStatus('failed');
        }
      });

      return () => {
        eventSource.close();
      };
    }
  }, [status, kitId]);

  async function fetchKit() {
    try {
      const data = await apiFetch<{ kit: any }>(`/kits/${kitId}`);
      const kitDoc = data.kit;
      setStatus(kitDoc.status);

      if (kitDoc.status === 'ready') {
        setKit({
          source: kitDoc.source,
          company_brief: kitDoc.company_brief,
          role: kitDoc.role,
          questions: kitDoc.questions,
          flashcards: kitDoc.flashcards,
          schedule: kitDoc.schedule,
          coverage: kitDoc.coverage,
        });
      }
    } catch (err) {
      console.error('Failed to fetch kit:', err);
      setStatus('error');
    }
  }

  async function saveFullKit(updatedKit: Kit) {
    setKit(updatedKit);
    setSaving(true);
    try {
      await apiFetch(`/kits/${kitId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedKit),
      });
    } catch (err) {
      console.error('Failed to save kit update:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateSection(section: string) {
    try {
      const data = await apiFetch<{ kit: any }>(`/kits/${kitId}/regenerate/${section}`, {
        method: 'POST',
      });
      const kitDoc = data.kit;
      setKit({
        source: kitDoc.source,
        company_brief: kitDoc.company_brief,
        role: kitDoc.role,
        questions: kitDoc.questions,
        flashcards: kitDoc.flashcards,
        schedule: kitDoc.schedule,
        coverage: kitDoc.coverage,
      });
    } catch (err: any) {
      alert(`Regeneration failed: ${err.message}`);
    }
  }

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (['pending', 'generating'].includes(status)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <GenerationProgressView
          currentStep={progressInfo.currentStep}
          completedSteps={progressInfo.completedSteps}
          totalSteps={progressInfo.totalSteps}
          error={progressInfo.error}
        />
      </div>
    );
  }

  if (status === 'failed' || !kit) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto my-auto text-center p-8 glass-panel rounded-2xl">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">Generation Failed</h2>
          <p className="text-sm text-slate-400 mb-6">
            {progressInfo.error || 'Failed to crawl company site or generate kit.'}
          </p>
          <button
            onClick={() => router.push('/kits/new')}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      {/* Top Header Bar */}
      <header className="glass-panel border-b border-slate-800/80 bg-slate-900/60 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {kit.source.company}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">{kit.source.company_url}</span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-100">{kit.role.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coverage Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Coverage ({kit.coverage.passes} Pass{kit.coverage.passes > 1 ? 'es' : ''})
            </span>

            {saving && (
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 overflow-x-auto pt-2 border-t border-slate-800/40">
          {[
            { id: 'brief', label: 'Company Brief', icon: Building2 },
            { id: 'role', label: 'Role Breakdown', icon: Briefcase },
            { id: 'questions', label: `Questions (${kit.questions.length})`, icon: HelpCircle },
            { id: 'flashcards', label: `Flashcards (${kit.flashcards.length})`, icon: Layers },
            { id: 'schedule', label: `Schedule (${kit.schedule.days_available}d)`, icon: Calendar },
            { id: 'practice', label: 'Practice Mode', icon: Play, highlight: true },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                } ${tab.highlight && !isActive ? 'text-indigo-400' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'brief' && (
          <CompanyBriefView
            brief={kit.company_brief}
            onUpdate={(updatedBrief) => saveFullKit({ ...kit, company_brief: updatedBrief })}
            onRegenerate={() => handleRegenerateSection('brief')}
          />
        )}

        {activeTab === 'role' && <RoleBreakdownView role={kit.role} />}

        {activeTab === 'questions' && (
          <QuestionBankView
            questions={kit.questions}
            onUpdateQuestions={(updatedQuestions) => saveFullKit({ ...kit, questions: updatedQuestions })}
            onRegenerateCategory={(category) => handleRegenerateSection(category)}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView
            flashcards={kit.flashcards}
            onUpdateFlashcards={(updatedCards) => saveFullKit({ ...kit, flashcards: updatedCards })}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            schedule={kit.schedule}
            questions={kit.questions}
            onRegenerateSchedule={() => handleRegenerateSection('schedule')}
          />
        )}

        {activeTab === 'practice' && <PracticeModeView kit={kit} kitId={kitId} />}
      </main>
    </div>
  );
}
