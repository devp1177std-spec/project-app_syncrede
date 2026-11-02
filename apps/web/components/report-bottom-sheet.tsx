'use client';

import React, { useState, useEffect } from 'react';
import { Flag, X } from 'lucide-react';
import type { Post } from '@/types/post';

interface ReportBottomSheetProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: Post, comment: string) => void;
}

export function ReportBottomSheet({
  post,
  isOpen,
  onClose,
  onSubmit,
}: ReportBottomSheetProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent background scrolling while bottom sheet is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset form when opened for a new post
  useEffect(() => {
    if (isOpen) {
      setComment('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, post?.id]);

  if (!isOpen || !post) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide a reason before submitting.');
      return;
    }

    setIsSubmitting(true);
    onSubmit(post, comment.trim());
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end items-center animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="w-full max-w-[430px] sm:max-w-[390px] bg-white rounded-t-3xl shadow-2xl p-5 border-t border-slate-100 flex flex-col animate-in slide-in-from-bottom duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visual drag handle bar */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="report-modal-title"
                className="font-bold text-base text-slate-900 leading-tight"
              >
                Report Content
              </h3>
              <p className="text-[11px] text-slate-400">
                Post by @{post.author.username}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Form */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          <div className="space-y-1.5">
            <label
              htmlFor="report-comment-textarea"
              className="block text-xs font-semibold text-slate-700"
            >
              Reason for reporting
            </label>
            <textarea
              id="report-comment-textarea"
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Explain why you are reporting this content..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-none"
              autoFocus
            />
            {error ? (
              <p className="text-[11px] text-red-500 font-medium">{error}</p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Your report is anonymous and helps us keep the community safe.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 active:scale-95 text-white disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-all"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
