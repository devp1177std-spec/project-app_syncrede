'use client';

import React from 'react';
import {
  Share2,
  Copy,
  VolumeX,
  ShieldAlert,
  Flag,
  Edit3,
  LogOut,
  X,
  Check,
} from 'lucide-react';

interface ProfileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isOwnProfile: boolean;
  username: string;
  onShare: () => void;
  onCopyLink: () => void;
  onMute?: () => void;
  onBlock?: () => void;
  onEditProfile?: () => void;
  onLogout?: () => void;
  copied?: boolean;
}

export function ProfileMoreSheet({
  isOpen,
  onClose,
  isOwnProfile,
  username,
  onShare,
  onCopyLink,
  onMute,
  onBlock,
  onEditProfile,
  onLogout,
  copied = false,
}: ProfileMoreSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Sheet */}
      <div className="relative w-full sm:max-w-xs bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-2 z-10 border border-slate-100 animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            @{username}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Action Items */}
        <div className="flex flex-col py-1 text-xs">
          <button
            type="button"
            onClick={() => {
              onShare();
              onClose();
            }}
            className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            <Share2 className="w-4 h-4 text-slate-400" />
            <span>Share Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onCopyLink();
              setTimeout(onClose, 500);
            }}
            className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400" />
            )}
            <span>{copied ? 'Copied to clipboard' : 'Copy Profile Link'}</span>
          </button>

          {isOwnProfile ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onEditProfile?.();
                  onClose();
                }}
                className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <Edit3 className="w-4 h-4 text-slate-400" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLogout?.();
                  onClose();
                }}
                className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl hover:bg-red-50 text-red-600 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onMute?.();
                  onClose();
                }}
                className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>Mute @{username}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onBlock?.();
                  onClose();
                }}
                className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl hover:bg-red-50 text-red-600 font-medium transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>Block @{username}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl hover:bg-slate-50 text-slate-500 font-medium transition-colors"
              >
                <Flag className="w-4 h-4 text-slate-400" />
                <span>Report</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
