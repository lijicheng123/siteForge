/**
 * 步骤2: 品牌视觉设计
 * 根据行业和用户偏好，创建全局设计规范
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { designSystemSchema, responseSchema } from '../../schemas';

// 请求Schema
const step2RequestSchema = {
  type: 'object',
  properties: {
    industry: { 
      type: 'string', 
      minLength: 1,
      maxLength: 100,
      description: '公司所属行业，例如：工业LED照明'
    },
    preference: { 
      type: 'string', 
      minLength: 10,
      maxLength: 500,
      description: '目标客户的设计偏好，例如：简洁明了的设计'
    },
    brandPersonality: {
      type: 'string',
      enum: ['professional', 'creative', 'friendly', 'luxury', 'minimalist', 'bold'],
      description: '品牌个性特征'
    },
    targetMarket: {
      type: 'string',
      enum: ['B2B', 'B2C', 'Enterprise', 'SMB'],
      description: '目标市场类型'
    }
  },
  required: ['industry', 'preference'],
  additionalProperties: false
};

// 响应Schema
const step2ResponseSchema = responseSchema(designSystemSchema);

// 完整的路由Schema
const step2Schema: FastifySchema = {
  body: step2RequestSchema,
  response: step2ResponseSchema
};

/**
 * 步骤2路由注册
 */
export default async function step2Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/2-design-system', { 
    schema: step2Schema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { industry, preference, brandPersonality, targetMarket } = request.body as {
        industry: string;
        preference: string;
        brandPersonality?: string;
        targetMarket?: string;
      };
      
      // TODO: 核心业务逻辑
      // 1. 构建AI Prompt，指示AI扮演品牌视觉设计师
      // 2. 根据行业和偏好生成调色板、字体、间距等设计规范
      // 3. 调用AI模型，强制返回符合designSystemSchema结构的JSON
      // 4. 验证AI返回的数据结构
      // 5. 返回设计系统配置
      
      // 临时返回示例数据（实际应该调用AI服务）
      const mockDesignSystem = {
        palette: {
          primary: "#2563eb",
          secondary: "#64748b", 
          accent: "#f59e0b",
          text_on_dark: "#ffffff",
          text_on_light: "#1e293b",
          background_light: "#ffffff",
          background_medium: "#f8fafc",
          background_dark: "#0f172a"
        },
        typography: {
          font_family_heading: "Inter",
          font_family_body: "Inter",
          font_size_base: "16px",
          line_height_base: 1.6
        },
        spacing: {
          xs: "4px",
          sm: "8px",
          md: "16px",
          lg: "24px",
          xl: "32px",
          xxl: "48px"
        },
        borderRadius: {
          none: "0px",
          sm: "4px",
          md: "8px",
          lg: "16px",
          full: "9999px"
        },
        shadow: {
          none: "none",
          sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
        }
      };

      return reply.send({
        success: true,
        data: mockDesignSystem,
        message: '设计系统生成成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('步骤2执行失败');
      console.error('步骤2执行失败:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '设计系统生成失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
