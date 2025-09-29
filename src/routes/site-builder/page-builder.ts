import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { responseSchema } from '../../schemas/base';
import { executePageBuilder } from '../../services/site-builder/page-builder';
import { PageBuilderRequestSchema, PageBuilderResponseSchema } from '../../schemas/site-builder/schema';



// 完整的路由Schema
const PageBuilderSchema: FastifySchema = {
    body: PageBuilderRequestSchema,
    response: responseSchema(PageBuilderResponseSchema)
  };

  export default async function PageBuilderRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.post('/page-builder', { schema: PageBuilderSchema }, async (request, reply) => {
        const startTime = Date.now();
        const data = await executePageBuilder(request.body as any);
        const endTime = Date.now();
        const duration = endTime - startTime;
        return reply.send({
            success: true,
            data,
            message: '页面构建成功',
            duration,
            timestamp: new Date().toISOString()
          });
    });
  }