import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { api, DraftRoom } from '../lib/api';
import { authService } from '../lib/auth';

export function JoinPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<DraftRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getUser();

  const isAlreadyParticipant = room?.participants.some(
    (p) => p.userId === currentUser?.id,
  );

  useEffect(() => {
    if (inviteCode) {
      fetchRoomPreview();
    }
  }, [inviteCode]);

  const fetchRoomPreview = async () => {
    if (!inviteCode) return;

    try {
      if (isAuthenticated) {
        const data = await api.getRoomByInviteCode(inviteCode);
        setRoom(data);
      }
    } catch (err) {
      setError('Invalid invite code or room not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode) return;

    if (!isAuthenticated) {
      sessionStorage.setItem('pendingJoinCode', inviteCode);
      navigate('/login');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const joinedRoom = await api.joinRoomByCode(inviteCode);
      navigate(`/room/${joinedRoom.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
      setIsJoining(false);
    }
  };

  const handleGoToRoom = () => {
    if (room) {
      navigate(`/room/${room.id}`);
    }
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="glass rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-6">🎬</div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            Join a Movie Draft
          </h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            You've been invited to join a draft! Sign in or create an account to
            continue.
          </p>

          <div className="bg-[var(--color-surface)] rounded-lg p-4 mb-6">
            <p className="text-sm text-[var(--color-text-muted)] mb-1">
              Invite Code
            </p>
            <p className="font-mono text-2xl tracking-widest text-[var(--color-primary)]">
              {inviteCode}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/login"
              onClick={() =>
                sessionStorage.setItem('pendingJoinCode', inviteCode || '')
              }
              className="block w-full px-6 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Sign In to Join
            </Link>
            <Link
              to="/register"
              onClick={() =>
                sessionStorage.setItem('pendingJoinCode', inviteCode || '')
              }
              className="block w-full px-6 py-3 font-semibold text-[var(--color-text)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] transition-colors"
            >
              Create Account
            </Link>
          </div>

          <p className="mt-6 text-sm text-[var(--color-text-subtle)]">
            Don't have an invite?{' '}
            <Link
              to="/"
              className="text-[var(--color-primary)] hover:underline"
            >
              Go to home page
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="glass rounded-xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-6">😕</div>
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              Invalid Invite
            </h2>
            <p className="text-[var(--color-text-muted)] mb-6">{error}</p>
            <div className="space-y-3">
              <Link
                to="/dashboard"
                className="block w-full px-6 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Go to Dashboard
              </Link>
              <p className="text-sm text-[var(--color-text-subtle)]">
                Have a code? Enter it on the{' '}
                <Link
                  to="/dashboard"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  dashboard
                </Link>
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!room) return null;

  if (room.status !== 'WAITING') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="glass rounded-xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-6">
              {room.status === 'IN_PROGRESS'
                ? '🎬'
                : room.status === 'COMPLETED'
                  ? '🏆'
                  : '❌'}
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              {room.status === 'IN_PROGRESS'
                ? 'Draft in Progress'
                : room.status === 'COMPLETED'
                  ? 'Draft Completed'
                  : 'Draft Cancelled'}
            </h2>
            <p className="text-[var(--color-text-muted)] mb-6">
              {room.status === 'IN_PROGRESS'
                ? isAlreadyParticipant
                  ? 'The draft has started! Click below to rejoin.'
                  : 'This draft has already started and is not accepting new players.'
                : room.status === 'COMPLETED'
                  ? 'This draft has finished.'
                  : 'This draft has been cancelled.'}
            </p>
            {isAlreadyParticipant ? (
              <button
                onClick={handleGoToRoom}
                className="w-full px-6 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Go to Draft
              </button>
            ) : (
              <Link
                to="/dashboard"
                className="block w-full px-6 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isAlreadyParticipant) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="glass rounded-xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-6">👋</div>
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              You're already in!
            </h2>
            <p className="text-[var(--color-text-muted)] mb-2">
              You've already joined{' '}
              <strong className="text-[var(--color-text)]">{room.name}</strong>
            </p>
            <p className="text-[var(--color-text-muted)] mb-6">
              {room.participants.length} player
              {room.participants.length !== 1 ? 's' : ''} waiting
            </p>
            <button
              onClick={handleGoToRoom}
              className="w-full px-6 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Go to Room
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass rounded-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎬</div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              Join Draft
            </h1>
            <p className="text-[var(--color-text-muted)]">
              You've been invited to join a movie draft
            </p>
          </div>

          {/* Room info */}
          <div className="bg-[var(--color-surface)] rounded-lg p-4 mb-6 space-y-3">
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">
                Draft Name
              </p>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {room.name}
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Players
                </p>
                <p className="text-[var(--color-text)]">
                  {room.participants.length} joined
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Categories
                </p>
                <p className="text-[var(--color-text)]">
                  {room.categories.length} rounds
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Host</p>
              <p className="text-[var(--color-text)]">
                {room.creator.name || 'Unknown'}
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 mb-4">
              <p className="text-sm text-[var(--color-error)]">{error}</p>
            </div>
          )}

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full px-6 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-[var(--shadow-glow)]"
          >
            {isJoining ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-[var(--color-background)] border-t-transparent rounded-full animate-spin" />
                Joining...
              </span>
            ) : (
              'Join Draft'
            )}
          </button>

          <p className="mt-4 text-center text-sm text-[var(--color-text-subtle)]">
            <Link
              to="/dashboard"
              className="text-[var(--color-primary)] hover:underline"
            >
              Back to Dashboard
            </Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

export default JoinPage;
