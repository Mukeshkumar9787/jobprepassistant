import React from 'react';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { Sparkles, Globe, Brain, CalendarCheck, CheckCircle2, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous AI Research & Kit Generator
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl leading-tight sm:leading-none mb-6">
          Turn Any Job Description Into a Personalized{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400">
            Interview Prep Kit
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Paste the job posting, provide the company website, and specify your deadline. Our agent crawls the web, analyzes their hiring process, extracts requirements, and builds a day-by-day prep plan.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/kits/new"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-xl shadow-lg shadow-sky-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            Create Your Kit Now
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-300 hover:text-white glass-panel hover:bg-slate-800/60 rounded-xl transition-colors flex items-center justify-center"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full text-left">
          <div className="glass-panel p-6 rounded-2xl glass-panel-hover">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Live Web Crawling</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Crawls the company site to discover /careers, tech stack, handbook, and engineering blogs, plus public interview discussions on Reddit and Glassdoor.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl glass-panel-hover">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Multi-Pass Coverage Guarantee</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Extracts must-have vs. nice-to-have requirements, generates categorised questions, and runs automated secondary passes to close all coverage gaps.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl glass-panel-hover">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Day-by-Day Study Schedule</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Arithmetic schedule allocator distributes topics, flashcards, and exact integer durations across your exact days available. Harder topics landing first.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
