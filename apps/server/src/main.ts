import { serve } from '@hono/node-server';
import type { Server } from 'http';
import { app } from './app';
import { config } from './config';
import { initializeSocketIO } from './socket';

const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║           Movie Draft API Server                  ║
╠═══════════════════════════════════════════════════╣
║  🚀 Server running on http://localhost:${config.port}${' '.repeat(12)}║
║  📍 Environment: ${config.nodeEnv.padEnd(28)}║
║  🏥 Health: http://localhost:${config.port}/health${' '.repeat(10)}║
║  🔌 WebSocket: ws://localhost:${config.port}${' '.repeat(14)}║
╚═══════════════════════════════════════════════════╝
    `);
  },
);

initializeSocketIO(server as unknown as Server);

const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
