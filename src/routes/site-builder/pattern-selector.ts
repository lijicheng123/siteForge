// src/routes/site-builder/pattern-selector.ts
import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { responseSchema } from '../../schemas/base';
import { executePatternSelector } from '../../services/site-builder/pattern-selector.service';
import { PatternSelectorRequestSchema, PatternSelectorResponseSchema } from '../../schemas/site-builder/pattern-selector';

// 完整的路由Schema
const PatternSelectorSchema: FastifySchema = {
  body: PatternSelectorRequestSchema,
  response: responseSchema(PatternSelectorResponseSchema)
};

export default async function PatternSelectorRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post('/pattern-selector', { schema: PatternSelectorSchema }, async (request, reply) => {
    try {
      const startTime = Date.now();
      const data = await executePatternSelector(request.body as any);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return reply.send({
        success: true,
        data: data,
        message: 'Pattern 选择成功',
        duration,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('PatternSelectorRoutes error', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Pattern 选择失败',
        timestamp: new Date().toISOString()
      });
    }
  });
}

