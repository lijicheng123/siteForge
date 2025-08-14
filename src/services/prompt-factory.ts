// src/services/prompt-factory.ts
// 这是一个完整的模块，包含了所有步骤的 Prompt 生成逻辑

import {
  structuredDataSchema,
  designSystemSchema,
  websiteArchitectureSchema,
  contentCompletePageSchema,
  contentCompleteBlueprintSchema,
  blockSchema,
} from '../schemas';

// 从集中 Schema 源生成可嵌入到 Prompt 的 JSON Schema 文本
const getSchemaString = (schema: unknown): string => {
  try {
    return JSON.stringify(schema, null, 2);
  } catch {
    return '';
  }
};

// 通用的JSON格式要求，根据Schema类型自动判断
const getJsonFormatRequirement = (schema: unknown, _useJsonMode: boolean = false): string => {
  // 无论是否启用 JSON 模式，都强制严格的纯 JSON 输出要求
  let outputType = '数据';
  let startChar = '{';

  if (typeof schema === 'object' && schema !== null) {
    const schemaObj = schema as any;
    if (schemaObj.type === 'array') {
      outputType = '列表';
      startChar = '[';
    } else if (schemaObj.type === 'object') {
      outputType = '数据对象';
      startChar = '{';
    }
  }

  return `
⚠️ 重要：输出格式要求 ⚠️
1. 必须返回纯JSON${outputType}，不要包含任何其他文字、解释或markdown标记
2. 不要使用 \`\`\`json 或 \`\`\` 代码块包装
3. 不要添加任何前缀或后缀说明
4. 直接返回符合Schema的JSON${outputType}
5. 确保JSON格式完全正确，可以被JSON.parse()直接解析
6. 如果无法生成完整数据，请返回包含error字段的JSON对象
7. 不要输出“好的/Alright/Okay”等确认词，直接输出JSON

💡 续写技巧：请从以下字符开始你的回答：
${startChar}`;
};

