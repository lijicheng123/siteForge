// src/types/index.ts

// 这是你提供的完整蓝图V4的类型定义，用于工作流内部传递
export interface FinalBlueprint {
  structuredData: any;
  designSystem: any;
  globalElements: any;
  pages: any[];
}

// API 数据传输对象 (DTOs)
export namespace DTOs {

  // POST /workflow/run-full
  export interface RunFullRequest {
    Body: {
      rawInput: string;
    };
  }
  export type RunFullResponse = string; // Direct HTML output

  // POST /workflow/step/analyze
  export interface AnalyzeRequest {
    Body: {
      rawInput: string;
    };
  }
  export interface AnalyzeResponse {
    structuredData: any;
  }
}
