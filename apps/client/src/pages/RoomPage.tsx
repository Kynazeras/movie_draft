import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { DraftBoard } from '../components/DraftBoard';
import { api, DraftRoom } from '../lib/api';
import { authService } from '../lib/auth';
import { useSocket } from '../hooks/useSocket';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<DraftRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUser = authService.getUser();
  const isCreator = room?.creator.id === currentUser?.id;

  const fetchRoom = async () => {
    if (!roomId) return;

    try {
      const data = await api.getRoom(roomId);
      setRoom(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  useSocket({
    roomId: roomId || '',
    onUserJoined: () => {
      fetchRoom();
    },
    onUserLeft: () => {
      fetchRoom();
    },
    onDraftStarted: () => {
      fetchRoom();
    },
    onDraftCompleted: () => {
      fetchRoom();
    },
  });

  const handleStartDraft = async () => {
    if (!roomId) return;

    setIsStarting(true);
    setError('');

    try {
      await api.startDraft(roomId);
      await fetchRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start draft');
    } finally {
      setIsStarting(false);
    }
  };

  const handleDraftComplete = () => {
    fetchRoom();
  };

  const copyInviteCode = async () => {
    if (!room) return;

    try {
      await navigator.clipboard.writeText(room.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = room.inviteCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyInviteLink = async () => {
    if (!room) return;

    const link = `${window.location.origin}/join/${room.inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (userId: string) => {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
    ];
    const hash = userId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-[var(--color-text-muted)]">
              Loading room...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error && !room) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              Room not found
            </h2>
            <p className="text-[var(--color-text-muted)] mb-6">{error}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!room) return null;

  if (room.status === 'IN_PROGRESS' && roomId) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto">
          <DraftBoard
            roomId={roomId}
            roomName={room.name}
            onDraftComplete={handleDraftComplete}
          />

          {/* Back link */}
          <div className="text-center mt-8">
            <Link
              to="/dashboard"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (room.status === 'COMPLETED') {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto">
          <DraftBoard
            roomId={roomId!}
            roomName={room.name}
            onDraftComplete={handleDraftComplete}
          />

          {/* Completion banner */}
          <div className="mt-6 glass rounded-2xl p-6 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              Draft Complete!
            </h2>
            <p className="text-[var(--color-text-muted)]">
              Great picks everyone! Share your results and discuss.
            </p>
          </div>

          {/* Back link */}
          <div className="text-center mt-8">
            <Link
              to="/dashboard"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const sortedParticipants = [...room.participants].sort(
    (a, b) => a.draftPosition - b.draftPosition,
  );

  const sortedCategories = [...room.categories].sort(
    (a, b) => a.order - b.order,
  );

  const canStartDraft =
    isCreator &&
    room.status === 'WAITING' &&
    room.participants.length >= 2 &&
    room.categories.length >= 1;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[var(--color-text)]">
                {room.name}
              </h1>
              <span className="px-3 py-1 text-sm font-medium rounded-full border bg-blue-500/20 text-blue-400 border-blue-500/30">
                Waiting for players
              </span>
            </div>
            <p className="text-[var(--color-text-muted)]">
              Created by {room.creator.name || 'Unknown'}
            </p>
          </div>

          {isCreator && (
            <button
              onClick={handleStartDraft}
              disabled={!canStartDraft || isStarting}
              className="px-6 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-[var(--shadow-glow)]"
              title={
                room.participants.length < 2
                  ? 'Need at least 2 players to start'
                  : room.categories.length < 1
                    ? 'Need at least 1 category'
                    : 'Start the draft'
              }
            >
              {isStarting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-[var(--color-background)] border-t-transparent rounded-full animate-spin" />
                  Starting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
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
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Start Draft
                </span>
              )}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
            <p className="text-[var(--color-error)]">{error}</p>
          </div>
        )}

        {/* Invite Code Card */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Invite Players
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Invite code */}
            <div className="flex-1">
              <label className="block text-sm text-[var(--color-text-muted)] mb-2">
                Share this code
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-2xl tracking-widest text-center text-[var(--color-primary)]">
                  {room.inviteCode}
                </div>
                <button
                  onClick={copyInviteCode}
                  className="px-4 py-3 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
                  title="Copy code"
                >
                  {copied ? (
                    <svg
                      className="w-5 h-5 text-green-400"
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:flex items-center">
              <div className="h-full w-px bg-[var(--color-border)]" />
            </div>

            {/* Copy link */}
            <div className="flex-1">
              <label className="block text-sm text-[var(--color-text-muted)] mb-2">
                Or share a direct link
              </label>
              <button
                onClick={copyInviteLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                {copied ? 'Copied!' : 'Copy Invite Link'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Participants */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Players
              </h2>
              <span className="text-sm text-[var(--color-text-muted)]">
                {room.participants.length} joined
              </span>
            </div>

            {sortedParticipants.length === 0 ? (
              <p className="text-[var(--color-text-muted)] text-center py-8">
                No players yet. Share the invite code!
              </p>
            ) : (
              <div className="space-y-3">
                {sortedParticipants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
                  >
                    {/* Draft position */}
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                      {index + 1}
                    </span>

                    {/* Avatar */}
                    {participant.user.avatarUrl ? (
                      <img
                        src={participant.user.avatarUrl}
                        alt={participant.user.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(participant.userId)}`}
                      >
                        {getInitials(participant.user.name)}
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-text)] truncate">
                        {participant.user.name || 'Anonymous'}
                        {participant.userId === currentUser?.id && (
                          <span className="text-[var(--color-text-muted)] font-normal ml-1">
                            (you)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Creator badge */}
                    {participant.userId === room.creator.id && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
                        Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {room.participants.length < 2 && (
              <p className="mt-4 text-sm text-[var(--color-text-muted)] text-center">
                Need at least 2 players to start
              </p>
            )}
          </div>

          {/* Categories */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Categories
              </h2>
              <span className="text-sm text-[var(--color-text-muted)]">
                {room.categories.length} total
              </span>
            </div>

            {sortedCategories.length === 0 ? (
              <p className="text-[var(--color-text-muted)] text-center py-8">
                No categories added yet.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
                  >
                    {/* Order number */}
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
                      {index + 1}
                    </span>

                    {/* Category name */}
                    <span className="flex-1 text-[var(--color-text)]">
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Draft order explanation */}
        {room.participants.length >= 2 && (
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              How the Draft Works
            </h2>
            <div className="text-[var(--color-text-muted)] space-y-3">
              <p>
                This draft uses a{' '}
                <strong className="text-[var(--color-text)]">
                  snake draft
                </strong>{' '}
                format:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Round 1: Players pick in order (1, 2, 3, ...)</li>
                <li>Round 2: Order reverses (..., 3, 2, 1)</li>
                <li>This alternates each round for fairness</li>
              </ul>
              <p className="text-sm">
                With {room.participants.length} players and{' '}
                {room.categories.length} categories, there will be{' '}
                {room.categories.length} rounds.
              </p>
            </div>
          </div>
        )}

        {/* Back to dashboard link */}
        <div className="text-center">
          <Link
            to="/dashboard"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

export default RoomPage;
