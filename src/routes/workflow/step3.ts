/**
 * 步骤3: 网站信息架构
 * 根据公司和产品信息，规划网站地图和全局元素
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { websiteArchitectureSchema, responseSchema } from '../../schemas';

// 请求Schema
const step3RequestSchema = {
  type: 'object',
  properties: {
    companyName: { 
      type: 'string', 
      minLength: 1,
      maxLength: 100,
      description: '公司名称'
    },
    products: { 
      type: 'array', 
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          category: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', minLength: 10, maxLength: 500 }
        },
        required: ['name', 'category']
      }
    },
    industry: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: '公司所属行业'
    },
    targetMarket: {
      type: 'string',
      enum: ['B2B', 'B2C', 'Enterprise', 'SMB'],
      description: '目标市场类型'
    }
  },
  required: ['companyName', 'products'],
  additionalProperties: false
};

// 响应Schema
const step3ResponseSchema = responseSchema(websiteArchitectureSchema);

// 完整的路由Schema
const step3Schema: FastifySchema = {
  body: step3RequestSchema,
  response: step3ResponseSchema
};

/**
 * 步骤3路由注册
 */
export default async function step3Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/3-website-architecture', { 
    schema: step3Schema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { companyName, products, industry, targetMarket } = request.body as {
        companyName: string;
        products: Array<{ name: string; category: string; description?: string }>;
        industry?: string;
        targetMarket?: string;
      };
      
      // TODO: 核心业务逻辑
      // 1. 构建AI Prompt，指示AI扮演信息架构师
      // 2. 根据公司名称和产品信息生成网站地图
      // 3. 设计全局导航和页脚结构
      // 4. 调用AI模型，强制返回符合websiteArchitectureSchema结构的JSON
      // 5. 验证AI返回的数据结构
      // 6. 返回网站架构信息
      
      // 临时返回示例数据（实际应该调用AI服务）
      const mockWebsiteArchitecture = {
        globalElements: {
          header: {
            logo: `/images/${companyName.toLowerCase().replace(/\s+/g, '-')}-logo.png`,
            menuItems: [
              { name: '首页', path: '/', icon: 'home' },
              { name: '产品', path: '/products', icon: 'products' },
              { name: '关于我们', path: '/about', icon: 'about' },
              { name: '联系我们', path: '/contact', icon: 'contact' }
            ],
            ctaButton: {
              text: '获取报价',
              url: '/quote',
              style: 'primary'
            }
          },
          footer: {
            sections: [
              {
                title: '产品服务',
                links: [
                  { name: '产品目录', url: '/products' },
                  { name: '解决方案', url: '/solutions' },
                  { name: '技术支持', url: '/support' }
                ]
              },
              {
                title: '公司信息',
                links: [
                  { name: '关于我们', url: '/about' },
                  { name: '新闻动态', url: '/news' },
                  { name: '加入我们', url: '/careers' }
                ]
              }
            ],
            copyright: `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`
          }
        },
        pages: [
          {
            name: '首页',
            path: '/',
            purpose: '展示公司核心价值和主要产品',
            priority: 1,
            meta: {
              title: `${companyName} - ${industry || '专业服务'}`,
              description: `${companyName}专注于${industry || '专业服务'}，提供高质量的产品和解决方案`,
              keywords: [companyName, industry || '专业服务', '产品', '解决方案']
            }
          },
          {
            name: '产品页面',
            path: '/products',
            purpose: '展示所有产品和服务',
            priority: 2,
            meta: {
              title: `产品服务 - ${companyName}`,
              description: `浏览${companyName}的完整产品线和服务`,
              keywords: ['产品', '服务', companyName, industry || '专业服务']
            }
          },
          {
            name: '关于我们',
            path: '/about',
            purpose: '介绍公司历史、团队和价值观',
            priority: 3,
            meta: {
              title: `关于${companyName}`,
              description: `了解${companyName}的发展历程、企业文化和服务理念`,
              keywords: ['关于我们', companyName, '企业文化', '发展历程']
            }
          },
          {
            name: '联系我们',
            path: '/contact',
            purpose: '提供联系方式和咨询表单',
            priority: 4,
            meta: {
              title: `联系我们 - ${companyName}`,
              description: `联系${companyName}，获取专业咨询和报价`,
              keywords: ['联系我们', '咨询', '报价', companyName]
            }
          }
        ],
        sitemap: '/sitemap.xml',
        robots: '/robots.txt'
      };

      return reply.send({
        success: true,
        data: mockWebsiteArchitecture,
        message: '网站架构规划成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('步骤3执行失败');
      console.error('步骤3执行失败:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '网站架构规划失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
