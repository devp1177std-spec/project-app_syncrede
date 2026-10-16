'use client';

import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Clock,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  SearchUser,
  RecentSearchItem,
  getSuggestedUsers,
  searchUsers,
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearAllRecentSearches,
  formatFollowersCount,
} from '@/lib/search-service';

interface SearchBarProps {
  placeholder?: string;
  onSearchSubmit?: (query: string) => void;
  className?: string;
  inputClassName?: string;
}

export function SearchBar({
  placeholder = '',
  onSearchSubmit,
  className = '',
}: SearchBarProps) {
  const router = useRouter();
  const listboxId = useId();

  // Component state
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [suggested, setSuggested] = useState<SearchUser[]>([]);
  const [recent, setRecent] = useState<RecentSearchItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced query with 250ms delay
  const debouncedQuery = useDebounce(query, 250);

  // Load recent searches from localStorage on mount and when opening
  const loadRecent = useCallback(() => {
    setRecent(getRecentSearches());
  }, []);

  // Load suggested users on mount
  useEffect(() => {
    getSuggestedUsers(5).then(setSuggested);
    loadRecent();
  }, [loadRecent]);

  // Execute search when debouncedQuery changes
  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Cancel pending request if present
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setActiveIndex(-1);

    searchUsers(trimmed, 6, controller.signal)
      .then((users) => {
        setResults(users);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  // Determine current active item count for keyboard navigation
  const isQueryEmpty = !query.trim();
  const showRecent = isQueryEmpty && recent.length > 0;
  const showSuggested = isQueryEmpty && recent.length === 0;

  const currentNavItemsCount = isQueryEmpty
    ? showRecent
      ? recent.length
      : suggested.length
    : results.length;

  // Highlight matching characters in username
  const renderHighlightedUsername = (username: string, highlightQuery: string) => {
    if (!highlightQuery.trim()) {
      return <span>@{username}</span>;
    }

    const lowerName = username.toLowerCase();
    const lowerQ = highlightQuery.trim().toLowerCase();
    const matchIndex = lowerName.indexOf(lowerQ);

    if (matchIndex === -1) {
      return <span>@{username}</span>;
    }

    const before = username.slice(0, matchIndex);
    const match = username.slice(matchIndex, matchIndex + lowerQ.length);
    const after = username.slice(matchIndex + lowerQ.length);

    return (
      <span>
        @{before}
        <span className="font-extrabold text-blue-600 underline decoration-blue-500/40">{match}</span>
        {after}
      </span>
    );
  };

  // Close dropdown and reset focus state
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Select a user
  const handleSelectUser = (user: SearchUser) => {
    const updated = addRecentSearch({ type: 'user', user });
    setRecent(updated);
    handleClose();
    router.push(`/profile/${user.username}`);
  };

  // Select a search query
  const handleSelectQuery = (text: string) => {
    const updated = addRecentSearch({ type: 'query', query: text });
    setRecent(updated);
    handleClose();
    if (onSearchSubmit) {
      onSearchSubmit(text);
    } else {
      router.push(`/search?q=${encodeURIComponent(text)}`);
    }
  };

  // Clear single recent item
  const handleRemoveRecent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = removeRecentSearch(id);
    setRecent(updated);
  };

  // Clear all recent items
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = clearAllRecentSearches();
    setRecent(updated);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        loadRecent();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentNavItemsCount > 0) {
        setActiveIndex((prev) => (prev + 1 >= currentNavItemsCount ? 0 : prev + 1));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentNavItemsCount > 0) {
        setActiveIndex((prev) => (prev - 1 < 0 ? currentNavItemsCount - 1 : prev - 1));
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      // If a specific option is highlighted with arrow keys
      if (activeIndex >= 0 && activeIndex < currentNavItemsCount) {
        if (isQueryEmpty) {
          if (showRecent) {
            const item = recent[activeIndex];
            if (item.type === 'user' && item.user) {
              handleSelectUser(item.user);
            } else if (item.query) {
              handleSelectQuery(item.query);
            }
          } else if (showSuggested) {
            const user = suggested[activeIndex];
            if (user) handleSelectUser(user);
          }
        } else {
          const user = results[activeIndex];
          if (user) handleSelectUser(user);
        }
        return;
      }

      // Enter on free text without active selection
      if (query.trim()) {
        handleSelectQuery(query.trim());
      }
    }
  };

  // Click outside listener
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener('pointerdown', onPointerDown);
    }
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen, handleClose]);

  return (
    <div
      ref={containerRef}
      className={`relative z-40 ${className}`}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-owns={listboxId}
    >
      {/* Search Input Bar (Identical styling to mockup, zero layout shift) */}
      <div className="w-full h-10 px-3.5 bg-[#F4EFEA] rounded-2xl flex items-center gap-2.5 transition focus-within:ring-2 focus-within:ring-blue-500/20">
        <Search className="w-4 h-4 text-stone-400 stroke-[2] shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            loadRecent();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search feed, creators, and tags"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
          className="w-full h-full bg-transparent text-xs text-slate-800 placeholder-stone-400 focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="w-7 h-7 -mr-1 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 active:scale-95 transition"
            aria-label="Clear search input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Backdrop overlay behind dropdown (Dim feed behind it, click outside closes) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        />
      )}

      {/* Dropdown Menu (Positioned directly under search bar, zero layout shift) */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-[380px] flex flex-col animate-in fade-in zoom-in-98 duration-150"
        >
          {/* STATE 1: Empty input -> Show Recent Searches */}
          {isQueryEmpty && showRecent && (
            <div className="flex flex-col">
              <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-50">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Recent
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 active:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="overflow-y-auto no-scrollbar py-1">
                {recent.map((item, idx) => {
                  const isSelected = activeIndex === idx;

                  if (item.type === 'user' && item.user) {
                    return (
                      <div
                        key={item.id}
                        id={`search-item-${idx}`}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectUser(item.user!)}
                        className={`min-h-[46px] px-3.5 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
                          isSelected ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="w-8 h-8 rounded-full ring-2 ring-blue-500 overflow-hidden shrink-0 bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.user.avatarUrl}
                              alt={item.user.fullName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-xs text-slate-900 truncate">
                                @{item.user.username}
                              </span>
                              {item.user.isVerified && (
                                <svg
                                  className="w-3 h-3 text-blue-600 shrink-0"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5l-4-4 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z" />
                                </svg>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 truncate">
                              {item.user.fullName}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleRemoveRecent(e, item.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition shrink-0"
                          aria-label={`Remove @${item.user.username} from recent searches`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  }

                  // Query search item
                  return (
                    <div
                      key={item.id}
                      id={`search-item-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectQuery(item.query || '')}
                      className={`min-h-[46px] px-3.5 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
                        isSelected ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {item.query}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecent(e, item.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition shrink-0"
                        aria-label={`Remove "${item.query}" from recent searches`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STATE 2: Empty input & No Recent Searches -> Show Suggested Creators */}
          {isQueryEmpty && showSuggested && (
            <div className="flex flex-col">
              <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-50">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Suggested People
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  Popular Creators
                </span>
              </div>

              <div className="overflow-y-auto no-scrollbar py-1">
                {suggested.map((user, idx) => {
                  const isSelected = activeIndex === idx;

                  return (
                    <div
                      key={user.id}
                      id={`search-item-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectUser(user)}
                      className={`min-h-[48px] px-3.5 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
                        isSelected ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full ring-2 ring-blue-500 overflow-hidden shrink-0 bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-xs text-slate-900 truncate">
                              @{user.username}
                            </span>
                            {user.isVerified && (
                              <svg
                                className="w-3 h-3 text-blue-600 shrink-0"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5l-4-4 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z" />
                              </svg>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate">
                            {user.fullName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-medium text-slate-500">
                          {formatFollowersCount(user.followersCount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STATE 3: User is typing -> Loading Skeleton */}
          {!isQueryEmpty && isLoading && (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-24 h-3 bg-slate-200 rounded" />
                    <div className="w-16 h-2.5 bg-slate-100 rounded" />
                  </div>
                  <div className="w-12 h-3 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* STATE 4: User is typing & Results Found */}
          {!isQueryEmpty && !isLoading && results.length > 0 && (
            <div className="flex flex-col">
              <div className="px-3.5 py-2.5 border-b border-slate-50 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  People
                </span>
                <span className="text-[11px] text-slate-400">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-y-auto no-scrollbar py-1">
                {results.map((user, idx) => {
                  const isSelected = activeIndex === idx;

                  return (
                    <div
                      key={user.id}
                      id={`search-item-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectUser(user)}
                      className={`min-h-[48px] px-3.5 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
                        isSelected ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full ring-2 ring-blue-500 overflow-hidden shrink-0 bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-xs text-slate-900 truncate">
                              {renderHighlightedUsername(user.username, query)}
                            </span>
                            {user.isVerified && (
                              <svg
                                className="w-3 h-3 text-blue-600 shrink-0"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5l-4-4 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z" />
                              </svg>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate">
                            {user.fullName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {user.isFollowing && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            <UserCheck className="w-3 h-3 text-blue-600" />
                            Following
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-slate-400">
                          {formatFollowersCount(user.followersCount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Enter prompt for full search */}
              <div
                onClick={() => handleSelectQuery(query)}
                className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between cursor-pointer hover:bg-blue-50/60 transition"
              >
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>Search for <strong className="text-slate-900">&quot;{query}&quot;</strong></span>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
                  Press Enter ↵
                </span>
              </div>
            </div>
          )}

          {/* STATE 5: User is typing & No results found */}
          {!isQueryEmpty && !isLoading && results.length === 0 && (
            <div className="py-8 px-4 text-center flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Search className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">
                No results for &quot;{query}&quot;
              </h4>
              <p className="text-[11px] text-slate-400 max-w-[220px]">
                Try searching for a different username, full name, or keyword.
              </p>
              <button
                type="button"
                onClick={() => handleSelectQuery(query)}
                className="text-xs font-semibold text-blue-600 hover:underline pt-1"
              >
                Search all posts for &quot;{query}&quot; ↵
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
