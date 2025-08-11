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

// 间距Schema
export const spacingSchema = objectSchema({
  xs: { type: 'string', enum: ['4px', '8px'], default: '4px' },
  sm: { type: 'string', enum: ['8px', '16px'], default: '8px' },
  md: { type: 'string', enum: ['16px', '24px'], default: '16px' },
  lg: { type: 'string', enum: ['24px', '32px'], default: '24px' },
  xl: { type: 'string', enum: ['32px', '48px'], default: '32px' },
  xxl: { type: 'string', enum: ['48px', '64px'], default: '48px' }
}, ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']);

// 圆角Schema
export const borderRadiusSchema = objectSchema({
  none: { type: 'string', enum: ['0px'], default: '0px' },
  sm: { type: 'string', enum: ['4px', '6px'], default: '4px' },
  md: { type: 'string', enum: ['8px', '12px'], default: '8px' },
  lg: { type: 'string', enum: ['16px', '20px'], default: '16px' },
  full: { type: 'string', enum: ['9999px'], default: '9999px' }
}, ['none', 'sm', 'md', 'lg', 'full']);

// 阴影Schema
export const shadowSchema = objectSchema({
  none: { type: 'string', enum: ['none'], default: 'none' },
  sm: { type: 'string', pattern: '^0 1px 2px 0 rgba\\(0, 0, 0, 0\\.05\\)$' },
  md: { type: 'string', pattern: '^0 4px 6px -1px rgba\\(0, 0, 0, 0\\.1\\)$' },
  lg: { type: 'string', pattern: '^0 10px 15px -3px rgba\\(0, 0, 0, 0\\.1\\)$' },
  xl: { type: 'string', pattern: '^0 20px 25px -5px rgba\\(0, 0, 0, 0\\.1\\)$' }
}, ['none', 'sm', 'md', 'lg', 'xl']);

// 设计系统主Schema
export const designSystemSchema = objectSchema({
  palette: paletteSchema,
  typography: typographySchema,
  spacing: spacingSchema,
  borderRadius: borderRadiusSchema,
  shadow: shadowSchema
}, ['palette', 'typography']);
