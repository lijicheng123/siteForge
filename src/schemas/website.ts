/**
 * 网站架构Schema定义
 * 包含页面、导航、布局等网站结构相关配置
 */

import { objectSchema, arraySchema, nameSchema } from './base';

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

