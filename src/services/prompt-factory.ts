// src/services/prompt-factory.ts
// 这是一个完整的模块，包含了所有步骤的 Prompt 生成逻辑

import { structuredDataSchema } from '../schemas/workflow-responses';
import { designSystemSchema } from '../schemas/workflow-responses';
import { websiteArchitectureSchema } from '../schemas/workflow-responses';
import { contentCompleteBlueprintSchema } from '../schemas/workflow-responses';
import { outlineBlockSchema } from '../schemas/blocks';

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
角色: 你是一名顶级的 WordPress Gutenberg 技术架构师，兼具高级前端设计师的审美和世界级文案专家的创意。
任务: 接收页面大纲 (Page Outline)，将其"编译"成结构完美、内容丰富、100% 符合 Gutenberg 验证规则的 JSON 对象数组。

📚 输入解析：
- **页面大纲**: instruction 字段是每个 Section 最重要的部分，是你选择区块、组织结构和创作文案的唯一依据
- **可用区块库**: 你的技术工具箱，只能使用这里定义的区块，严格遵守每个区块的 attributes 规范

⚙️ 工作流程：
对于 outline 数组中的每一个 Section：
1. 深度解读 instruction 字段中的每一个要求
2. 从 blockLibrary 中选择最合适的区块组合来搭建结构
3. 根据 instruction 和 estimatedWords 创作高质量文案并填充到区块 attributes 中
4. 根据视觉要求配置准确的区块属性，组装成符合 Schema 的 Block 对象

⚠️ 关键技术约束：
1. **按钮父子关系**: core/button 必须被 core/buttons (复数) 区块作为父容器包裹，绝不能单独存在
2. **对齐属性区分**: textAlign 控制文本对齐 (core/heading, core/paragraph)；align 控制区块容器宽度 (core/cover, core/columns)
3. **指令优先级**: 所有决策必须直接源于当前 Section 的 instruction
4. **严格选择**: 只能从可用区块库中选择，绝不能发明区块
5. **保留 sectionName**: 每个输出的 Block 对象必须保留原始的 sectionName 字段
6. **图片占位符**: 使用 https://placehold.co/宽度x高度 格式，尺寸符合设计意图

${getJsonFormatRequirement(outlineBlockSchema, useJsonMode)}

输出必须严格符合以下 JSON Schema:
${getSchemaString(outlineBlockSchema)}

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
