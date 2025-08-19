// src/app.ts
import fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import routes from './routes';

// Load environment variables from .env file
dotenv.config();

const app = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        singleLine: false,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname'
      }
    }
  },
  ajv: {
    customOptions: {
      allErrors: true,   // 一次性输出所有校验错误
      strict: true       // 保持严格模式，避免隐患；若历史Schema较混乱可临时设为 false
    }
  }
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
