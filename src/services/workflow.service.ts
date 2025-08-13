// src/services/workflow.service.ts
import promptFactory from './prompt-factory';
import llmProvider from './llm-provider';
import { MODEL_IDS } from './model-catalog';
import { ContentAndLayoutCompleteBlueprint } from '../types';
import { generateFullGutenbergHtml } from './html-generator';

// Removed local HTML preview generator in favor of shared generator

// Import blueprint utilities once extracted
import { collectPrompts, injectContent } from './blueprint-utils';

export default {
    async runStep1_Analyze(rawInput: string): Promise<any> {
        const prompt = promptFactory.getStep1AnalyzerPrompt(rawInput);
        const responseJsonString = await llmProvider.invoke({
            model: MODEL_IDS.CLAUDE_SONNET_4_20250514,
            prompt, temperature: 0.2
        });
        return JSON.parse(llmProvider.cleanAiJsonResponse(responseJsonString));
    },
    
    async runFullWorkflow(rawInput: string): Promise<string> {
        console.log("Workflow Started: Step 1 - Analyzing...");
        const structuredData = await this.runStep1_Analyze(rawInput);
        
        console.log("Workflow Step 2: Designing System...");
        const designPrompt = promptFactory.getStep2DesignerPrompt({ industry: structuredData.companyInfo.industry, preference: structuredData.targetAudience.preference });
        const designSysString = await llmProvider.invoke({ model: MODEL_IDS.CLAUDE_SONNET_4_20250514, prompt: designPrompt, temperature: 0.6 });
        const designSystem = JSON.parse(llmProvider.cleanAiJsonResponse(designSysString));

        console.log("Workflow Step 3: Architecting Website...");
        const archPrompt = promptFactory.getStep3ArchitectPrompt({ companyName: structuredData.companyInfo.name, products: structuredData.products });
        const archString = await llmProvider.invoke({ model: MODEL_IDS.GPT_5_MINI, prompt: archPrompt, temperature: 0.3 });
        const architecture = JSON.parse(llmProvider.cleanAiJsonResponse(archString));
        
        const blueprint = { structuredData, designSystem, ...architecture };
        
        console.log("Workflow Step 4: Planning Content...");
        const planPrompt = promptFactory.getStep4PlannerPrompt(blueprint);
        const planString = await llmProvider.invoke({ model: MODEL_IDS.CLAUDE_OPUS_4_1_20250805, prompt: planPrompt, temperature: 0.7 });
        const updatedPages = JSON.parse(llmProvider.cleanAiJsonResponse(planString));
        
        blueprint.pages = updatedPages;
        
        console.log("Workflow Step 5: Designing Block Layouts...");
        const blockLibrary = { "core_blocks": ["core/cover", "core/group", "core/columns", "core/column", "core/heading", "core/paragraph", "core/buttons", "core/button"], "custom_blocks": [{ "name": "custom/icon-box", "description": "Icon, title, description.", "props": { "icon": "string", "title": "ContentSource", "description": "ContentSource" } }, { "name": "custom/product-card", "description": "Product card.", "props": { "product_source": "string" } }] };
        
        for (let i = 0; i < blueprint.pages.length; i++) {
            const layoutPrompt = promptFactory.getStep5LayoutPrompt(blueprint.pages[i].outline, blockLibrary);
            const layoutString = await llmProvider.invoke({ model: MODEL_IDS.CLAUDE_OPUS_4_1_20250805, prompt: layoutPrompt, temperature: 0.1 });
            blueprint.pages[i].outline = JSON.parse(llmProvider.cleanAiJsonResponse(layoutString));
        }
        
        console.log("Workflow Step 5.5: Generating Copy...");
        const promptsToGenerate = collectPrompts(blueprint);
        if (Object.keys(promptsToGenerate).length > 0) {
            const copywriterPrompt = promptFactory.getStep5_5CopywriterPrompt({ companyInfo: blueprint.structuredData.companyInfo }, promptsToGenerate);
            const generatedContentString = await llmProvider.invoke({ model: MODEL_IDS.GPT_5, prompt: copywriterPrompt, temperature: 0.75 });
            const generatedContent = JSON.parse(llmProvider.cleanAiJsonResponse(generatedContentString));
            injectContent(blueprint, generatedContent);
        }
        
        const contentAndLayoutCompleteBlueprint: ContentAndLayoutCompleteBlueprint = blueprint;

        console.log("Workflow Step 6: Generating Final HTML...");
        const finalHtml = generateFullGutenbergHtml({
            structuredData: contentAndLayoutCompleteBlueprint.structuredData,
            pages: contentAndLayoutCompleteBlueprint.pages.map(p => ({
                name: p.name,
                path: p.path,
                purpose: p.purpose,
                seo: p.seo,
                outline: Array.isArray(p.outline) ? p.outline : []
            }))
        });
        
        console.log("Workflow Finished.");
        return finalHtml;
    },
};
