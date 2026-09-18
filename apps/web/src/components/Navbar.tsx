'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/auth';
import { Sparkles, LogOut, User as UserIcon, PlusCircle, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-sky-400">
              PrepKit AI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <Link
                  href="/kits/new"
                  className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Kit
                </Link>

                <div className="h-4 w-px bg-slate-800" />

                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden md:inline">{user.email}</span>
                </div>

                <button
                  onClick={() => logout()}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-md shadow-sky-600/20 transition-all"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
