import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { api, DraftSummary } from '../lib/api';

export function DashboardPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const data = await api.getMyDrafts();
      setDrafts(data);
    } catch (err) {
      setError('Failed to load your drafts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinByCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsJoining(true);
    setJoinError('');

    try {
      const room = await api.joinRoomByCode(inviteCode.trim().toUpperCase());
      navigate(`/room/${room.id}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  const getStatusBadge = (status: DraftSummary['status']) => {
    const styles = {
      WAITING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      IN_PROGRESS: 'bg-green-500/20 text-green-400 border-green-500/30',
      COMPLETED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    const labels = {
      WAITING: 'Waiting',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">
              My Drafts
            </h1>
            <p className="text-[var(--color-text-muted)] mt-1">
              Create a new draft or join an existing one
            </p>
          </div>

          <Link
            to="/create"
            className="inline-flex items-center justify-center px-6 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors shadow-lg hover:shadow-[var(--shadow-glow)]"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Draft
          </Link>
        </div>

        {/* Join by Code */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Join a Draft
          </h2>
          <form
            onSubmit={handleJoinByCode}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter invite code"
                maxLength={8}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all font-mono tracking-wider uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isJoining || !inviteCode.trim()}
              className="px-6 py-3 font-semibold text-[var(--color-text)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </form>
          {joinError && (
            <p className="mt-2 text-sm text-[var(--color-error)]">
              {joinError}
            </p>
          )}
        </div>

        {/* Drafts List */}
        <div>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-[var(--color-text-muted)]">
                Loading your drafts...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-[var(--color-error)]">{error}</p>
              <button
                onClick={fetchDrafts}
                className="mt-4 text-[var(--color-primary)] hover:underline"
              >
                Try again
              </button>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-12 glass rounded-xl">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                No drafts yet
              </h3>
              <p className="text-[var(--color-text-muted)] mb-6">
                Create your first draft or join one with an invite code
              </p>
              <Link
                to="/create"
                className="inline-flex items-center px-6 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Create Your First Draft
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {drafts.map((draft) => (
                <Link
                  key={draft.id}
                  to={`/room/${draft.id}`}
                  className="glass rounded-xl p-6 hover:bg-[var(--color-surface-elevated)] transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                          {draft.name}
                        </h3>
                        {getStatusBadge(draft.status)}
                        {draft.isCreator && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
                            Creator
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1">
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
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {draft.participantCount} players
                        </span>
                        <span className="flex items-center gap-1">
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
                          {draft.categoryCount} categories
                        </span>
                        <span className="flex items-center gap-1">
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
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {new Date(draft.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <svg
                      className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default DashboardPage;
