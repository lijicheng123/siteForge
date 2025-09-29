import { MODEL_IDS } from "../model-catalog";
import LLMGateway from "../llm-gateway";
import siteBuilderPromptFactory from "./page-builder-prompt-factory";
import { PageBuilderResponseSchema } from "../../schemas/site-builder/schema";

export async function executePageBuilder(params: any) {
    const { blocks, ...userData } = params;
    const prompt = siteBuilderPromptFactory.getPageBuilderPrompt(userData, blocks);
    const response = await LLMGateway.callText({
        model: MODEL_IDS.GEMINI_2_5_PRO,
        prompt,
        temperature: 0.7,
        jsonMode: true,
        jsonSchema: PageBuilderResponseSchema
    });
    return JSON.parse(response);
}