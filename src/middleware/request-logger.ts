/**
 * 请求日志中间件
 * 记录所有进入的请求信息，便于调试
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export interface RequestLogOptions {
  logBody?: boolean;
  logHeaders?: boolean;
  logQuery?: boolean;
  logParams?: boolean;
  excludePaths?: string[];
  maxBodyLength?: number;
}

const defaultOptions: RequestLogOptions = {
  logBody: true,
  logHeaders: false,  // 默认不记录headers（可能包含敏感信息）
  logQuery: true,
  logParams: true,
  excludePaths: ['/health', '/api/health'],
  maxBodyLength: 10000  // 限制body日志长度
};

/**
 * 注册请求日志中间件
 */
export function registerRequestLogger(fastify: FastifyInstance, options: RequestLogOptions = {}) {
  const config = { ...defaultOptions, ...options };
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // 只在开发环境启用详细日志
  if (!isDevelopment) {
    return;
  }

  // 注册 preHandler 钩子来记录请求
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // 跳过排除的路径
    if (config.excludePaths?.some(path => request.url.startsWith(path))) {
      return;
    }

    const logInfo: any = {
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString(),
      userAgent: request.headers['user-agent'],
      ip: request.ip
    };

    // 记录请求参数
    if (config.logParams && Object.keys(request.params || {}).length > 0) {
      logInfo.params = request.params;
    }

    // 记录查询参数
    if (config.logQuery && Object.keys(request.query || {}).length > 0) {
      logInfo.query = request.query;
    }

    // 记录请求头（谨慎使用）
    if (config.logHeaders) {
      const headers = { ...request.headers };
      // 移除敏感信息
      delete headers.authorization;
      delete headers.cookie;
      delete headers['x-api-key'];
      logInfo.headers = headers;
    }

    // 记录请求体
    if (config.logBody && request.body) {
      let bodyToLog = request.body;
      
      // 如果是字符串且超过限制长度，则截断
      if (typeof bodyToLog === 'string' && bodyToLog.length > config.maxBodyLength!) {
        bodyToLog = bodyToLog.substring(0, config.maxBodyLength!) + '... [截断]';
      } 
      // 如果是对象，转换为字符串并检查长度
      else if (typeof bodyToLog === 'object') {
        const bodyStr = JSON.stringify(bodyToLog, null, 2);
        if (bodyStr.length > config.maxBodyLength!) {
          bodyToLog = JSON.stringify(bodyToLog) + '... [过长已截断]';
        }
      }
      
      logInfo.body = bodyToLog;
    }

    // 使用 Fastify 的日志器记录
    fastify.log.info(logInfo, '收到请求');

    // 在控制台也打印一份（便于开发调试）
    console.log('\n=== 新请求 ===');
    console.log(`${request.method} ${request.url}`);
    if (config.logParams && logInfo.params) {
      console.log('参数:', JSON.stringify(logInfo.params, null, 2));
    }
    if (config.logQuery && logInfo.query) {
      console.log('查询:', JSON.stringify(logInfo.query, null, 2));
    }
    if (config.logBody && logInfo.body) {
      console.log('请求体:', typeof logInfo.body === 'string' ? logInfo.body : JSON.stringify(logInfo.body, null, 2));
    }
    console.log('时间:', logInfo.timestamp);
    console.log('================\n');
  });

  // 记录响应信息
  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
    // 跳过排除的路径
    if (config.excludePaths?.some(path => request.url.startsWith(path))) {
      return payload;
    }

    const responseInfo = {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: Date.now() - (request as any).startTime,
      timestamp: new Date().toISOString()
    };

    fastify.log.info(responseInfo, '响应完成');
    
    return payload;
  });

  // 记录请求开始时间
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    (request as any).startTime = Date.now();
  });
}
