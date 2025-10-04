// src/routes/site-builder/pattern-analyzer.ts
import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { responseSchema } from '../../schemas/base';
import { analyzePatternLayout } from '../../services/site-builder/pattern-analyzer.service';
import { 
    PatternAnalyzerRequestBodySchema, 
    PatternAnalyzerResponseSchema 
} from '../../schemas/site-builder/pattern-analyzer';

// 完整的路由Schema
const PatternAnalyzerSchema: FastifySchema = {
    body: PatternAnalyzerRequestBodySchema,
    response: responseSchema(PatternAnalyzerResponseSchema)
};

export default async function PatternAnalyzerRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // POST /site-builder/analyze-pattern - 分析单个 Pattern 的布局
    fastify.post('/analyze-pattern', { schema: PatternAnalyzerSchema }, async (request, reply) => {
        try {
            const { id } = request.body as any;
            const startTime = Date.now();
            
            fastify.log.info(`开始分析 Pattern ID: ${id}`);
            
            const data = await analyzePatternLayout(id);
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            fastify.log.info(`Pattern ID ${id} 分析完成，耗时: ${duration}ms`);
            
            return reply.send({
                success: true,
                data: data,
                message: `Pattern ${id} 布局分析成功`,
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            fastify.log.error('PatternAnalyzerRoutes error:', error);
            
            // 检查是否是图片不存在的错误
            if (error.message && error.message.includes('Image not found')) {
                return reply.status(404).send({
                    success: false,
                    error: 'IMAGE_NOT_FOUND',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
            
            return reply.status(500).send({
                success: false,
                error: 'INTERNAL_ERROR',
                message: 'Pattern 布局分析失败',
                timestamp: new Date().toISOString()
            });
        }
    });
}

