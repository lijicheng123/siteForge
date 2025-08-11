// src/types/index.ts

// Business core types aligned with prompt-factory definitions

// Company and product data
export interface CompanyInfo { name: string; description: string; industry: string; }
export interface Product { name: string; slug: string; category: string; short_description: string; keywords: string[]; }
export interface SellingPoints { primary: string; secondary: string; tertiary: string; }
export interface TargetAudience { region: string; industry: string; concerns: string[]; preference: string; }
export interface Assets { images: Record<string, string>; }
export interface SEO { mainKeywords: string[]; longTailKeywords: string[]; }

export interface StructuredData {
  companyInfo: CompanyInfo;
  products: Product[];
  sellingPoints: SellingPoints;
  targetAudience: TargetAudience;
  assets: Assets;
  seo: SEO;
}

// Design system
export interface Palette {
  primary: string; secondary: string; accent: string;
  text_on_dark: string; text_on_light: string;
  background_light: string; background_medium: string; background_dark: string;
}
export interface Typography { font_family_heading: string; font_family_body: string; }
export interface DesignSystem { palette: Palette; typography: Typography; }

// Website architecture
export interface MenuItem { name: string; path: string; }
export interface Header { menuItems: MenuItem[]; }
export interface Footer { sections: string[]; }
export interface GlobalElements { header: Header; footer: Footer; }
export interface Page { name: string; path: string; purpose: string; }
export interface WebsiteArchitecture { globalElements: GlobalElements; pages: Page[]; }

// Page outline (strategy)
export interface SEOInfo { title: string; description: string; primaryKeyword: string; secondaryKeywords: string[]; }
export interface OutlineSection { sectionName: string; instruction: string; }
export interface UpdatedPage { name: string; path: string; purpose: string; seo: SEOInfo; outline: OutlineSection[] | any; }

// Block layout (render model)
export type ContentSource = { source: string } | { text: string } | { prompt: string };
export interface Block { component: string; level?: number; config?: Record<string, unknown>; props?: Record<string, unknown>; children?: Block[]; content?: ContentSource; }

// Final blueprint passed across steps
export interface FinalBlueprint {
  structuredData: StructuredData;
  designSystem: DesignSystem;
  globalElements: GlobalElements;
  pages: UpdatedPage[];
}
