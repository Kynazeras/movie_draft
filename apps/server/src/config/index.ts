import 'dotenv/config';

export const config = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  isDev: process.env['NODE_ENV'] === 'development',
  isProd: process.env['NODE_ENV'] === 'production',

  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:4200',
    credentials: true,
  },

  tmdb: {
    apiKey: process.env['TMDB_API_KEY'] || '',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },

  auth: {
    secret: process.env['AUTH_SECRET'] || 'dev-secret-change-in-production',
  },
} as const;

export type Config = typeof config;
