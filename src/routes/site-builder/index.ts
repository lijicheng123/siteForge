import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import pageBuilderRoutes from './page-builder';

export default async function siteBuilderRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    await fastify.register(pageBuilderRoutes, { prefix: '/site-builder' });
    fastify.log.info('Site Builder routes registered');
}