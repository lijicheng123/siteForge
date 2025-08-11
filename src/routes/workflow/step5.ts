/**
 * 步骤5: 区块布局设计
 * 将自然语言的内容大纲翻译成精确的结构化区块布局指令
 */

import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { websiteBlueprintV3Schema, responseSchema } from '../../schemas';

// 请求Schema
const step5RequestSchema = {
  type: 'object',
  properties: {
    blueprintV2: {
      type: 'object',
      properties: {
        structuredData: { type: 'object' },
        designSystem: { type: 'object' },
        globalElements: { type: 'object' },
        pages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              purpose: { type: 'string' },
              seo: { type: 'object' },
              outline: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    sectionName: { type: 'string' },
                    instruction: { type: 'string' },
                    priority: { type: 'number' },
                    estimatedWords: { type: 'number' }
                  },
                  required: ['sectionName', 'instruction']
                }
              }
            },
            required: ['name', 'path', 'purpose', 'seo', 'outline']
          }
        }
      },
      required: ['structuredData', 'designSystem', 'globalElements', 'pages']
    },
    blockLibrary: {
      type: 'object',
      properties: {
        core_blocks: { 
          type: 'array', 
          items: { type: 'string' },
          description: '可用的核心古腾堡区块'
        },
        custom_blocks: { 
          type: 'array', 
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              props: { type: 'object' }
            },
            required: ['name', 'description', 'props']
          },
          description: '可用的自定义区块'
        }
      },
      required: ['core_blocks', 'custom_blocks']
    }
  },
  required: ['blueprintV2', 'blockLibrary'],
  additionalProperties: false
};

// 响应Schema
const step5ResponseSchema = responseSchema(websiteBlueprintV3Schema);

// 完整的路由Schema
const step5Schema: FastifySchema = {
  body: step5RequestSchema,
  response: step5ResponseSchema
};

/**
 * 步骤5路由注册
 */
