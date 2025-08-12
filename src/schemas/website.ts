/**
 * 网站架构Schema定义
 * 包含页面、导航、布局等网站结构相关配置
 */

import { objectSchema, arraySchema, nameSchema, descriptionSchema } from './base';

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

// 页面Schema
export const pageSchema = objectSchema({
  name: nameSchema,
  path: { type: 'string', pattern: '^/[a-z0-9/-]*$', minLength: 1, maxLength: 100 },
  purpose: { type: 'string', minLength: 10, maxLength: 200 },
  priority: { type: 'number', minimum: 1, maximum: 10, default: 5 },
  meta: objectSchema({
    title: { type: 'string', minLength: 10, maxLength: 70 },
    description: { type: 'string', minLength: 50, maxLength: 160 },
    keywords: arraySchema({ type: 'string', minLength: 1, maxLength: 50 })
  }, ['title', 'description'])
}, ['name', 'path', 'purpose']);

// 网站架构Schema
export const websiteArchitectureSchema = objectSchema({
  globalElements: globalElementsSchema,
  pages: arraySchema(pageSchema),
  sitemap: { type: 'string', format: 'uri' },
  robots: { type: 'string', format: 'uri' }
}, ['globalElements', 'pages']);

// 蓝图版本1 - 基础版本
export const websiteBlueprintV1Schema = objectSchema({
  structuredData: { type: 'object' },
  designSystem: { type: 'object' },
  globalElements: globalElementsSchema,
  pages: arraySchema(pageSchema)
}, ['structuredData', 'designSystem', 'globalElements', 'pages']);
