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
║  🚀 Server running on http: 
║  📍 Environment: ${config.nodeEnv.padEnd(28)}║
║  🏥 Health: http: 
║  🔌 WebSocket: ws: 
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
