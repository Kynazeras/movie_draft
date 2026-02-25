import { config } from '../config';

const TMDB_BASE_URL = config.tmdb.baseUrl;
const TMDB_API_KEY = config.tmdb.apiKey;
const TMDB_IMAGE_BASE_URL = config.tmdb.imageBaseUrl;

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
}

export interface TMDBMovieDetail extends TMDBMovie {
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
  tagline: string | null;
  budget: number;
  revenue: number;
  imdb_id: string | null;
}

export interface TMDBSearchResult {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface MovieSearchResult {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  overview: string;
  rating: number;
}

export function getPosterUrl(
  posterPath: string | null,
  size = 'w342',
): string | null {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath}`;
}

export function getBackdropUrl(
  backdropPath: string | null,
  size = 'w780',
): string | null {
  if (!backdropPath) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath}`;
}

function getYear(releaseDate: string | undefined): number | null {
  if (!releaseDate) return null;
  const year = parseInt(releaseDate.split('-')[0], 10);
  return isNaN(year) ? null : year;
}

export async function searchMovies(
  query: string,
  page = 1,
): Promise<{
  movies: MovieSearchResult[];
  totalPages: number;
  totalResults: number;
}> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured');
  }

  const url = new URL(`${TMDB_BASE_URL}/search/movie`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('query', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('include_adult', 'false');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: TMDBSearchResult = await response.json();

  const movies: MovieSearchResult[] = data.results.map((movie) => ({
    id: movie.id,
    title: movie.title,
    year: getYear(movie.release_date),
    posterUrl: getPosterUrl(movie.poster_path),
    overview: movie.overview,
    rating: movie.vote_average,
  }));

  return {
    movies,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}

export async function getMovieDetails(movieId: number): Promise<{
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string;
  tagline: string | null;
  runtime: number | null;
  rating: number;
  genres: string[];
  imdbId: string | null;
} | null> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured');
  }

  const url = new URL(`${TMDB_BASE_URL}/movie/${movieId}`);
  url.searchParams.set('api_key', TMDB_API_KEY);

  const response = await fetch(url.toString());

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText}`,
    );
  }

  const movie: TMDBMovieDetail = await response.json();

  return {
    id: movie.id,
    title: movie.title,
    year: getYear(movie.release_date),
    posterUrl: getPosterUrl(movie.poster_path),
    backdropUrl: getBackdropUrl(movie.backdrop_path),
    overview: movie.overview,
    tagline: movie.tagline,
    runtime: movie.runtime,
    rating: movie.vote_average,
    genres: movie.genres.map((g) => g.name),
    imdbId: movie.imdb_id,
  };
}

export async function getPopularMovies(
  page = 1,
): Promise<{ movies: MovieSearchResult[]; totalPages: number }> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured');
  }

  const url = new URL(`${TMDB_BASE_URL}/movie/popular`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('page', String(page));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: TMDBSearchResult = await response.json();

  const movies: MovieSearchResult[] = data.results.map((movie) => ({
    id: movie.id,
    title: movie.title,
    year: getYear(movie.release_date),
    posterUrl: getPosterUrl(movie.poster_path),
    overview: movie.overview,
    rating: movie.vote_average,
  }));

  return {
    movies,
    totalPages: data.total_pages,
  };
}

export async function getNowPlayingMovies(
  page = 1,
): Promise<{ movies: MovieSearchResult[]; totalPages: number }> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured');
  }

  const url = new URL(`${TMDB_BASE_URL}/movie/now_playing`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('page', String(page));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: TMDBSearchResult = await response.json();

  const movies: MovieSearchResult[] = data.results.map((movie) => ({
    id: movie.id,
    title: movie.title,
    year: getYear(movie.release_date),
    posterUrl: getPosterUrl(movie.poster_path),
    overview: movie.overview,
    rating: movie.vote_average,
  }));

  return {
    movies,
    totalPages: data.total_pages,
  };
}
