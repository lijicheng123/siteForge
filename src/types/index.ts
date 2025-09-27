// src/types/index.ts
// 从schemas导出所有类型定义，实现单一数据源

// 基础类型
export * from '../schemas/base';

// 业务实体类型
export * from '../schemas/company';
export * from '../schemas/design';
export * from '../schemas/website';
export * from '../schemas/blocks';
export * from '../schemas/seo';

// 常用组合类型 - 已移除总入口导出，请直接从具体文件导入
// export * from '../schemas';

// 类型别名 - 为了保持与原有代码的兼容性，提供更友好的类型名称
import type {
  companyInfoSchema,
  productSchema,
  sellingPointsSchema,
  targetAudienceSchema,
  assetsSchema
} from '../schemas/company';
import type {
  websiteSeoSchema,
  seoMetaSchema,
  seoDetailedSchema
} from '../schemas/seo';
import type {
  structuredDataSchema,
  designSystemSchema,
  websiteArchitectureSchema,
  baseBlueprintSchema,
  contentCompleteBlueprintSchema,
  layoutCompleteBlueprintSchema
} from '../schemas/index';
import type {
  paletteSchema,
  typographySchema
} from '../schemas/design';
import type {
  menuItemSchema,
  footerSectionSchema,
  globalElementsSchema
} from '../schemas/website';
import type {
  outlineSectionSchema,
  blockSchema,
  basicPageSchema,
  contentCompletePageSchema,
  layoutCompletePageSchema
} from '../schemas/blocks';

// 从Schema推导出TypeScript类型
export type CompanyInfo = typeof companyInfoSchema;
export type Product = typeof productSchema;
export type SellingPoints = typeof sellingPointsSchema;
export type TargetAudience = typeof targetAudienceSchema;
export type Assets = typeof assetsSchema;
export type SEO = typeof websiteSeoSchema;
export type StructuredData = typeof structuredDataSchema;

export type Palette = typeof paletteSchema;
export type Typography = typeof typographySchema;

export type DesignSystem = typeof designSystemSchema;

export type MenuItem = typeof menuItemSchema;
export type FooterSection = typeof footerSectionSchema;
export type GlobalElements = typeof globalElementsSchema;
export type WebsiteArchitecture = typeof websiteArchitectureSchema;

export type OutlineSection = typeof outlineSectionSchema;
export type Block = typeof blockSchema;

// 页面类型 - 渐进式定义
export type BasicPage = typeof basicPageSchema;
export type ContentCompletePage = typeof contentCompletePageSchema;
export type LayoutCompletePage = typeof layoutCompletePageSchema;



export type SEOMeta = typeof seoMetaSchema;
export type SEODetailed = typeof seoDetailedSchema;

// 蓝图类型 - 渐进式定义
export interface BaseBlueprint {
  structuredData: {
    companyInfo: {
      name: string;
      description: string;
      industry: string;
    };
    products: Array<{
      name: string;
      slug: string;
      category: string;
      short_description: string;
      keywords: string[];
    }>;
    sellingPoints: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    targetAudience: {
      region: string;
      industry: string;
      concerns: string[];
      preference: string;
    };
    assets: {
      images: Record<string, string>;
    };
    seo: {
      primaryKeywords: string[];
      longTailKeywords: string[];
    };
  };
  designSystem: {
    palette: {
      primary: string;
      secondary: string;
      accent: string;
      text_on_dark: string;
      text_on_light: string;
      background_light: string;
      background_medium: string;
      background_dark: string;
    };
    typography: {
      font_family_heading: string;
      font_family_body: string;
      font_size_base?: string;
      line_height_base?: number;
    };

  };
  globalElements: {
    header: {
      logo?: string;
      menuItems: Array<{
        name: string;
        path: string;
        icon?: string;
        children?: Array<{ name: string; path: string }>;
      }>;
      ctaButton?: {
        text: string;
        url: string;
        style: 'primary' | 'secondary' | 'outline';
      };
    };
    footer: {
      sections: Array<{
        title: string;
        links: Array<{ name: string; url: string }>;
      }>;
      copyright: string;
    };
  };
  pages: Array<{
    name: string;
    path: string;
    purpose: string;
  }>;
}

export interface ContentCompleteBlueprint extends Omit<BaseBlueprint, 'pages'> {
  pages: Array<{
    name: string;
    path: string;
    purpose: string;
    seo: {
      title: string;
      description: string;
      primaryKeywords: string[];
      longTailKeywords: string[];
    };
    outline: Array<{
      sectionName: string;
      instruction: string;
      priority?: number;
      estimatedWords?: number;
    }>;
  }>;
}

export interface LayoutCompleteBlueprint extends Omit<BaseBlueprint, 'pages'> {
  pages: Array<{
    name: string;
    path: string;
    purpose: string;
    seo: {
      title: string;
      description: string;
      primaryKeywords: string[];
      longTailKeywords: string[];
    };
    outline: Array<{
      component: string;
      level?: number;
      config?: Record<string, unknown>;
      props?: Record<string, unknown>;
      children?: any[];
      content?: { source?: string; alt?: string; text?: string; prompt?: string };
      link?: { source: string; target?: string; rel?: string };
      style?: { className?: string; customCSS?: string };
    }>;
  }>;
}

export interface ContentAndLayoutCompleteBlueprint extends Omit<BaseBlueprint, 'pages'> {
  pages: Array<{
    name: string;
    path: string;
    purpose: string;
    seo: {
      title: string;
      description: string;
      primaryKeywords: string[];
      longTailKeywords: string[];
    };
    outline: Array<{
      component: string;
      level?: number;
      config?: Record<string, unknown>;
      props?: Record<string, unknown>;
      children?: any[];
      content?: { source?: string; alt?: string; text?: string };
      link?: { source: string; target?: string; rel?: string };
      style?: { className?: string; customCSS?: string };
    }>;
  }>;
}


