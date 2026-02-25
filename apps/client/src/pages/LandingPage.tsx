import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PosterRow } from '../components/PosterRow';
import { authService } from '../lib/auth';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
}

 
const API_BASE = 'http: 

export function LandingPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
     
    setIsLoggedIn(authService.isAuthenticated());

     
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
       
      const token = authService.getToken();
      
      if (token) {
        const response = await fetch(`${API_BASE}/movies/lists/popular`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setMovies(data.movies || []);
          setIsLoading(false);
          return;
        }
      }
      
       
      setMovies(FALLBACK_MOVIES);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
      setMovies(FALLBACK_MOVIES);
    } finally {
      setIsLoading(false);
    }
  };

   
  const row1Movies = movies.slice(0, Math.ceil(movies.length / 3));
  const row2Movies = movies.slice(Math.ceil(movies.length / 3), Math.ceil(movies.length * 2 / 3));
  const row3Movies = movies.slice(Math.ceil(movies.length * 2 / 3));

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col relative overflow-hidden">
      {/* Movie poster background rows */}
      <div className="absolute inset-0 flex flex-col justify-center gap-4 opacity-40">
        <PosterRow movies={row1Movies.length ? row1Movies : FALLBACK_MOVIES.slice(0, 7)} direction="left" speed="slow" />
        <PosterRow movies={row2Movies.length ? row2Movies : FALLBACK_MOVIES.slice(7, 14)} direction="right" speed="normal" />
        <PosterRow movies={row3Movies.length ? row3Movies : FALLBACK_MOVIES.slice(14, 20)} direction="left" speed="fast" />
      </div>

      {/* Centered content overlay */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4">
        {/* Glass card container */}
        <div className="glass rounded-2xl p-12 max-w-md w-full text-center shadow-2xl">
          {/* Logo/Title */}
          <h1 className="text-5xl font-bold text-[var(--color-text)] mb-2 tracking-tight">
            Movie Draft
          </h1>
          <p className="text-[var(--color-text-muted)] mb-8">
            Draft movies with friends. Debate who won.
          </p>

          {/* CTA Button */}
          {isLoggedIn ? (
            <Link
              to="/create"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-lg font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors duration-200 shadow-lg hover:shadow-[var(--shadow-glow)]"
            >
              Create Draft
            </Link>
          ) : (
            <div className="space-y-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 text-lg font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors duration-200 shadow-lg hover:shadow-[var(--shadow-glow)]"
              >
                Get Started
              </Link>
              <p className="text-sm text-[var(--color-text-subtle)]">
                Already have an account?{' '}
                <Link to="/login" className="text-[var(--color-primary)] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-sm text-[var(--color-text-subtle)]">
        Powered by TMDB
      </footer>
    </div>
  );
}

 
const FALLBACK_MOVIES: Movie[] = [
  { id: 575265, title: "Mission: Impossible - The Final Reckoning", poster_path: "/z53D72EAOxGRqdr7KXXWp9dJiDe.jpg" },
  { id: 354912, title: "Coco", poster_path: "/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg" },
  { id: 157336, title: "Interstellar", poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
  { id: 238, title: "The Godfather", poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg" },
  { id: 27205, title: "Inception", poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg" },
  { id: 155, title: "The Dark Knight", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { id: 550, title: "Fight Club", poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" },
  { id: 680, title: "Pulp Fiction", poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg" },
  { id: 13, title: "Forrest Gump", poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" },
  { id: 278, title: "The Shawshank Redemption", poster_path: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg" },
  { id: 424, title: "Schindler's List", poster_path: "/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg" },
  { id: 497, title: "The Green Mile", poster_path: "/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg" },
  { id: 129, title: "Spirited Away", poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg" },
  { id: 122, title: "The Lord of the Rings: The Return of the King", poster_path: "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg" },
  { id: 769, title: "GoodFellas", poster_path: "/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg" },
  { id: 389, title: "12 Angry Men", poster_path: "/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg" },
  { id: 637, title: "Life Is Beautiful", poster_path: "/74hLDKjD5aGYOotO6esUVaeISa2.jpg" },
  { id: 324857, title: "Spider-Man: Into the Spider-Verse", poster_path: "/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg" },
  { id: 599, title: "Sunset Boulevard", poster_path: "/sC4Dpmn87oz9AuxSKwHXeDXU3t9.jpg" },
  { id: 372058, title: "Your Name.", poster_path: "/q719jXXEzOoYaps6babgKnONONX.jpg" },
];

export default LandingPage;
