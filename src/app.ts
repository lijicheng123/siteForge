// src/app.ts
import fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import routes from './routes';

// Load environment variables from .env file
dotenv.config();

const app = fastify({
  logger: true,
});

// Register Plugins
app.register(cors, {
  origin: '*', // For development only. Restrict in production.
});

// Register Routes
app.register(routes);

// Health Check Route
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    await app.listen({ port, host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
