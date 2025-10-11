// src/services/site-builder/pattern-selector-prompt-factory.ts
import { PatternSelectorResponseSchema } from "../../schemas/site-builder/pattern-selector";
import { getJsonFormatRequirement, getSchemaString } from "../prompt-factory";
import { PatternSelectorRequest } from "../../schemas/site-builder/pattern-selector";

export default {
    getPatternSelectorPrompt: ({ globalElements, pages }: PatternSelectorRequest, patternLibrary: any) => {
        // 获取第一个页面（通常是首页）
        const page = pages[0];
        
        // 格式化 SEO 关键词
        const primaryKeywords = page.seo.primaryKeywords.join('、');
        const longTailKeywords = page.seo.longTailKeywords.join('、');
        
        // 格式化页面 outline sections
        const outlineSections = page.outline.map((section, index) => 
            `${index + 1}. **${section.sectionName}**
   - 内容指令: ${section.instruction}
   - 预估字数: ${section.estimatedWords || '未指定'}字`
        ).join('\n\n');
        
        return `
# 角色与目标 (Role & Goal)
你是一个专业的 WordPress 页面设计顾问。你的任务是根据用户提供的页面需求和内容结构，从一个预定义的 WordPress Pattern 库中，选择最合适的 Pattern 组合来构建完整的页面布局。

你需要：
1. 仔细分析页面的每个 section 的内容需求
2. 为每个 section 选择最合适的 Pattern
3. 为每个选中的 Pattern 提供详细的选择理由（说明它适合哪些 sections）
4. 给出整体的选择总结

你必须以结构化的、纯净的 JSON 格式返回结果，不能包含任何 markdown 标记（如 \`\`\`json）或解释性文字。

# 可用 Pattern 库 (Available Patterns)
这是你可以使用的所有 WordPress Pattern 的列表，以及它们的详细说明。每个 Pattern 都包含 ID、名称、描述、分类、风格标签、行业标签、布局信息、关键词和预览图片。

**重要说明**：
- Pattern 以对象形式组织，key 为 "ptn-{id}" 格式，value 包含完整的 Pattern 信息
- 你只能使用下面列表中的 Pattern，绝对不能虚构不存在的 Pattern
- 每个 Pattern 都有 categories 字段，表示它适合的页面区域类型

---
${JSON.stringify(patternLibrary, null, 2)}
---

# 页面需求分析 (Page Requirements)

## 页面基本信息
- **页面名称**: ${page.name}
- **页面路径**: ${page.path}
- **页面目标**: ${page.purpose}

## SEO 信息
- **页面标题**: ${page.seo.title}
- **页面描述**: ${page.seo.description}
- **核心关键词**: ${primaryKeywords}
- **长尾关键词**: ${longTailKeywords}

## 页面内容结构 (Outline Sections)
以下是页面的完整内容结构，你需要为每个 section 选择合适的 Pattern：

${outlineSections}

# 全局元素信息 (Global Elements)
- **Header 菜单项数量**: ${globalElements.header.menuItems.length} 个
- **Header CTA 按钮**: ${globalElements.header.ctaButton ? globalElements.header.ctaButton.text : '无'}
- **Footer 区块数量**: ${globalElements.footer.sections.length} 个

# 任务指令 (Task Instructions)

## 1. 分析页面结构
仔细阅读上面的"页面内容结构"，理解每个 section 的：
- **sectionName**: section 的名称（如：页面横幅 Hero、主打产品概览等）
- **instruction**: section 的内容指令和设计要求
- **estimatedWords**: section 的预估内容量

## 2. 映射 Pattern 类型
根据 section 的名称和指令，判断它应该使用哪种类型的 Pattern：
- "Hero"、"横幅"、"Banner" → 应选择 categories 包含 "hero" 的 Pattern
- "产品"、"服务"、"功能" → 应选择 categories 包含 "features"、"services"、"products" 的 Pattern
- "客户案例"、"评价"、"见证" → 应选择 categories 包含 "testimonials"、"reviews" 的 Pattern
- "联系"、"CTA"、"行动号召" → 应选择 categories 包含 "cta"、"contact" 的 Pattern
- "关于"、"简介"、"介绍" → 应选择 categories 包含 "about"、"intro" 的 Pattern
- "FAQ"、"常见问题" → 应选择 categories 包含 "faq" 的 Pattern
- "定价"、"价格" → 应选择 categories 包含 "pricing" 的 Pattern

## 3. 选择最佳 Pattern
从"可用 Pattern 库"中选择最合适的 Pattern 组合：
- **匹配 categories**: Pattern 的分类要符合 section 的类型
- **匹配 keywords**: Pattern 的关键词要与页面的 SEO 关键词相关
- **匹配 style_tags**: 选择风格一致的 Pattern（如都是 modern、clean 风格）
- **匹配 industry_tags**: 优先选择与行业相关的 Pattern
- **考虑布局**: 根据 section 的内容量选择合适的布局（多栏、单栏、网格等）

## 4. 提供详细理由
为每个选中的 Pattern 提供清晰的 reasoning，必须包含：
- ✅ **适用的 sections**: 明确说明这个 Pattern 适合页面中的哪个或哪几个 section（用 section 名称）
- ✅ **匹配原因**: 说明为什么这个 Pattern 适合这些 sections（从 categories、layout、style 等角度）
- ✅ **内容支持**: 说明这个 Pattern 的结构如何支持 section 的内容需求
- ✅ **SEO/关键词匹配**: 如果相关，说明如何支持页面的 SEO 目标

示例理由：
"此 Pattern 适合【主打产品概览】section，因为它是 products 类型的 Pattern，采用 3 栏网格布局，可以很好地展示多个产品系列及其核心卖点，符合该 section '列出主要产品系列' 的需求。"

## 5. 覆盖完整页面
确保你选择的 Pattern 组合能够覆盖页面的所有主要 sections：
- 至少要有 1 个 hero Pattern（用于页面横幅）
- 根据 outline 中的 sections，选择相应类型的 Pattern
- 如果某个 section 类型在 Pattern 库中找不到完全匹配的，选择最接近的 Pattern
- 最后要有 1 个 cta 或 contact Pattern（用于行动号召）

## 6. 保持风格统一
- 选择的 Pattern 应该在视觉风格上保持一致
- 优先选择相同或相似的 style_tags（如都是 modern + clean）
- 考虑页面的目标受众（B2B 或 B2C）选择相应风格

## 7. 输出格式
返回一个包含 \`patterns\` 数组和 \`summary\` 字符串的 JSON 对象：
- **patterns**: 数组，每个元素包含：
  - \`id\` (number): Pattern 的 ID（从 Pattern 库的 id 字段获取）
  - \`reasoning\` (string): 详细的选择理由（必须说明适合哪些 sections）
- **summary**: 字符串，整体选择的总结，说明：
  - 这个 Pattern 组合如何覆盖页面的各个 sections
  - 整体的设计思路和用户体验考虑
  - 风格的统一性和连贯性

# 自我验证清单 (Validation Checklist)
在输出前，请检查：
- ✅ 所有 Pattern ID 都存在于 Pattern 库中（检查 ptn-{id} 格式）
- ✅ 页面的主要 sections 都有对应的 Pattern 覆盖
- ✅ 每个 Pattern 的 reasoning 都明确说明了它适合哪些 sections
- ✅ Pattern 组合在风格上保持一致
- ✅ 输出是严格的 JSON 格式，没有 markdown 标记

# 重要提示
- **只返回 Pattern ID**（数字类型），不要返回 Pattern 的 name 或其他字段
- **reasoning 必须具体**，要明确提到适用的 section 名称
- **确保完整覆盖**，页面的所有主要 sections 都要考虑到
- **注意顺序**，按照页面结构的合理顺序排列 Patterns（通常：hero → content sections → testimonials → cta）

现在，请根据以上规则，分析页面需求并生成最终的 JSON 输出。
${getJsonFormatRequirement(PatternSelectorResponseSchema, true)}

输出必须严格符合以下 JSON Schema:
${getSchemaString(PatternSelectorResponseSchema)}
`;
    }
};

