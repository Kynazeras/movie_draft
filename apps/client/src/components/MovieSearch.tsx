import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';

interface ApiMovie {
  id: number;
  title: string;
  posterUrl: string | null;
  year: number | null;
  overview: string;
  rating: number;
}

export interface Movie {
  id: number;
  title: string;
  posterUrl: string | null;
  year: number | null;
  overview: string;
  rating: number;
}

interface MovieSearchProps {
  onSelect: (movie: Movie) => void;
  disabled?: boolean;
  pickedMovieIds?: number[];
}

export function MovieSearch({
  onSelect,
  disabled,
  pickedMovieIds = [],
}: MovieSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.searchMovies(searchQuery);

      const movies: ApiMovie[] = data.movies || [];
      setResults(movies);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        search(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          const movie = results[selectedIndex];
          if (!pickedMovieIds.includes(movie.id)) {
            handleSelect(movie);
          }
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (movie: Movie) => {
    onSelect(movie);
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative" style={{ zIndex: 100 }}>
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Search for a movie..."
          className="w-full px-4 py-4 pl-12 text-lg rounded-xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
        {/* Search icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
          {isLoading ? (
            <svg
              className="w-5 h-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>

        {/* Clear button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (query.trim() || results.length > 0) && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-2xl"
          style={{ zIndex: 9999 }}
        >
          {isLoading && results.length === 0 ? (
            <div className="p-6 text-center text-[var(--color-text-muted)]">
              Searching...
            </div>
          ) : results.length === 0 && query.trim() && !isLoading ? (
            <div className="p-6 text-center text-[var(--color-text-muted)]">
              No movies found for "{query}"
            </div>
          ) : (
            results.map((movie, index) => {
              const isPicked = pickedMovieIds.includes(movie.id);
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={movie.id}
                  onClick={() => !isPicked && handleSelect(movie)}
                  disabled={isPicked}
                  className={`w-full flex items-center gap-4 p-3 text-left transition-colors ${
                    isPicked
                      ? 'opacity-40 cursor-not-allowed bg-[var(--color-surface)]'
                      : isSelected
                        ? 'bg-[var(--color-primary)]/10'
                        : 'hover:bg-[var(--color-surface)]'
                  }`}
                >
                  {/* Poster */}
                  <div className="flex-shrink-0 w-12 h-18 rounded overflow-hidden bg-[var(--color-surface)]">
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-text-subtle)]">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text)] truncate">
                        {movie.title}
                      </span>
                      {movie.year && (
                        <span className="flex-shrink-0 text-sm text-[var(--color-text-muted)]">
                          ({movie.year})
                        </span>
                      )}
                    </div>
                    {movie.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg
                          className="w-4 h-4 text-[var(--color-primary)]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-[var(--color-text-muted)]">
                          {movie.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status indicator */}
                  {isPicked && (
                    <span className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full bg-[var(--color-error)]/20 text-[var(--color-error)]">
                      Picked
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default MovieSearch;
