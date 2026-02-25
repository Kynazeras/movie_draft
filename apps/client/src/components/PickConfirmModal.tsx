import { useEffect, useRef } from 'react';
import { Movie } from './MovieSearch';

interface PickConfirmModalProps {
  movie: Movie;
  categoryName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function PickConfirmModal({
  movie,
  categoryName,
  onConfirm,
  onCancel,
  isSubmitting,
}: PickConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, isSubmitting]);

  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      modal.focus();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => !isSubmitting && onCancel()}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-lg bg-[var(--color-surface-elevated)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Movie backdrop/poster header */}
        <div className="relative h-48 bg-gradient-to-b from-[var(--color-primary)]/20 to-[var(--color-surface-elevated)]">
          {movie.posterUrl && (
            <img
              src={movie.posterUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-surface-elevated)]/50 to-[var(--color-surface-elevated)]" />

          {/* Poster overlay */}
          <div className="absolute bottom-0 left-6 translate-y-1/3">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-24 h-36 rounded-lg shadow-2xl object-cover border-2 border-[var(--color-surface-elevated)]"
              />
            ) : (
              <div className="w-24 h-36 rounded-lg shadow-2xl bg-[var(--color-surface)] border-2 border-[var(--color-surface-elevated)] flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-[var(--color-text-subtle)]"
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
        </div>

        {/* Content */}
        <div className="pt-16 px-6 pb-6">
          {/* Category badge */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-sm font-medium">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {categoryName}
            </span>
          </div>

          {/* Movie title */}
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">
            {movie.title}
          </h2>

          {/* Year and rating */}
          <div className="flex items-center gap-3 text-[var(--color-text-muted)] mb-4">
            {movie.year && <span>{movie.year}</span>}
            {movie.rating > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-[var(--color-primary)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {movie.rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Overview */}
          {movie.overview && (
            <p className="text-sm text-[var(--color-text-muted)] line-clamp-3 mb-6">
              {movie.overview}
            </p>
          )}

          {/* Confirmation message */}
          <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] mb-6">
            <p className="text-center text-[var(--color-text)]">
              Pick{' '}
              <strong className="text-[var(--color-primary)]">
                {movie.title}
              </strong>{' '}
              for <strong>{categoryName}</strong>?
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 font-semibold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
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
    </div>
  );
}

export default PickConfirmModal;
