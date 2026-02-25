import { useEffect, useState } from 'react';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
}

interface PosterRowProps {
  direction?: 'left' | 'right';
  speed?: 'slow' | 'normal' | 'fast';
  movies: Movie[];
}

const TMDB_IMAGE_BASE = 'https: 

export function PosterRow({ direction = 'left', speed = 'normal', movies }: PosterRowProps) {
   
  const duplicatedMovies = [...movies, ...movies];
  
  const animationClass = direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right';
  
  const speedClass = {
    slow: 'duration-[90s]',
    normal: 'duration-[60s]',
    fast: 'duration-[40s]',
  }[speed];

  return (
    <div className="poster-row relative overflow-hidden py-2">
      {/* Left gradient overlay */}
      <div className="poster-gradient-left absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none" />
      
      {/* Right gradient overlay */}
      <div className="poster-gradient-right absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none" />
      
      {/* Scrolling container */}
      <div 
        className={`flex gap-4 ${animationClass}`}
        style={{
          width: 'fit-content',
          animationDuration: speed === 'slow' ? '90s' : speed === 'fast' ? '40s' : '60s',
        }}
      >
        {duplicatedMovies.map((movie, index) => (
          <div
            key={`${movie.id}-${index}`}
            className="flex-shrink-0 w-[154px] h-[231px] rounded-lg overflow-hidden bg-[var(--color-surface)] transition-transform duration-300 hover:scale-105"
          >
            {movie.poster_path ? (
              <img
                src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-text-subtle)] text-xs text-center p-2">
                {movie.title}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

 
export const PLACEHOLDER_MOVIES: Movie[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  title: `Movie ${i + 1}`,
  poster_path: null,
}));
