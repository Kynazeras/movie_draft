import 'dotenv/config';

export const config = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  isDev: process.env['NODE_ENV'] === 'development',
  isProd: process.env['NODE_ENV'] === 'production',
  
   
  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http: 
    credentials: true,
  },
  
   
  tmdb: {
    apiKey: process.env['TMDB_API_KEY'] || '',
    baseUrl: 'https: 
    imageBaseUrl: 'https: 
  },
  
   
  auth: {
    secret: process.env['AUTH_SECRET'] || 'dev-secret-change-in-production',
  },
} as const;

export type Config = typeof config;
