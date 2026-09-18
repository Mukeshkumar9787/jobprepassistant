'use client';

import React, { useState } from 'react';
import { Flashcard } from '@jobprep/shared';
import { Layers, Plus, Trash2, Edit3, Save, RotateCw, Pin } from 'lucide-react';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  onUpdateFlashcards: (cards: Flashcard[]) => void;
}

export function FlashcardsView({ flashcards, onUpdateFlashcards }: FlashcardsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  function startEditing(f: Flashcard) {
    setEditingId(f.id);
    setEditFront(f.front);
    setEditBack(f.back);
  }

  function saveEditing(fId: string) {
    const updated = flashcards.map((f) => {
      if (f.id === fId) {
        return {
          ...f,
          front: editFront,
          back: editBack,
          _meta: { origin: 'user', edited: true, pinned: true },
        };
      }
      return f;
    });

    onUpdateFlashcards(updated as any);
    setEditingId(null);
  }

  function handleDelete(fId: string) {
    if (!confirm('Delete this flashcard?')) return;
    const updated = flashcards.filter((f) => f.id !== fId);
    onUpdateFlashcards(updated);
  }

  function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const newCard: Flashcard = {
      id: `f_user_${Date.now()}`,
      front: newFront,
      back: newBack,
      requirement_ids: ['r1'],
      _meta: { origin: 'user', edited: true, pinned: true },
    } as any;

    onUpdateFlashcards([...flashcards, newCard]);
    setShowAddModal(false);
    setNewFront('');
    setNewBack('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            Flashcards Deck Manager ({flashcards.length} cards)
          </h2>
          <p className="text-xs text-slate-400 mt-1">Active recall cards generated from role requirements</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Flashcard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flashcards.map((fc) => {
          const isEditing = editingId === fc.id;
          const meta = (fc as any)._meta;
          const isPinned = meta?.pinned || meta?.edited || meta?.origin === 'user';

          return (
            <div
              key={fc.id}
              className="glass-panel p-5 rounded-xl border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {fc.id}
                  </span>

                  {isPinned && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <button
                      onClick={() => saveEditing(fc.id)}
                      className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                  ) : (
                    <button
                      onClick={() => startEditing(fc)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(fc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3 pt-2 font-sans text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Card Front (Prompt)
                    </label>
                    <input
                      type="text"
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Card Back (Answer Key)
                    </label>
                    <textarea
                      rows={3}
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-bold text-slate-100 text-sm">{fc.front}</div>
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono">
                    <span className="font-semibold text-indigo-400 block mb-1">ANSWER KEY:</span>
                    {fc.back}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Flashcard Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100">Add Custom Flashcard</h3>

            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Card Front (Question/Prompt) *
                </label>
                <input
                  type="text"
                  required
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="e.g. What is the difference between SQL and NoSQL databases?"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Card Back (Answer Key) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="Key explanation to memorize..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-sky-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow"
                >
                  Add Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