export default {
  getStep1AnalyzerPrompt: (rawInput: string, useJsonMode: boolean = false): string => `
角色: 你是一位专业的商业分析师和市场策略顾问。
背景: 我们正在启动一个 AI 驱动的网站生成项目。你的任务是将用户提供的非结构化公司介绍，转化为一份精确、完整、结构化的 JSON 数据档案。
目标: 通读并理解下方提供的 [用户输入文本]，并严格按照下方提供的 TypeScript 类型定义，将所有提炼出的信息组织成一个完整的 JSON 对象。
约束与规则: 所有输出字段必须存在，不得遗漏。所有描述性文本都应使用专业、精炼的 B2B 商业语境。slug 字段需全小写，用连字符 '-' 替换空格。

${getJsonFormatRequirement(structuredDataSchema, useJsonMode)}

输出必须严格符合以下 JSON Schema:
${getSchemaString(structuredDataSchema)}

[用户输入文本]:
${rawInput}`,

  getStep2DesignerPrompt: (context: { industry: string; preference: string }, useJsonMode: boolean = false): string => `
角色: 你是一名经验丰富的品牌视觉设计师和用户体验 (UX) 专家。
背景: 我们正在为一个工业 LED 照明制造商设计网站。根据初步分析，该公司的行业是 "${context.industry}"，其目标客户偏好 "${context.preference}"。
目标: 创建一套专业、和谐且实用的全局视觉设计系统 (designSystem.json)，统一网站所有页面的颜色和字体。

${getJsonFormatRequirement(designSystemSchema, useJsonMode)}

输出必须严格符合以下 JSON Schema:
${getSchemaString(designSystemSchema)}`,

  getStep3ArchitectPrompt: (context: { companyName: string; products: { name: string }[] }, useJsonMode: boolean = false): string => `
角色: 你是一名资深的网站信息架构师 (IA) 和用户体验策略师。
背景: 基于已有的公司和产品数据，我们需要为这个外贸 B2B 网站规划一个清晰、直观、符合行业惯例的网站地图和全局导航元素。
目标: 设计一个能够有效引导访客、展示核心信息并促进商业咨询的网站结构。

${getJsonFormatRequirement(websiteArchitectureSchema, useJsonMode)}

输出必须严格符合以下 JSON Schema:
${getSchemaString(websiteArchitectureSchema)}`,

  getStep4PlannerPrompt: (blueprint: any, useJsonMode: boolean = false): string => `
角色: 你是一位集 B2B 内容营销、搜索引擎优化 (SEO) 和用户旅程规划于一身的顶级内容策略专家。

背景: 现在我们有了基础网站蓝图，它包含了业务数据、设计系统和页面结构。下一步是为蓝图中的每个页面注入生命力——规划其具体内容和 SEO 策略。

目标: 遍历输入数据中 pages 数组的每一个页面对象，并为其精心策划 SEO 信息 (title, description, keywords) 和 outline 内容大纲。

详细任务: 
1. 遍历每个页面，分析其 purpose（目的）
2. 为每个页面规划 SEO 信息：
   - title: 页面标题（10-70字符）
   - description: 页面描述（50-160字符）
   - primaryKeywords: 主要关键词数组
   - longTailKeywords: 长尾关键词数组
3. 规划内容大纲 (outline)，将页面内容分解为若干个有逻辑顺序的内容区块 (Section)
4. 为每个区块撰写清晰的 instruction 指令

${getJsonFormatRequirement(contentCompleteBlueprintSchema, useJsonMode)}

输出必须严格符合以下 JSON Schema (整个蓝图结构):
${getSchemaString(contentCompleteBlueprintSchema)}

注意：输入是基础蓝图，输出是内容完备蓝图。每个页面的 outline 应该包含 outlineSectionSchema 结构，不是 blockSchema。

[输入基础蓝图]:
${JSON.stringify(blueprint, null, 2)}`,

  getStep5LayoutPrompt: (pageOutline: any, blockLibrary: any, useJsonMode: boolean = false): string => `
角色: 你是一名顶级的 WordPress 古腾堡技术架构师和前端设计师。
背景: 你收到了一份来自 "内容策略师" 的页面大纲 (outline)。你还有一个严格定义的 "可用区块库"。
目标: 将自然语言的 "意图"，精确地 "翻译" 成一个严格结构化的 JSON 布局指令。将每一个 instruction 都转换成一个或多个嵌套的 Block 对象。
约束: 只能从下方提供的 "可用区块库" 中选择区块，绝不能发明。必须严格遵循自定义区块 "说明书 (Manifest)" 中定义的 props 结构。所有需要 AI 生成文案的地方，必须以 {"prompt": "..."} 的形式标记。

${getJsonFormatRequirement(blockSchema, useJsonMode)}

输出必须严格符合以下 JSON Schema (Block 对象结构):
${getSchemaString(blockSchema)}

[可用区块库]:
${JSON.stringify(blockLibrary, null, 2)}

[页面大纲]:
${JSON.stringify(pageOutline, null, 2)}`,

  getStep5_5CopywriterPrompt: (
    companyContext: any,
    taskList: Record<string, string>,
    useJsonMode: boolean = false
  ): string => `
角色: 你是一名顶级的 B2B 外贸网站文案专家。
背景: 整个网站的结构和布局已经设计完成。
目标: 为 "文案生成任务列表" 中的每一个任务 ID，生成一段高质量的、符合其语境和要求的文案。
约束与规则: 语调应专业、自信、直接。严格按照要求的 { "任务ID": "生成的文案" } JSON 格式返回结果，不要添加任何额外的解释或对话。

${getJsonFormatRequirement(taskList, useJsonMode)}

公司上下文:
${JSON.stringify(companyContext, null, 2)}

文案生成任务列表:
${JSON.stringify(taskList, null, 2)}`,
};
