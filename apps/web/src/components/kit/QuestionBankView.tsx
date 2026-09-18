'use client';

import React, { useState } from 'react';
import { Question, QuestionCategory } from '@jobprep/shared';
import { HelpCircle, Plus, Trash2, Edit3, Save, RotateCw, GripVertical, Check, ShieldCheck, Code2, Users, Compass, Cpu, Pin } from 'lucide-react';

interface QuestionBankViewProps {
  questions: Question[];
  onUpdateQuestions: (updatedQuestions: Question[]) => void;
  onRegenerateCategory: (category: QuestionCategory) => Promise<void>;
}

const CATEGORIES: QuestionCategory[] = ['technical', 'behavioural', 'system-design', 'company-fit'];

export function QuestionBankView({
  questions,
  onUpdateQuestions,
  onRegenerateCategory,
}: QuestionBankViewProps) {
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>('technical');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editOutline, setEditOutline] = useState('');
  const [editCategory, setEditCategory] = useState<QuestionCategory>('technical');
  const [editDifficulty, setEditDifficulty] = useState<1 | 2 | 3>(2);
  const [regeneratingCategory, setRegeneratingCategory] = useState<QuestionCategory | null>(null);

  // New question state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [newOutline, setNewOutline] = useState('');
  const [newCategory, setNewCategory] = useState<QuestionCategory>('technical');
  const [newDifficulty, setNewDifficulty] = useState<1 | 2 | 3>(2);

  const categoryQuestions = questions.filter((q) => q.category === activeCategory);

  function startEditing(q: Question) {
    setEditingId(q.id);
    setEditPrompt(q.prompt);
    setEditOutline(q.answer_outline);
    setEditCategory(q.category);
    setEditDifficulty(q.difficulty);
  }

  function saveEditing(qId: string) {
    const updated = questions.map((q) => {
      if (q.id === qId) {
        return {
          ...q,
          prompt: editPrompt,
          answer_outline: editOutline,
          category: editCategory,
          difficulty: editDifficulty,
          _meta: { origin: 'user', edited: true, pinned: true },
        };
      }
      return q;
    });

    onUpdateQuestions(updated as any);
    setEditingId(null);
  }

  function handleDelete(qId: string) {
    if (!confirm('Delete this question from your kit?')) return;
    const updated = questions.filter((q) => q.id !== qId);
    onUpdateQuestions(updated);
  }

  function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    const newQuestion: Question = {
      id: `q_user_${Date.now()}`,
      requirement_ids: ['r1'],
      category: newCategory,
      prompt: newPrompt,
      answer_outline: newOutline,
      difficulty: newDifficulty,
      _meta: { origin: 'user', edited: true, pinned: true },
    } as any;

    onUpdateQuestions([...questions, newQuestion]);
    setShowAddModal(false);
    setNewPrompt('');
    setNewOutline('');
  }

  async function handleRegenerate(cat: QuestionCategory) {
    setRegeneratingCategory(cat);
    try {
      await onRegenerateCategory(cat);
    } finally {
      setRegeneratingCategory(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            Categorised Question Bank ({questions.length} total)
          </h2>
          <p className="text-xs text-slate-400 mt-1">Reorder, edit, move between categories, or regenerate specific sections</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Custom Question
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
        {CATEGORIES.map((cat) => {
          const count = questions.filter((q) => q.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
                activeCategory === cat
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'technical' && <Code2 className="w-3.5 h-3.5" />}
              {cat === 'behavioural' && <Users className="w-3.5 h-3.5" />}
              {cat === 'system-design' && <Cpu className="w-3.5 h-3.5" />}
              {cat === 'company-fit' && <Compass className="w-3.5 h-3.5" />}
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Category Controls */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">
          Showing {categoryQuestions.length} questions in <span className="text-sky-400 font-bold capitalize">{activeCategory}</span>
        </span>

        <button
          onClick={() => handleRegenerate(activeCategory)}
          disabled={regeneratingCategory === activeCategory}
          className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${regeneratingCategory === activeCategory ? 'animate-spin' : ''}`} />
          Regenerate {activeCategory} Section
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {categoryQuestions.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl text-center border-dashed border-slate-800">
            <p className="text-sm text-slate-400">No questions in this category yet.</p>
          </div>
        ) : (
          categoryQuestions.map((q) => {
            const isEditing = editingId === q.id;
            const meta = (q as any)._meta;
            const isPinned = meta?.pinned || meta?.edited || meta?.origin === 'user';

            return (
              <div
                key={q.id}
                className="glass-panel p-5 rounded-xl border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {q.id}
                    </span>

                    {/* Difficulty Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      q.difficulty === 3 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      q.difficulty === 2 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      Level {q.difficulty}
                    </span>

                    {/* Requirement Tags */}
                    {q.requirement_ids?.map((rId) => (
                      <span key={rId} className="text-xs font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        covers {rId}
                      </span>
                    ))}

                    {/* Pinned / User Edit Indicator */}
                    {isPinned && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" title="Pinned: Hand-edited or user created. Protected from regeneration.">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <button
                        onClick={() => saveEditing(q.id)}
                        className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(q)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        title="Edit question inline"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3 pt-2 font-sans text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Question Prompt
                      </label>
                      <input
                        type="text"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Answer Outline / Key Points
                      </label>
                      <textarea
                        rows={3}
                        value={editOutline}
                        onChange={(e) => setEditOutline(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Category
                        </label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as QuestionCategory)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 capitalize text-xs"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Difficulty Level
                        </label>
                        <select
                          value={editDifficulty}
                          onChange={(e) => setEditDifficulty(parseInt(e.target.value, 10) as 1 | 2 | 3)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                        >
                          <option value={1}>1 - Basic</option>
                          <option value={2}>2 - Standard</option>
                          <option value={3}>3 - Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-bold text-slate-100 mb-2">{q.prompt}</h3>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/60 text-xs text-slate-300 leading-relaxed font-mono">
                      <span className="font-semibold text-sky-400 block mb-1">ANSWER OUTLINE:</span>
                      {q.answer_outline}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100">Add Custom Question</h3>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Question Prompt *
                </label>
                <input
                  type="text"
                  required
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="e.g. How do you handle database migration rollbacks?"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Answer Outline *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newOutline}
                  onChange={(e) => setNewOutline(e.target.value)}
                  placeholder="Key points to cover in response..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-sky-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as QuestionCategory)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-sky-500 capitalize text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Difficulty
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(parseInt(e.target.value, 10) as 1 | 2 | 3)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                  >
                    <option value={1}>1 - Basic</option>
                    <option value={2}>2 - Standard</option>
                    <option value={3}>3 - Advanced</option>
                  </select>
                </div>
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
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
