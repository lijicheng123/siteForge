import { MODEL_IDS } from "../model-catalog";
import LLMGateway from "../llm-gateway";
import patternConverterPromptFactory from "./pattern-converter-prompt-factory";

export async function executePatternConverter(params: { htmlCode: string; cssCode: string }) {
    const { htmlCode, cssCode } = params;
    
    // 构建转换Prompt
    const prompt = patternConverterPromptFactory.getPatternConverterPrompt(htmlCode, cssCode);
    
    // 调用LLM服务（不使用JSON模式，因为输出是纯文本标记）
    const response = await LLMGateway.callText({
        model: MODEL_IDS.GEMINI_2_5_PRO,
        prompt,
        temperature: 0.3, // 较低温度以确保输出格式的一致性
        jsonMode: false   // 输出是纯Gutenberg标记文本，不是JSON
    });
    
    return {
        gutenbergMarkup: response.trim()
    };
}

