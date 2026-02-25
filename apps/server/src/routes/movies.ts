import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware';
import {
  searchMovies,
  getMovieDetails,
  getPopularMovies,
  getNowPlayingMovies,
} from '../services/tmdb.service';

const movies = new Hono();

movies.use('*', authMiddleware);

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
});

const pageQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
});

/**
 * Search movies
 * GET /movies/search?q=query&page=1
 */
movies.get('/search', zValidator('query', searchQuerySchema), async (c) => {
  const { q, page } = c.req.valid('query');

  try {
    const result = await searchMovies(q, page);
    return c.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not configured')) {
      throw new HTTPException(503, {
        message: 'Movie search service is not configured',
      });
    }
    throw error;
  }
});

/**
 * Get movie details
 * GET /movies/:id
 */
movies.get('/:id', async (c) => {
  const movieId = parseInt(c.req.param('id'), 10);

  if (isNaN(movieId)) {
    throw new HTTPException(400, { message: 'Invalid movie ID' });
  }

  try {
    const movie = await getMovieDetails(movieId);

    if (!movie) {
      throw new HTTPException(404, { message: 'Movie not found' });
    }

    return c.json({ movie });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    if (error instanceof Error && error.message.includes('not configured')) {
      throw new HTTPException(503, {
        message: 'Movie service is not configured',
      });
    }
    throw error;
  }
});

/**
 * Get popular movies
 * GET /movies/popular?page=1
 */
movies.get(
  '/lists/popular',
  zValidator('query', pageQuerySchema),
  async (c) => {
    const { page } = c.req.valid('query');

    try {
      const result = await getPopularMovies(page);
      return c.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not configured')) {
        throw new HTTPException(503, {
          message: 'Movie service is not configured',
        });
      }
      throw error;
    }
  },
);

/**
 * Get now playing movies
 * GET /movies/now-playing?page=1
 */
movies.get(
  '/lists/now-playing',
  zValidator('query', pageQuerySchema),
  async (c) => {
    const { page } = c.req.valid('query');

    try {
      const result = await getNowPlayingMovies(page);
      return c.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not configured')) {
        throw new HTTPException(503, {
          message: 'Movie service is not configured',
        });
      }
      throw error;
    }
  },
);

export { movies as movieRoutes };
