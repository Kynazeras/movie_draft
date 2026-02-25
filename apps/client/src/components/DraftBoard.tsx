import { useState, useEffect, useCallback, useMemo } from 'react';
import { api, DraftState, DraftPick } from '../lib/api';
import { authService } from '../lib/auth';
import { useSocket } from '../hooks/useSocket';
import { MovieSearch, Movie } from './MovieSearch';

interface DraftBoardProps {
  roomId: string;
  roomName: string;
  onDraftComplete: () => void;
}

interface Category {
  id: string;
  name: string;
  order: number;
}

export function DraftBoard({
  roomId,
  roomName,
  onDraftComplete,
}: DraftBoardProps) {
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickError, setPickError] = useState('');

  const [recentPick, setRecentPick] = useState<DraftPick | null>(null);

  const currentUser = authService.getUser();

  const fetchDraftState = useCallback(async () => {
    try {
      const data = await api.getDraftState(roomId);
      setDraftState(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load draft');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchDraftState();
  }, [fetchDraftState]);

  useSocket({
    roomId,
    onPickMade: (data) => {
      setRecentPick({
        id: data.pickId,
        participantId: data.participantId,
        participantName: data.participantName,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        movieId: data.movieId,
        movieTitle: data.movieTitle,
        moviePosterUrl: data.moviePosterUrl,
        pickNumber: data.pickNumber,
      });

      setTimeout(() => setRecentPick(null), 3000);

      fetchDraftState();
    },
    onTurnChanged: () => {
      fetchDraftState();
    },
    onDraftCompleted: () => {
      fetchDraftState();
      onDraftComplete();
    },
    onError: (data) => {
      setPickError(data.message);
    },
  });

  const isMyTurn = draftState?.currentPicker?.isCurrentUser ?? false;

  const pickedMovieIds = useMemo(() => {
    return draftState?.picks.map((p) => p.movieId) || [];
  }, [draftState?.picks]);

  const myParticipant = useMemo(() => {
    return draftState?.participants.find((p) => p.isCurrentUser);
  }, [draftState?.participants]);

  const myUnfilledCategories = useMemo(() => {
    if (!draftState || !myParticipant) return [];

    const myPickedCategoryIds = new Set(
      draftState.picks
        .filter((p) => p.participantId === myParticipant.participantId)
        .map((p) => p.categoryId),
    );

    return draftState.categories
      .filter((c) => !myPickedCategoryIds.has(c.id))
      .sort((a, b) => a.order - b.order);
  }, [draftState, myParticipant]);

  const getPickForCell = useCallback(
    (participantId: string, categoryId: string) => {
      return draftState?.picks.find(
        (p) => p.participantId === participantId && p.categoryId === categoryId,
      );
    },
    [draftState?.picks],
  );

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setSelectedCategoryId(null);
    setPickError('');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleConfirmPick = async () => {
    if (!selectedMovie || !selectedCategoryId || !draftState) return;

    setIsSubmitting(true);
    setPickError('');

    try {
      await api.makePick(roomId, {
        categoryId: selectedCategoryId,
        movieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
        moviePosterUrl: selectedMovie.posterUrl || null,
        movieYear: selectedMovie.year || null,
      });

      setSelectedMovie(null);
      setSelectedCategoryId(null);
    } catch (err) {
      setPickError(err instanceof Error ? err.message : 'Failed to make pick');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPick = () => {
    setSelectedMovie(null);
    setSelectedCategoryId(null);
    setPickError('');
  };

  const handleBackToMovie = () => {
    setSelectedCategoryId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[var(--color-text-muted)]">
            Loading draft...
          </p>
        </div>
      </div>
    );
  }

  if (error || !draftState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-[var(--color-error)] mb-4">
            {error || 'Failed to load draft'}
          </p>
          <button
            onClick={fetchDraftState}
            className="px-4 py-2 text-[var(--color-primary)] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const sortedParticipants = [...draftState.participants].sort(
    (a, b) => a.draftPosition - b.draftPosition,
  );

  const sortedCategories = [...draftState.categories].sort(
    (a, b) => a.order - b.order,
  );

  const selectedCategory = sortedCategories.find(
    (c) => c.id === selectedCategoryId,
  );

  const totalPicks =
    draftState.participants.length * draftState.categories.length;
  const currentPicks = draftState.picks.length;

  return (
    <div className="space-y-6">
      {/* Header with turn indicator */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Draft info */}
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              {roomName}
            </h1>
            <p className="text-[var(--color-text-muted)]">
              Pick {currentPicks + 1} of {totalPicks}
            </p>
          </div>

          {/* Turn indicator */}
          <div
            className={`flex items-center gap-4 px-6 py-4 rounded-xl ${
              isMyTurn
                ? 'bg-[var(--color-primary)]/20 border-2 border-[var(--color-primary)]'
                : 'bg-[var(--color-surface)]'
            }`}
          >
            {isMyTurn ? (
              <>
                <div className="relative">
                  <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 bg-[var(--color-primary)] rounded-full animate-ping" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--color-primary)]">
                    Your Turn!
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Pick any movie for any open category
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-[var(--color-text-muted)] rounded-full" />
                <div>
                  <p className="text-[var(--color-text)]">
                    <span className="font-semibold">
                      {draftState.currentPicker?.participantName}
                    </span>{' '}
                    is picking
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Waiting for their selection...
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent pick notification */}
      {recentPick && (
        <div className="fixed top-4 right-4 z-40 animate-in slide-in-from-right fade-in duration-300">
          <div className="glass rounded-xl p-4 shadow-2xl max-w-sm">
            <div className="flex items-center gap-3">
              {recentPick.moviePosterUrl && (
                <img
                  src={recentPick.moviePosterUrl}
                  alt={recentPick.movieTitle}
                  className="w-12 h-18 rounded object-cover"
                />
              )}
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {recentPick.participantName} picked
                </p>
                <p className="font-semibold text-[var(--color-text)]">
                  {recentPick.movieTitle}
                </p>
                <p className="text-xs text-[var(--color-primary)]">
                  {recentPick.categoryName}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pick area - only show when it's user's turn */}
      {isMyTurn && !selectedMovie && (
        <div className="glass rounded-2xl p-6 relative z-20">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">
            Search for your pick
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Find a movie, then choose which category to place it in
          </p>

          {pickError && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
              <p className="text-sm text-[var(--color-error)]">{pickError}</p>
            </div>
          )}

          <MovieSearch
            onSelect={handleMovieSelect}
            disabled={isSubmitting}
            pickedMovieIds={pickedMovieIds}
          />

          {/* Show unfilled categories as reference */}
          <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              Your open categories ({myUnfilledCategories.length} remaining):
            </p>
            <div className="flex flex-wrap gap-2">
              {myUnfilledCategories.map((category) => (
                <span
                  key={category.id}
                  className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-surface)] text-[var(--color-text)]"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category selection modal - shows after movie is selected */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !isSubmitting && handleCancelPick()}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl bg-[var(--color-surface-elevated)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header with selected movie */}
            <div className="p-6 border-b border-[var(--color-border)]">
              <div className="flex items-start gap-4">
                {/* Movie poster */}
                {selectedMovie.posterUrl ? (
                  <img
                    src={selectedMovie.posterUrl}
                    alt={selectedMovie.title}
                    className="w-20 h-30 rounded-lg shadow-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-30 rounded-lg bg-[var(--color-surface)] flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-8 h-8 text-[var(--color-text-subtle)]"
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

                {/* Movie info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-[var(--color-text)]">
                    {selectedMovie.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-text-muted)]">
                    {selectedMovie.year && <span>{selectedMovie.year}</span>}
                    {selectedMovie.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-[var(--color-primary)]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {selectedMovie.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {selectedMovie.overview && (
                    <p className="mt-2 text-sm text-[var(--color-text-muted)] line-clamp-2">
                      {selectedMovie.overview}
                    </p>
                  )}
                </div>

                {/* Change movie button */}
                <button
                  onClick={handleCancelPick}
                  disabled={isSubmitting}
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded-lg transition-colors"
                  title="Choose different movie"
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
              </div>
            </div>

            {/* Category selection */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                Choose a category for this pick
              </h3>

              {pickError && (
                <div className="mb-4 p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
                  <p className="text-sm text-[var(--color-error)]">
                    {pickError}
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                {myUnfilledCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    disabled={isSubmitting}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      selectedCategoryId === category.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                        : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-medium ${
                          selectedCategoryId === category.id
                            ? 'text-[var(--color-primary)]'
                            : 'text-[var(--color-text)]'
                        }`}
                      >
                        {category.name}
                      </span>
                      {selectedCategoryId === category.id && (
                        <svg
                          className="w-5 h-5 text-[var(--color-primary)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={handleCancelPick}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 font-semibold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPick}
                disabled={isSubmitting || !selectedCategoryId}
                className="flex-1 px-4 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
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
                    Confirming...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Confirm Pick
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft board grid */}
      <div className="glass rounded-2xl p-6 overflow-hidden relative z-10">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Draft Board
        </h2>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="p-3 text-left text-sm font-medium text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  Category
                </th>
                {sortedParticipants.map((participant) => {
                  const isCurrentPicker =
                    draftState.currentPicker?.participantId ===
                    participant.participantId;
                  return (
                    <th
                      key={participant.participantId}
                      className={`p-3 text-center text-sm font-medium border-b border-[var(--color-border)] min-w-[120px] ${
                        participant.isCurrentUser
                          ? 'text-[var(--color-primary)]'
                          : isCurrentPicker
                            ? 'text-[var(--color-text)]'
                            : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isCurrentPicker && (
                          <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
                        )}
                        {participant.name}
                        {participant.isCurrentUser && (
                          <span className="text-xs">(you)</span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((category, categoryIndex) => {
                return (
                  <tr key={category.id}>
                    <td className="p-3 border-b border-[var(--color-border)] text-[var(--color-text)]">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center text-xs rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
                          {categoryIndex + 1}
                        </span>
                        {category.name}
                      </div>
                    </td>
                    {sortedParticipants.map((participant) => {
                      const pick = getPickForCell(
                        participant.participantId,
                        category.id,
                      );

                      return (
                        <td
                          key={`${category.id}-${participant.participantId}`}
                          className="p-2 border-b border-[var(--color-border)] text-center"
                        >
                          {pick ? (
                            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] transition-colors group">
                              {pick.moviePosterUrl ? (
                                <img
                                  src={pick.moviePosterUrl}
                                  alt={pick.movieTitle}
                                  className="w-16 h-24 rounded object-cover shadow-md group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-16 h-24 rounded bg-[var(--color-surface-elevated)] flex items-center justify-center">
                                  <svg
                                    className="w-6 h-6 text-[var(--color-text-subtle)]"
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
                              <span className="text-xs text-[var(--color-text)] font-medium text-center line-clamp-2 max-w-[80px]">
                                {pick.movieTitle}
                              </span>
                            </div>
                          ) : (
                            <div className="w-16 h-24 mx-auto rounded border-2 border-dashed border-[var(--color-border)] flex items-center justify-center">
                              <span className="text-xs text-[var(--color-text-subtle)]">
                                —
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DraftBoard;
