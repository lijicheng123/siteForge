import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { responseSchema } from '../../schemas/base';
import { executePatternConverter } from '../../services/site-builder/pattern-converter.service';
import { 
    PatternConverterRequestBodySchema, 
    PatternConverterResponseSchema 
} from '../../schemas/site-builder/pattern-converter';

// 完整的路由Schema
const PatternConverterSchema: FastifySchema = {
    body: PatternConverterRequestBodySchema,
    response: responseSchema(PatternConverterResponseSchema)
};

export default async function PatternConverterRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.post('/pattern-converter', { schema: PatternConverterSchema }, async (request, reply) => {
        try {
            const startTime = Date.now();
            const data = await executePatternConverter(request.body as any);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            return reply.send({
                success: true,
                data: data,
                message: 'Pattern转换成功',
                duration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('PatternConverterRoutes error', error);
            return reply.status(500).send({
                success: false,
                error: 'INTERNAL_ERROR',
                message: 'Pattern转换失败',
                timestamp: new Date().toISOString()
            });
        }
    });
}

