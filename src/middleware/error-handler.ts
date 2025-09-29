/**
 * 全局错误处理中间件
 * 统一处理验证错误、业务错误和系统错误
 */

import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export interface ErrorDetail {
  field?: string;
  message: string;
  received?: any;
  expected?: string;
}

export interface StandardErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: ErrorDetail[];
  debug?: {
    requestBody?: any;
    requestParams?: any;
    requestQuery?: any;
    requestHeaders?: any;
    timestamp: string;
    path: string;
    method: string;
  };
  timestamp: string;
}

/**
 * 注册全局错误处理器
 */
export function registerErrorHandler(fastify: FastifyInstance) {
  
  // 设置错误处理器
  fastify.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // 记录错误到日志
    fastify.log.error({
      error: error.message,
      stack: error.stack,
      method: request.method,
      url: request.url,
      body: request.body,
      params: request.params,
      query: request.query
    }, '请求处理错误');

    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = '服务器内部错误';
    let details: ErrorDetail[] = [];

    // 处理不同类型的错误
    if (error.validation) {
      // Schema 验证错误
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = '请求参数验证失败';
      
      // 解析验证错误详情
      details = error.validation.map(validationError => ({
        field: validationError.instancePath || validationError.schemaPath,
        message: validationError.message || '格式不正确',
        received: validationError.data,
        expected: validationError.schema?.type || '未知类型'
      }));

      // 在开发环境下，打印详细的验证错误信息
      if (isDevelopment) {
        console.log('\n=== 请求参数验证失败 ===');
        console.log('路由:', request.method, request.url);
        console.log('请求体:', JSON.stringify(request.body, null, 2));
        console.log('验证错误详情:');
        details.forEach((detail, index) => {
          console.log(`  ${index + 1}. 字段: ${detail.field || '根级别'}`);
          console.log(`     错误: ${detail.message}`);
          console.log(`     收到: ${JSON.stringify(detail.received)}`);
          console.log(`     期望: ${detail.expected}`);
        });
        console.log('========================\n');
      }
      
    } else if (error.statusCode === 413) {
      // 请求体过大
      statusCode = 413;
      errorCode = 'PAYLOAD_TOO_LARGE';
      message = '请求数据过大';
      
    } else if (error.statusCode === 415) {
      // 不支持的媒体类型
      statusCode = 415;
      errorCode = 'UNSUPPORTED_MEDIA_TYPE';
      message = '不支持的内容类型';
      
    } else if (error.statusCode && error.statusCode < 500) {
      // 客户端错误
      statusCode = error.statusCode;
      errorCode = 'CLIENT_ERROR';
      message = error.message || '客户端请求错误';
      
    } else {
      // 服务器错误
      statusCode = error.statusCode || 500;
      errorCode = 'INTERNAL_ERROR';
      message = isDevelopment ? error.message : '服务器内部错误';
    }

    // 构建错误响应
    const errorResponse: StandardErrorResponse = {
      success: false,
      error: errorCode,
      message,
      details: details.length > 0 ? details : undefined,
      timestamp: new Date().toISOString()
    };

    // 在开发环境下添加调试信息
    if (isDevelopment) {
      errorResponse.debug = {
        requestBody: request.body,
        requestParams: request.params,
        requestQuery: request.query,
        requestHeaders: request.headers,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method
      };
    }

    // 发送错误响应
    reply.status(statusCode).send(errorResponse);
  });
}
