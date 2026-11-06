import React, { useState } from 'react';
import { Question, AnswerKeyMatchResult } from '../../types';
import { AlertCircle, CheckCircle, Trash2, Plus, Edit3, Eye, AlertTriangle } from 'lucide-react';

interface ExtractionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  matchResult?: AnswerKeyMatchResult | null;
  onSaveQuestions: (updatedQuestions: Question[]) => void;
  onProceedToTest: () => void;
}

export const ExtractionReviewModal: React.FC<ExtractionReviewModalProps> = ({
  isOpen,
  onClose,
  questions: initialQuestions,
  matchResult,
  onSaveQuestions,
  onProceedToTest,
}) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'uncertain' | 'missing_options'>('all');

  if (!isOpen) return null;

  const validOptionsCount = questions.filter(q => Object.keys(q.options).length >= 2).length;
  const uncertainCount = questions.filter(q => q.isIncomplete || q.extractionConfidence === 'low').length;
  const withAnswerKeyCount = questions.filter(q => Boolean(q.correctAnswer)).length;

  const filteredQuestions = questions.filter((q, idx) => {
    if (filterMode === 'uncertain') {
      return q.isIncomplete || q.extractionConfidence === 'low';
    }
    if (filterMode === 'missing_options') {
      return Object.keys(q.options).length < 2;
    }
    return true;
  });

  const handleUpdateQuestion = (index: number, updated: Partial<Question>) => {
    const updatedList = [...questions];
    updatedList[index] = { ...updatedList[index], ...updated };
    setQuestions(updatedList);
    onSaveQuestions(updatedList);
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedList = questions.filter((_, i) => i !== index);
    // Renumber remaining questions
    const renumbered = updatedList.map((q, i) => ({ ...q, number: i + 1 }));
    setQuestions(renumbered);
    onSaveQuestions(renumbered);
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    const newQ: Question = {
      id: `q-${nextNum}-${Date.now()}`,
      number: nextNum,
      question: 'New Question Text',
      options: {
        A: 'Option A',
        B: 'Option B',
        C: 'Option C',
        D: 'Option D',
      },
      correctAnswer: 'A',
      marks: 1,
      negativeMarks: 0.25,
      isIncomplete: false,
      extractionConfidence: 'high',
    };
    const updated = [...questions, newQ];
    setQuestions(updated);
    onSaveQuestions(updated);
    setEditingIndex(updated.length - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Review Extracted Questions</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and adjust questions, options, and correct answers before starting the test.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-semibold leading-none p-1"
          >
            &times;
          </button>
        </div>

        {/* Stats banner */}
        <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-slate-700">
              Total: <strong className="text-indigo-700 font-bold">{questions.length}</strong>
            </span>
            <span className="text-emerald-700 flex items-center font-medium">
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Valid Options: {validOptionsCount}
            </span>
            <span className="text-blue-700 flex items-center font-medium">
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Answer Keys Matched: {withAnswerKeyCount}
            </span>
            {uncertainCount > 0 && (
              <span className="text-amber-700 flex items-center font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Uncertain / Incomplete: {uncertainCount}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filterMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({questions.length})
            </button>
            {uncertainCount > 0 && (
              <button
                onClick={() => setFilterMode('uncertain')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  filterMode === 'uncertain' ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                Needs Review ({uncertainCount})
              </button>
            )}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No questions match the current filter.</p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const originalIndex = questions.findIndex(item => item.id === q.id);
              const isEditing = editingIndex === originalIndex;
              const hasFewOptions = Object.keys(q.options).length < 2;

              return (
                <div
                  key={q.id}
                  className={`border rounded-xl p-4 transition-all ${
                    q.isIncomplete || hasFewOptions
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {q.number}
                      </span>
                      {q.pageNumber && (
                        <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          Page {q.pageNumber}
                        </span>
                      )}
                      {(q.isIncomplete || hasFewOptions) && (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Missing or Uncertain Options
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingIndex(isEditing ? null : originalIndex)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        {isEditing ? 'Done' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(originalIndex)}
                        className="p-1 text-slate-400 hover:text-red-600 transition"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text Display or Edit */}
                  <div className="mt-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-slate-700">Question Text</label>
                        <textarea
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(originalIndex, { question: e.target.value })}
                          rows={2}
                          className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />

                        {/* Options editor */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-slate-700">Options</label>
                            <button
                              type="button"
                              onClick={() => {
                                const currentKeys = Object.keys(q.options);
                                const nextLetter = String.fromCharCode(65 + currentKeys.length);
                                handleUpdateQuestion(originalIndex, {
                                  options: { ...q.options, [nextLetter]: `Option ${nextLetter}` },
                                  isIncomplete: false,
                                });
                              }}
                              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center"
                            >
                              <Plus className="w-3 h-3 mr-0.5" /> Add Option
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(q.options).map(([key, val]) => (
                              <div key={key} className="flex items-center space-x-1.5">
                                <span className="font-bold text-xs text-slate-700 w-5">{key})</span>
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => {
                                    handleUpdateQuestion(originalIndex, {
                                      options: { ...q.options, [key]: e.target.value },
                                    });
                                  }}
                                  className="flex-1 text-xs p-2 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextOpts = { ...q.options };
                                    delete nextOpts[key];
                                    handleUpdateQuestion(originalIndex, { options: nextOpts });
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Correct Answer & Explanation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Correct Answer</label>
                            <select
                              value={q.correctAnswer || ''}
                              onChange={(e) => handleUpdateQuestion(originalIndex, { correctAnswer: e.target.value || null })}
                              className="w-full text-xs p-2 rounded border border-slate-300 bg-white focus:outline-hidden"
                            >
                              <option value="">None / Not specified</option>
                              {Object.keys(q.options).map(key => (
                                <option key={key} value={key}>Option {key}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Explanation (Optional)</label>
                            <input
                              type="text"
                              value={q.explanation || ''}
                              onChange={(e) => handleUpdateQuestion(originalIndex, { explanation: e.target.value })}
                              placeholder="Brief explanation for result review"
                              className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-hidden"
                            >
                            </input>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-800 leading-relaxed">{q.question}</p>
                        
                        {/* Options preview */}
                        {Object.keys(q.options).length > 0 ? (
                          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(q.options).map(([key, text]) => (
                              <div
                                key={key}
                                className={`text-xs p-2 rounded-lg border flex items-center space-x-2 ${
                                  q.correctAnswer === key
                                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className={`font-bold w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                                  q.correctAnswer === key ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {key}
                                </span>
                                <span className="truncate">{text}</span>
                                {q.correctAnswer === key && (
                                  <span className="ml-auto text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                                    Key
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-amber-700 font-medium bg-amber-50 p-2 rounded border border-amber-200">
                            No options detected for this question. Click "Edit" above to add options.
                          </div>
                        )}

                        {q.explanation && (
                          <div className="mt-2 text-xs text-slate-500 italic bg-slate-50 p-2 rounded">
                            <strong className="text-slate-700 not-italic">Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-slate-600" />
            Add Question Manually
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Close Review
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedToTest();
              }}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition"
            >
              Confirm & Start Test ({questions.length} Questions)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

