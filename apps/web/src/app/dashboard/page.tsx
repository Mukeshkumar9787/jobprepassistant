'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth';
import { Navbar } from '../../components/Navbar';
import { apiFetch } from '../../lib/api';
import { PlusCircle, Building2, Calendar, BookOpen, Trash2, ExternalLink, Loader2, Sparkles, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface KitSummary {
  _id: string;
  status: 'pending' | 'researching' | 'generating' | 'ready' | 'failed';
  source?: {
    company: string;
    company_url: string;
    role: string;
  };
  daysAvailable: number;
  createdAt: string;
  generationProgress?: {
    currentStep: string;
  };
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [kits, setKits] = useState<KitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchKits();
    }
  }, [user, authLoading, router]);

  async function fetchKits() {
    try {
      const data = await apiFetch<{ kits: KitSummary[] }>('/kits');
      setKits(data.kits);
    } catch (err) {
      console.error('Failed to fetch kits:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this prep kit?')) return;

    setDeletingId(id);
    try {
      await apiFetch(`/kits/${id}`, { method: 'DELETE' });
      setKits((prev) => prev.filter((k) => k._id !== id));
    } catch (err) {
      alert('Failed to delete kit.');
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100">Your Prep Kits</h1>
            <p className="text-sm text-slate-400 mt-1">Manage and practice against your tailored interview preparation kits</p>
          </div>

          <Link
            href="/kits/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-600/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-5 h-5" />
            Create Prep Kit
          </Link>
        </div>

        {kits.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center max-w-lg mx-auto border-dashed border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">No Prep Kits Yet</h3>
            <p className="text-sm text-slate-400 mb-6">
              Paste a job description and company URL to generate your first comprehensive interview kit.
            </p>
            <Link
              href="/kits/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-600/20 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Build Your First Kit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kits.map((kit) => (
              <Link
                key={kit._id}
                href={`/kits/${kit._id}`}
                className="glass-panel p-6 rounded-2xl glass-panel-hover flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {kit.source?.company || 'Company Target'}
                    </span>

                    {/* Status Badge */}
                    {kit.status === 'ready' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    )}
                    {['pending', 'researching', 'generating'].includes(kit.status) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Loader2 className="w-3 h-3 animate-spin" /> Generating
                      </span>
                    )}
                    {kit.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        <AlertTriangle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-sky-400 transition-colors line-clamp-1">
                    {kit.source?.role || 'Interview Prep Kit'}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    {kit.source?.company_url || ''}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {kit.daysAvailable} days schedule
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(kit._id, e)}
                    disabled={deletingId === kit._id}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-colors"
                    title="Delete kit"
                  >
                    {deletingId === kit._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
