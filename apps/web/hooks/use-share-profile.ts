'use client';

import { useState, useCallback } from 'react';

interface ShareProfileOptions {
  name: string;
  username: string;
}

export function useShareProfile() {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async ({ name, username }: ShareProfileOptions) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/profile/${username}` : '';
    const shareData = {
      title: `${name} (@${username}) on Social`,
      text: `Check out ${name}'s profile and architectural photography on Social`,
      url,
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User cancelled
      }
    }

    // Fallback: Copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (e) {
        console.error('Failed to copy link:', e);
      }
    }
  }, []);

  return { share, copied };
}
