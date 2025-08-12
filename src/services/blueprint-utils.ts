// Utilities to collect prompts and inject generated copy back into blueprint trees

export const collectPrompts = (obj: any, path = 'task', acc: Record<string, string> = {}): Record<string, string> => {
  if (!obj || typeof obj !== 'object') return acc;
  if (Object.prototype.hasOwnProperty.call(obj, 'prompt') && typeof obj.prompt === 'string') {
    const taskId = `task_${Object.keys(acc).length + 1}`;
    acc[taskId] = obj.prompt as string;
    obj.source = `generated.${taskId}`;
    delete obj.prompt;
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      collectPrompts(obj[key], `${path}_${key}`, acc);
    }
  }
  return acc;
};

export const injectContent = (obj: any, generatedContent: Record<string, string>): void => {
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


