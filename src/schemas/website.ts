/**
 * 网站架构Schema定义
 * 包含页面、导航、布局等网站结构相关配置
 */

import { objectSchema, arraySchema, nameSchema, pagePathSchema } from './base';
import { seoMetaSchema } from './seo';

// 菜单项Schema
export const menuItemSchema = objectSchema({
  name: nameSchema,
  path: { type: 'string', pattern: '^/[a-z0-9/-]*$', minLength: 1, maxLength: 100 },
  icon: { type: 'string', minLength: 1, maxLength: 50 },
  children: arraySchema(objectSchema({
    name: nameSchema,
    path: { type: 'string' }
  }, ['name', 'path']))
}, ['name', 'path']);

// 页脚部分Schema
export const footerSectionSchema = objectSchema({
  title: { type: 'string', minLength: 1, maxLength: 100 },
  links: arraySchema(objectSchema({
    name: { type: 'string', minLength: 1, maxLength: 100 },
    url: { type: 'string', format: 'uri' }
  }, ['name', 'url']))
}, ['title', 'links']);

// 全局元素Schema
export const globalElementsSchema = objectSchema({
  header: objectSchema({
    logo: { type: 'string', format: 'uri' },
    menuItems: arraySchema(menuItemSchema),
    ctaButton: objectSchema({
      text: { type: 'string', minLength: 1, maxLength: 50 },
      url: { type: 'string', format: 'uri' },
      style: { type: 'string', enum: ['primary', 'secondary', 'outline'] }
    }, ['text', 'url'])
  }, ['menuItems']),
  footer: objectSchema({
    sections: arraySchema(footerSectionSchema),
    copyright: { type: 'string', minLength: 1, maxLength: 200 }
  }, ['sections', 'copyright'])
}, ['header', 'footer']);

// 网站架构Schema
export const websiteArchitectureSchema = objectSchema({
  globalElements: globalElementsSchema,
  pages: arraySchema(objectSchema({
    name: nameSchema,
    path: pagePathSchema,
    purpose: { type: 'string', minLength: 10, maxLength: 200 },
    priority: { type: 'number', minimum: 1, maximum: 10, default: 5 },
    meta: seoMetaSchema
  }, ['name', 'path', 'purpose'])),
  sitemap: { type: 'string', format: 'uri' },
  robots: { type: 'string', format: 'uri' }
}, ['globalElements', 'pages']);
