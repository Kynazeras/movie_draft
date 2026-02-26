import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PosterRow } from './PosterRow';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col relative overflow-hidden">
      {/* Movie poster background - dimmed */}
      <div className="absolute inset-0 flex flex-col justify-center gap-4 opacity-20">
        <PosterRow
          movies={FALLBACK_MOVIES.slice(0, 7)}
          direction="left"
          speed="slow"
        />
        <PosterRow
          movies={FALLBACK_MOVIES.slice(7, 14)}
          direction="right"
          speed="normal"
        />
        <PosterRow
          movies={FALLBACK_MOVIES.slice(14, 20)}
          direction="left"
          speed="slow"
        />
      </div>

      {/* Header with logo */}
      <header className="relative z-20 p-6">
        <Link
          to="/"
          className="text-2xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
        >
          Movie Draft
        </Link>
      </header>

      {/* Centered auth card */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 pb-12">
        <div className="glass rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[var(--color-text-muted)]">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}

const FALLBACK_MOVIES = [
  {
    id: 575265,
    title: 'Mission: Impossible - The Final Reckoning',
    poster_path: '/z53D72EAOxGRqdr7KXXWp9dJiDe.jpg',
  },
  {
    id: 354912,
    title: 'Coco',
    poster_path: '/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg',
  },
  {
    id: 157336,
    title: 'Interstellar',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  },
  {
    id: 238,
    title: 'The Godfather',
    poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
  },
  {
    id: 27205,
    title: 'Inception',
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
  },
  {
    id: 155,
    title: 'The Dark Knight',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  },
  {
    id: 550,
    title: 'Fight Club',
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  },
  {
    id: 680,
    title: 'Pulp Fiction',
    poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
  },
  {
    id: 13,
    title: 'Forrest Gump',
    poster_path: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
  },
  {
    id: 278,
    title: 'The Shawshank Redemption',
    poster_path: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
  },
  {
    id: 424,
    title: "Schindler's List",
    poster_path: '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
  },
  {
    id: 497,
    title: 'The Green Mile',
    poster_path: '/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg',
  },
  {
    id: 129,
    title: 'Spirited Away',
    poster_path: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
  },
  {
    id: 122,
    title: 'The Lord of the Rings: The Return of the King',
    poster_path: '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
  },
  {
    id: 769,
    title: 'GoodFellas',
    poster_path: '/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg',
  },
  {
    id: 389,
    title: '12 Angry Men',
    poster_path: '/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg',
  },
  {
    id: 637,
    title: 'Life Is Beautiful',
    poster_path: '/74hLDKjD5aGYOotO6esUVaeISa2.jpg',
  },
  {
    id: 324857,
    title: 'Spider-Man: Into the Spider-Verse',
    poster_path: '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg',
  },
  {
    id: 599,
    title: 'Sunset Boulevard',
    poster_path: '/zt8aQ6ksqK6p1AopC5zVTDS9pKT.jpg',
  },
  {
    id: 372058,
    title: 'Your Name.',
    poster_path: '/q719jXXEzOoYaps6babgKnONONX.jpg',
  },
];
