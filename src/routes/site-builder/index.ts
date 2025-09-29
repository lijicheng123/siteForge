import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import pageBuilderRoutes from './page-builder';

export default async function siteBuilderRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    console.log('siteBuilderRoutes');
    await fastify.register(pageBuilderRoutes, { prefix: '/site-builder' });
    fastify.log.info('Site Builder routes registered');
    fastify.log.info('所有路由注册完成 999');
}