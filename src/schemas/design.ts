/**
 * 设计系统Schema定义
 * 包含调色板、字体、布局等视觉设计相关配置
 */

import { objectSchema, colorSchema } from './base';

// 调色板Schema
export const paletteSchema = objectSchema({
  primary: colorSchema,
  secondary: colorSchema,
  accent: colorSchema,
  text_on_dark: colorSchema,
  text_on_light: colorSchema,
  background_light: colorSchema,
  background_medium: colorSchema,
  background_dark: colorSchema
}, ['primary', 'secondary', 'accent', 'text_on_dark', 'text_on_light', 'background_light', 'background_medium', 'background_dark']);

// 字体Schema
export const typographySchema = objectSchema({
  font_family_heading: { 
    type: 'string', 
    enum: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat'],
    description: '标题字体族'
  },
  font_family_body: { 
    type: 'string', 
    enum: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat'],
    description: '正文字体族'
  },
  font_size_base: { 
    type: 'string', 
    enum: ['14px', '16px', '18px'],
    default: '16px',
    description: '基础字体大小'
  },
  line_height_base: { 
    type: 'number', 
    minimum: 1.2,
    maximum: 2.0,
    default: 1.6,
    description: '基础行高'
  }
}, ['font_family_heading', 'font_family_body']);



