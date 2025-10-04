import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import pageBuilderRoutes from './page-builder';
import patternConverterRoutes from './pattern-converter';
import patternAnalyzerRoutes from './pattern-analyzer';

export default async function siteBuilderRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    await fastify.register(pageBuilderRoutes, { prefix: '/site-builder' });
    await fastify.register(patternConverterRoutes, { prefix: '/site-builder' });
    await fastify.register(patternAnalyzerRoutes, { prefix: '/site-builder' });
    fastify.log.info('Site Builder routes registered');
}