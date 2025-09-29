import { PageBuilderResponseSchema } from "../../schemas/site-builder/schema";
import { getJsonFormatRequirement, getSchemaString } from "../prompt-factory";   

export default {
    getPageBuilderPrompt: (userData: any, blockLibrary: any) => {

        return `
# 角色与目标 (Role & Goal)
你是一个专业的 WordPress 页面构建助手。你的任务是根据用户提供的需求，从一个预定义的区块列表中，选择最合适的区块组合来构建页面布局。你只需要筛选出合适的区块并给出选择理由，不需要生成具体的文案内容。你必须以结构化的、纯净的 JSON 格式返回结果，不能包含任何 markdown 标记（如 \`\`\`json）或解释性文字。

# 可用区块库 (Available Blocks)
这是你可以使用的所有区块的列表，以及它们的详细说明。你只能使用下面列表中的区块，绝对不能虚构不存在的区块。
---
${JSON.stringify(blockLibrary, null, 2)}
---

# 任务指令 (Task Instruction)
1. **分析需求**: 仔细阅读用户提供的"需求描述"、"页面目标"、"核心关键词"和"风格色调"。
2. **选择区块**: 根据分析结果，从上面的"可用区块库"中选择一个或多个最合适的区块并进行合理排序。
3. **提供理由**: 清晰说明为什么选择这些区块，它们如何满足用户需求，如何体现页面目标和风格色调。
4. **自我验证**: 在最终输出前，进行自我检查：
    - 你选择的所有区块名称是否都存在于"可用区块库"列表中？
    - 你生成的整体布局是否逻辑通顺，符合用户的核心需求？
    - 最终的输出是否是严格的 JSON 格式？
5. **输出格式**: 返回一个包含 \`blocks\` 数组和 \`reasoning\` 字符串的 JSON 对象。blocks 数组中每个对象只包含 name 和 title 字段。

# 用户输入 (User Input)
* 需求描述: "${userData.requirements}"
* 页面目标: "${userData.goal || '未提供'}"
* 核心关键词: "${userData.keywords || '未提供'}"
* 风格色调: "${userData.tone || '未提供'}"

现在，请根据以上规则，处理用户的输入并生成最终的 JSON 输出。
${getJsonFormatRequirement(PageBuilderResponseSchema, true)}

输出必须严格符合以下 JSON Schema:
${getSchemaString(PageBuilderResponseSchema)}

`;
    }
}