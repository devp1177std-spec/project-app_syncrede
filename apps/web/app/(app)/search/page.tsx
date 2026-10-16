'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  UserCheck,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import { MOCK_SEARCH_USERS, formatFollowersCount } from '@/lib/search-service';

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const trimmed = query.trim().toLowerCase();

  // Matched creators
  const matchedUsers = trimmed
    ? MOCK_SEARCH_USERS.filter(
        (u) =>
          u.username.toLowerCase().includes(trimmed) ||
          u.fullName.toLowerCase().includes(trimmed)
      )
    : MOCK_SEARCH_USERS.slice(0, 5);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Top Navigation */}
      <div className="w-full h-12 px-4 flex items-center gap-3 border-b border-slate-100 bg-white sticky top-0 z-30">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-sm font-bold text-slate-900 truncate flex-1">
          {query ? `Results for "${query}"` : 'Explore & Search'}
        </h1>
      </div>

      {/* Embedded SearchBar */}
      <div className="px-4 pt-3 pb-2">
        <SearchBar
          placeholder="Search creators and topics..."
          onSearchSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
        />
      </div>

      {/* Results Body */}
      <div className="flex-1 px-4 py-2 space-y-4">
        {/* People Section */}
        <div>
          <div className="py-2 flex items-center justify-between border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Creators ({matchedUsers.length})
            </h2>
          </div>

          {matchedUsers.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {matchedUsers.map((user) => (
                <div
                  key={user.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <Link
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <div className="w-10 h-10 rounded-full ring-2 ring-blue-500 overflow-hidden shrink-0 bg-slate-100 group-hover:scale-105 transition-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition truncate">
                          @{user.username}
                        </span>
                        {user.isVerified && (
                          <svg
                            className="w-3.5 h-3.5 text-blue-600 shrink-0"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5l-4-4 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.fullName} • {formatFollowersCount(user.followersCount)} followers
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition shrink-0 ${
                      user.isFollowing
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                    }`}
                  >
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-400 space-y-2">
              <Search className="w-6 h-6 mx-auto text-slate-300" />
              <p>No creators found matching &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
          Loading search results...
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
