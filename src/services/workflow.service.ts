// src/services/workflow.service.ts
import promptFactory from './prompt-factory';
import llmProvider from './llm-provider';
import { FinalBlueprint } from '../types';

// Simplified deterministic code generator (Step 6)
const generateGutenbergHTML = (blueprintOutline: any[]): string => {
    let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>SiteForge AI Preview</title><style>body{font-family: sans-serif; margin: 2em;} .section{border: 1px solid #ccc; padding: 1em; margin-bottom: 1em; border-radius: 5px;} h2{border-bottom: 2px solid #eee; padding-bottom: .5em;}</style></head><body><h1>AI Generated Website Preview</h1>`;
    blueprintOutline.forEach(section => {
        html += `<div class="section"><h2>Section: ${section.sectionName || 'Untitled'} (Component: ${section.component})</h2><pre><code>${JSON.stringify(section.children || section.content || 'No Content', null, 2)}</code></pre></div>`;
    });
    html += `</body></html>`;
    return html;
};

// Helper to traverse blueprint and collect prompts
const collectPrompts = (obj: any, path = 'task', acc: Record<string, string> = {}): Record<string, string> => {
    if (!obj || typeof obj !== 'object') return acc;
    if (obj.prompt) {
        const taskId = `task_${Object.keys(acc).length + 1}`;
        acc[taskId] = obj.prompt;
        obj.source = `generated.${taskId}`; // Replace prompt with a reference
        delete obj.prompt;
    }
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            collectPrompts(obj[key], `${path}_${key}`, acc);
        }
    }
    return acc;
};

// Helper to inject generated content back into the blueprint
const injectContent = (obj: any, generatedContent: Record<string, string>): void => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.source && typeof obj.source === 'string' && obj.source.startsWith('generated.')) {
        const taskId = obj.source.split('.')[1];
        if (generatedContent[taskId]) {
            obj.text = generatedContent[taskId];
            delete obj.source;
        }
    }
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            injectContent(obj[key], generatedContent);
        }
    }
};

export default {
    async runStep1_Analyze(rawInput: string): Promise<any> {
        const prompt = promptFactory.getStep1AnalyzerPrompt(rawInput);
        const responseJsonString = await llmProvider.invoke({
            model: 'claude-sonnet-4-20250514',
            prompt, temperature: 0.2
        });
        return JSON.parse(llmProvider.cleanAiJsonResponse(responseJsonString));
    },
    
    async runFullWorkflow(rawInput: string): Promise<string> {
        console.log("Workflow Started: Step 1 - Analyzing...");
        const structuredData = await this.runStep1_Analyze(rawInput);
        
        console.log("Workflow Step 2: Designing System...");
        const designPrompt = promptFactory.getStep2DesignerPrompt({ industry: structuredData.companyInfo.industry, preference: structuredData.targetAudience.preference });
        const designSysString = await llmProvider.invoke({ model: 'claude-sonnet-4-20250514', prompt: designPrompt, temperature: 0.6 });
        const designSystem = JSON.parse(llmProvider.cleanAiJsonResponse(designSysString));

        console.log("Workflow Step 3: Architecting Website...");
        const archPrompt = promptFactory.getStep3ArchitectPrompt({ companyName: structuredData.companyInfo.name, products: structuredData.products });
        const archString = await llmProvider.invoke({ model: 'gpt-5-mini', prompt: archPrompt, temperature: 0.3 });
        const architecture = JSON.parse(llmProvider.cleanAiJsonResponse(archString));
        
        const blueprintV1 = { structuredData, designSystem, ...architecture };
        
        console.log("Workflow Step 4: Planning Content...");
        const planPrompt = promptFactory.getStep4PlannerPrompt(blueprintV1);
        const planString = await llmProvider.invoke({ model: 'claude-opus-4-1-20250805', prompt: planPrompt, temperature: 0.7 });
        const updatedPages = JSON.parse(llmProvider.cleanAiJsonResponse(planString));
        
        const blueprintV2 = { ...blueprintV1, pages: updatedPages };
        
        console.log("Workflow Step 5: Designing Block Layouts...");
        const blockLibrary = { "core_blocks": ["core/cover", "core/group", "core/columns", "core/column", "core/heading", "core/paragraph", "core/buttons", "core/button"], "custom_blocks": [{ "name": "custom/icon-box", "description": "Icon, title, description.", "props": { "icon": "string", "title": "ContentSource", "description": "ContentSource" } }, { "name": "custom/product-card", "description": "Product card.", "props": { "product_source": "string" } }] };
        
        for (let i = 0; i < blueprintV2.pages.length; i++) {
            const layoutPrompt = promptFactory.getStep5LayoutPrompt(blueprintV2.pages[i].outline, blockLibrary);
            const layoutString = await llmProvider.invoke({ model: 'claude-opus-4-1-20250805', prompt: layoutPrompt, temperature: 0.1 });
            blueprintV2.pages[i].outline = JSON.parse(llmProvider.cleanAiJsonResponse(layoutString));
        }
        
        const blueprintV3 = { ...blueprintV2 };
        
        console.log("Workflow Step 5.5: Generating Copy...");
        const promptsToGenerate = collectPrompts(blueprintV3);
        if (Object.keys(promptsToGenerate).length > 0) {
            const copywriterPrompt = promptFactory.getStep5_5CopywriterPrompt({ companyInfo: blueprintV3.structuredData.companyInfo }, promptsToGenerate);
            const generatedContentString = await llmProvider.invoke({ model: 'gpt-5', prompt: copywriterPrompt, temperature: 0.75 });
            const generatedContent = JSON.parse(llmProvider.cleanAiJsonResponse(generatedContentString));
            injectContent(blueprintV3, generatedContent);
        }
        
        const finalBlueprint: FinalBlueprint = { ...blueprintV3 };

        console.log("Workflow Step 6: Generating Final HTML...");
        const finalHtml = generateGutenbergHTML(finalBlueprint.pages[0].outline);
        
        console.log("Workflow Finished.");
        return finalHtml;
    },
};