export default async function step5Routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/5-design-layout', { 
    schema: step5Schema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    try {
      const { blueprintV2, blockLibrary } = request.body as {
        blueprintV2: any;
        blockLibrary: {
          core_blocks: string[];
          custom_blocks: Array<{ name: string; description: string; props: any }>;
        };
      };
      
      // TODO: 核心业务逻辑
      // 1. 遍历蓝图中每个页面的outline数组
      // 2. 对每个section的instruction，构建AI Prompt
      // 3. 指示AI扮演古腾堡技术架构师
      // 4. Prompt中必须包含可用区块库的定义
      // 5. 要求AI将instruction翻译成符合Block Schema的JSON结构
      // 6. AI的输出会包含需要生成文案的{ "prompt": "..." }标记
      // 7. 将每个页面的outline更新为AI返回的结构化Block数组
      // 8. 形成WebsiteBlueprint_V3并返回
      
      // 临时返回示例数据（实际应该调用AI服务）
      const enhancedPages = blueprintV2.pages.map((page: any) => {
        const enhancedOutline = page.outline.map((section: any) => {
          // 根据section的instruction生成相应的区块结构
          let blockStructure;
          
          switch (section.sectionName) {
            case '英雄区域':
              blockStructure = {
                component: 'core/cover',
                level: 0,
                config: {
                  align: 'full',
                  overlayColor: 'primary',
                  minHeight: 600
                },
                props: {
                  backgroundType: 'image',
                  hasParallax: true
                },
                content: {
                  prompt: `为${blueprintV2.structuredData.companyInfo.name}的${section.sectionName}创建吸引人的标题和描述，突出${blueprintV2.structuredData.companyInfo.industry}领域的专业性和核心价值`
                },
                children: [
                  {
                    component: 'core/heading',
                    level: 1,
                    config: {
                      level: 1,
                      textAlign: 'center',
                      fontSize: 'large'
                    },
                    props: {
                      content: '公司主标题',
                      className: 'hero-title'
                    },
                    content: {
                      prompt: `创建${blueprintV2.structuredData.companyInfo.name}的主标题，体现${blueprintV2.structuredData.companyInfo.industry}专业服务`
                    }
                  },
                  {
                    component: 'core/paragraph',
                    level: 1,
                    config: {
                      textAlign: 'center',
                      fontSize: 'medium'
                    },
                    props: {
                      className: 'hero-description'
                    },
                    content: {
                      prompt: `为${blueprintV2.structuredData.companyInfo.name}创建简洁有力的描述，说明在${blueprintV2.structuredData.companyInfo.industry}领域的专业优势`
                    }
                  },
                  {
                    component: 'core/buttons',
                    level: 1,
                    config: {
                      layout: { type: 'flex', justifyContent: 'center' }
                    },
                    props: {
                      className: 'hero-cta'
                    },
                    children: [
                      {
                        component: 'core/button',
                        level: 2,
                        config: {
                          backgroundColor: 'accent',
                          textColor: 'white',
                          borderRadius: 'medium'
                        },
                        props: {
                          text: '获取报价',
                          url: '/quote',
                          className: 'cta-button'
                        }
                      }
                    ]
                  }
                ]
              };
              break;
              
            case '产品展示':
              blockStructure = {
                component: 'core/group',
                level: 0,
                config: {
                  layout: { type: 'constrained' },
                  spacing: { padding: { top: 'large', bottom: 'large' } }
                },
                props: {
                  className: 'products-section'
                },
                content: {
                  prompt: `为${blueprintV2.structuredData.companyInfo.name}的产品展示区域创建介绍性文案`
                },
                children: [
                  {
                    component: 'core/heading',
                    level: 1,
                    config: {
                      level: 2,
                      textAlign: 'center'
                    },
                    props: {
                      content: '我们的产品',
                      className: 'section-title'
                    }
                  },
                  {
                    component: 'core/columns',
                    level: 1,
                    config: {
                      columns: 3
                    },
                    props: {
                      className: 'products-grid'
                    },
                    children: blueprintV2.structuredData.products.slice(0, 3).map((product: any) => ({
                      component: 'core/column',
                      level: 2,
                      config: {
                        width: '33.33%'
                      },
                      props: {
                        className: 'product-card'
                      },
                      children: [
                        {
                          component: 'core/image',
                          level: 3,
                          config: {
                            sizeSlug: 'medium'
                          },
                          props: {
                            alt: product.name,
                            className: 'product-image'
                          },
                          content: {
                            source: `/images/products/${product.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
                          }
                        },
                        {
                          component: 'core/heading',
                          level: 3,
                          config: {
                            level: 3
                          },
                          props: {
                            content: product.name,
                            className: 'product-name'
                          }
                        },
                        {
                          component: 'core/paragraph',
                          level: 3,
                          config: {
                            fontSize: 'small'
                          },
                          props: {
                            className: 'product-description'
                          },
                          content: {
                            prompt: `为${product.name}创建简短的产品描述，突出其在${blueprintV2.structuredData.companyInfo.industry}领域的优势`
                          }
                        }
                      ]
                    }))
                  }
                ]
              };
              break;
              
            case '公司优势':
              blockStructure = {
                component: 'core/group',
                level: 0,
                config: {
                  backgroundColor: 'background_medium',
                  layout: { type: 'constrained' },
                  spacing: { padding: { top: 'large', bottom: 'large' } }
                },
                props: {
                  className: 'advantages-section'
                },
                content: {
                  prompt: `为${blueprintV2.structuredData.companyInfo.name}创建公司优势介绍文案`
                },
                children: [
                  {
                    component: 'core/heading',
                    level: 1,
                    config: {
                      level: 2,
                      textAlign: 'center'
                    },
                    props: {
                      content: '为什么选择我们',
                      className: 'section-title'
                    }
                  },
                  {
                    component: 'core/columns',
                    level: 1,
                    config: {
                      columns: 3
                    },
                    props: {
                      className: 'advantages-grid'
                    },
                    children: [
                      {
                        component: 'core/column',
                        level: 2,
                        config: { width: '33.33%' },
                        props: { className: 'advantage-item' },
                        children: [
                          {
                            component: 'core/heading',
                            level: 3,
                            config: { level: 3 },
                            props: { content: '技术领先', className: 'advantage-title' }
                          },
                          {
                            component: 'core/paragraph',
                            level: 3,
                            props: { className: 'advantage-description' },
                            content: {
                              prompt: `描述${blueprintV2.structuredData.companyInfo.name}在${blueprintV2.structuredData.companyInfo.industry}领域的技术优势`
                            }
                          }
                        ]
                      },
                      {
                        component: 'core/column',
                        level: 2,
                        config: { width: '33.33%' },
                        props: { className: 'advantage-item' },
                        children: [
                          {
                            component: 'core/heading',
                            level: 3,
                            config: { level: 3 },
                            props: { content: '服务专业', className: 'advantage-title' }
                          },
                          {
                            component: 'core/paragraph',
                            level: 3,
                            props: { className: 'advantage-description' },
                            content: {
                              prompt: `描述${blueprintV2.structuredData.companyInfo.name}的专业服务能力和客户服务理念`
                            }
                          }
                        ]
                      },
                      {
                        component: 'core/column',
                        level: 2,
                        config: { width: '33.33%' },
                        props: { className: 'advantage-item' },
                        children: [
                          {
                            component: 'core/heading',
                            level: 3,
                            config: { level: 3 },
                            props: { content: '经验丰富', className: 'advantage-title' }
                          },
                          {
                            component: 'core/paragraph',
                            level: 3,
                            props: { className: 'advantage-description' },
                            content: {
                              prompt: `描述${blueprintV2.structuredData.companyInfo.name}在${blueprintV2.structuredData.companyInfo.industry}领域的丰富经验和成功案例`
                            }
                          }
                        ]
                      }
                    ]
                  }
                ]
              };
              break;
              
            default:
              // 默认区块结构
              blockStructure = {
                component: 'core/group',
                level: 0,
                config: {
                  layout: { type: 'constrained' },
                  spacing: { padding: { top: 'medium', bottom: 'medium' } }
                },
                props: {
                  className: `${section.sectionName.toLowerCase().replace(/\s+/g, '-')}-section`
                },
                content: {
                  prompt: `为${blueprintV2.structuredData.companyInfo.name}的${section.sectionName}创建专业的内容文案`
                },
                children: [
                  {
                    component: 'core/heading',
                    level: 1,
                    config: { level: 2 },
                    props: {
                      content: section.sectionName,
                      className: 'section-title'
                    }
                  },
                  {
                    component: 'core/paragraph',
                    level: 1,
                    config: { fontSize: 'medium' },
                    props: {
                      className: 'section-content'
                    },
                    content: {
                      prompt: section.instruction
                    }
                  }
                ]
              };
          }
          
          return blockStructure;
        });
        
        return {
          ...page,
          outline: enhancedOutline
        };
      });

      const blueprintV3 = {
        structuredData: blueprintV2.structuredData,
        designSystem: blueprintV2.designSystem,
        globalElements: blueprintV2.globalElements,
        pages: enhancedPages
      };

      return reply.send({
        success: true,
        data: blueprintV3,
        message: '区块布局设计成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('步骤5执行失败');
      console.error('步骤5执行失败:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '区块布局设计失败，请稍后重试',
        timestamp: new Date().toISOString()
      });
    }
  });
}
