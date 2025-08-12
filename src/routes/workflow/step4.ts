/**
 * 步骤4: 页面内容策划
 * 为网站的每个页面规划详细的SEO信息和内容大纲
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { websiteBlueprintV1Schema, websiteBlueprintV2Schema, responseSchema } from '../../schemas';

// 请求Schema - 直接复用输入蓝图V1
const step4RequestSchema = websiteBlueprintV1Schema as any;

// 响应Schema - 输出蓝图V2
const step4ResponseSchema = responseSchema(websiteBlueprintV2Schema);

// 完整的路由Schema
const step4Schema: FastifySchema = {
  body: step4RequestSchema,
  response: step4ResponseSchema
};

/**
 * 步骤4路由注册
 */
export default async function step4Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/4-plan-content', { 
    schema: step4Schema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { structuredData, designSystem, globalElements, pages } = request.body as {
        structuredData: any;
        designSystem: any;
        globalElements: any;
        pages: Array<{ name: string; path: string; purpose: string }>;
      };
      
      // TODO: 核心业务逻辑
      // 1. 遍历蓝图中的每个页面
      // 2. 为每个页面构建AI Prompt，指示AI扮演内容策略专家
      // 3. 生成每个页面的SEO信息和内容大纲
      // 4. 调用AI模型，获取每个页面的seo和outline数据
      // 5. 将生成的数据整合回蓝图，形成WebsiteBlueprint_V2
      // 6. 返回更新后的蓝图
      
      // 临时返回示例数据（实际应该调用AI服务）
      const enhancedPages = pages.map(page => {
        // 根据页面路径和用途生成相应的SEO和内容大纲
        let seo, outline;
        
        switch (page.path) {
          case '/':
            seo = {
              title: `${structuredData.companyInfo.name} - ${structuredData.companyInfo.industry}专业服务`,
              description: `${structuredData.companyInfo.description}，提供${structuredData.companyInfo.industry}领域的专业解决方案`,
              primaryKeyword: structuredData.companyInfo.industry,
              secondaryKeywords: [structuredData.companyInfo.name, '专业服务', '解决方案']
            };
            outline = [
              {
                sectionName: '英雄区域',
                instruction: '展示公司核心价值主张和主要产品，包含醒目的CTA按钮',
                priority: 1,
                estimatedWords: 200
              },
              {
                sectionName: '产品展示',
                instruction: '展示3-4个核心产品，每个产品包含图片、名称、简短描述和链接',
                priority: 2,
                estimatedWords: 300
              },
              {
                sectionName: '公司优势',
                instruction: '展示公司的核心竞争优势，如技术实力、服务经验、客户案例等',
                priority: 3,
                estimatedWords: 250
              },
              {
                sectionName: '客户见证',
                instruction: '展示客户评价和成功案例，增强信任感',
                priority: 4,
                estimatedWords: 200
              }
            ];
            break;
            
          case '/products':
            seo = {
              title: `产品服务 - ${structuredData.companyInfo.name}`,
              description: `浏览${structuredData.companyInfo.name}的完整产品线，涵盖${structuredData.companyInfo.industry}各个领域`,
              primaryKeyword: '产品服务',
              secondaryKeywords: [structuredData.companyInfo.name, structuredData.companyInfo.industry, '产品线']
            };
            outline = [
              {
                sectionName: '产品分类导航',
                instruction: '按产品类别组织产品，提供清晰的分类导航',
                priority: 1,
                estimatedWords: 150
              },
              {
                sectionName: '产品列表',
                instruction: '展示所有产品，每个产品包含图片、名称、描述、特点和规格参数',
                priority: 2,
                estimatedWords: 800
              },
              {
                sectionName: '技术规格',
                instruction: '详细的技术参数表格，帮助客户了解产品性能',
                priority: 3,
                estimatedWords: 400
              }
            ];
            break;
            
          case '/about':
            seo = {
              title: `关于${structuredData.companyInfo.name} - ${structuredData.companyInfo.industry}专业服务商`,
              description: `了解${structuredData.companyInfo.name}的发展历程、企业文化、团队实力和服务理念`,
              primaryKeyword: '关于我们',
              secondaryKeywords: [structuredData.companyInfo.name, '企业文化', '发展历程', '团队实力']
            };
            outline = [
              {
                sectionName: '公司简介',
                instruction: '介绍公司基本情况和核心业务',
                priority: 1,
                estimatedWords: 300
              },
              {
                sectionName: '发展历程',
                instruction: '时间线形式展示公司重要发展节点和里程碑',
                priority: 2,
                estimatedWords: 400
              },
              {
                sectionName: '企业文化',
                instruction: '展示公司价值观、使命愿景和企业文化',
                priority: 3,
                estimatedWords: 300
              },
              {
                sectionName: '团队介绍',
                instruction: '介绍核心团队成员和他们的专业背景',
                priority: 4,
                estimatedWords: 250
              }
            ];
            break;
            
          case '/contact':
            seo = {
              title: `联系我们 - ${structuredData.companyInfo.name}`,
              description: `联系${structuredData.companyInfo.name}，获取${structuredData.companyInfo.industry}专业咨询和报价`,
              primaryKeyword: '联系我们',
              secondaryKeywords: [structuredData.companyInfo.name, '咨询', '报价', '联系方式']
            };
            outline = [
              {
                sectionName: '联系信息',
                instruction: '展示公司地址、电话、邮箱等联系方式',
                priority: 1,
                estimatedWords: 200
              },
              {
                sectionName: '咨询表单',
                instruction: '提供在线咨询表单，收集客户需求信息',
                priority: 2,
                estimatedWords: 150
              },
              {
                sectionName: '服务区域',
                instruction: '展示公司服务的地理区域和覆盖范围',
                priority: 3,
                estimatedWords: 200
              }
            ];
            break;
            
          default:
            seo = {
              title: `${page.name} - ${structuredData.companyInfo.name}`,
              description: `${page.purpose}，${structuredData.companyInfo.description}`,
              primaryKeyword: page.name,
              secondaryKeywords: [structuredData.companyInfo.name, structuredData.companyInfo.industry]
            };
            outline = [
              {
                sectionName: '页面内容',
                instruction: page.purpose,
                priority: 1,
                estimatedWords: 300
              }
            ];
        }
        
        return {
          ...page,
          seo,
          outline
        };
      });

      const blueprintV2 = {
        structuredData,
        designSystem,
        globalElements,
        pages: enhancedPages
      };

      return reply.send({
        success: true,
        data: blueprintV2,
        message: '页面内容策划成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('步骤4执行失败');
      console.error('步骤4执行失败:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '页面内容策划失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
