// Deterministic Gutenberg HTML generator shared by routes/services

export type BlockNode = any;

export function generateGutenbergHTML(block: BlockNode, level: number = 0): string {
  switch (block.component) {
    case 'core/cover':
      return generateCoverBlock(block, level);
    case 'core/group':
      return generateGroupBlock(block, level);
    case 'core/columns':
      return generateColumnsBlock(block, level);
    case 'core/column':
      return generateColumnBlock(block, level);
    case 'core/heading':
      return generateHeadingBlock(block, level);
    case 'core/paragraph':
      return generateParagraphBlock(block, level);
    case 'core/image':
      return generateImageBlock(block, level);
    case 'core/buttons':
      return generateButtonsBlock(block, level);
    case 'core/button':
      return generateButtonBlock(block, level);
    default:
      return generateGenericBlock(block, level);
  }
}

export function generateFullGutenbergHtml(params: {
  structuredData: any;
  pages: Array<{ path: string; outline: BlockNode[]; name: string; purpose: string; seo: any }>;
}): string {
  const { structuredData, pages } = params;

  let fullHTML = '';
  fullHTML += `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n`;
  fullHTML += `  <meta charset="UTF-8">\n`;
  fullHTML += `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
  fullHTML += `  <title>${structuredData.companyInfo?.name ?? ''}</title>\n`;
  fullHTML += `  <meta name="description" content="${structuredData.companyInfo?.description ?? ''}">\n`;
  fullHTML += `</head>\n<body>\n`;
  fullHTML += `<!-- wp:template-part {"slug":"header","area":"header"} /-->\n\n`;
  fullHTML += `<!-- wp:group {"tagName":"main","style":{"spacing":{"margin":{"top":"0"},"padding":{"top":"0"}}}} -->\n`;
  fullHTML += `<main class="wp-block-group" style="margin-top:0;padding-top:0">\n`;

  pages.forEach(page => {
    fullHTML += `<!-- wp:group {"className":"page-${page.path.replace(/\//g, '-')}"} -->\n`;
    fullHTML += `<div class="wp-block-group page-${page.path.replace(/\//g, '-')}">\n`;
    if (page.outline && page.outline.length > 0) {
      page.outline.forEach(block => {
        fullHTML += generateGutenbergHTML(block, 0);
      });
    }
    fullHTML += `</div>\n`;
    fullHTML += `<!-- /wp:group -->\n\n`;
  });

  fullHTML += `</main>\n`;
  fullHTML += `<!-- /wp:group -->\n\n`;
  fullHTML += `<!-- wp:template-part {"slug":"footer","area":"footer"} /-->\n`;
  fullHTML += `</body>\n</html>`;
  return fullHTML;
}

function generateCoverBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};

  let html = `${indent}<!-- wp:cover ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-cover"`;
  if (config.align) html += ` align="${config.align}"`;
  if (config.overlayColor) html += ` style="--wp-block-cover-overlay-color: ${config.overlayColor};"`;
  if (config.minHeight) html += ` style="min-height: ${config.minHeight}px;"`;
  html += `>\n`;
  if (props.backgroundType === 'image') {
    html += `${indent}  <img src="/images/hero-bg.jpg" alt="背景图片" />\n`;
  }
  if (block.children && block.children.length > 0) {
    html += `${indent}  <div class="wp-block-cover__inner-container">\n`;
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 2);
    });
    html += `${indent}  </div>\n`;
  }
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:cover -->\n`;
  return html;
}

function generateGroupBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};

  let html = `${indent}<!-- wp:group ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-group ${props.className || ''}"`;
  if (config.backgroundColor) html += ` style="background-color: ${config.backgroundColor};"`;
  html += `>\n`;
  if (block.children && block.children.length > 0) {
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 1);
    });
  }
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:group -->\n`;
  return html;
}

function generateColumnsBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};

  let html = `${indent}<!-- wp:columns ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-columns ${props.className || ''}">\n`;
  if (block.children && block.children.length > 0) {
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 1);
    });
  }
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:columns -->\n`;
  return html;
}

function generateColumnBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};

  let html = `${indent}<!-- wp:column ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-column ${props.className || ''}">\n`;
  if (block.children && block.children.length > 0) {
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 1);
    });
  }
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:column -->\n`;
  return html;
}

function generateHeadingBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};

  let html = `${indent}<!-- wp:heading ${JSON.stringify(config)} -->\n`;
  html += `${indent}<h${config.level || 2} class="${props.className || ''}">`;
  if (block.content && block.content.text) {
    html += block.content.text;
  } else if ((props as any).content) {
    html += (props as any).content;
  } else {
    html += '标题内容';
  }
  html += `</h${config.level || 2}>\n`;
  html += `${indent}<!-- /wp:heading -->\n`;
  return html;
}

function generateParagraphBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};

  let html = `${indent}<!-- wp:paragraph ${JSON.stringify(config)} -->\n`;
  html += `${indent}<p class="${props.className || ''}">`;
  if (block.content && (block.content as any).text) {
    html += (block.content as any).text;
  } else if (block.content && (block.content as any).prompt) {
    html += `[AI生成文案: ${(block.content as any).prompt}]`;
  } else {
    html += '段落内容';
  }
  html += `</p>\n`;
  html += `${indent}<!-- /wp:paragraph -->\n`;
  return html;
}

function generateImageBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};

  let html = `${indent}<!-- wp:image ${JSON.stringify(config)} -->\n`;
  html += `${indent}<figure class="wp-block-image ${props.className || ''}">\n`;
  if (block.content && (block.content as any).source) {
    html += `${indent}  <img src="${(block.content as any).source}" alt="${props.alt || '图片'}" />\n`;
  } else {
    html += `${indent}  <img src="/images/placeholder.jpg" alt="占位图片" />\n`;
  }
  html += `${indent}</figure>\n`;
  html += `${indent}<!-- /wp:image -->\n`;
  return html;
}

function generateButtonsBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};

  let html = `${indent}<!-- wp:buttons ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-buttons ${props.className || ''}">\n`;
  if (block.children && block.children.length > 0) {
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 1);
    });
  }
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:buttons -->\n`;
  return html;
}

function generateButtonBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};

  let html = `${indent}<!-- wp:button ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-button ${props.className || ''}">\n`;
  html += `${indent}  <a class="wp-block-button__link" href="${props.url || '#'}">`;
  if (props.text) {
    html += props.text;
  } else {
    html += '按钮文本';
  }
  html += `</a>\n`;
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:button -->\n`;
  return html;
}

function generateGenericBlock(block: any, level: number): string {
  const indent = '  '.repeat(level);
  const config = block.config || {};
  const props = block.props || {};

  let html = `${indent}<!-- wp:${block.component} ${JSON.stringify(config)} -->\n`;
  html += `${indent}<div class="wp-block-${String(block.component).replace('core/', '')} ${props.className || ''}">\n`;
  if (block.children && block.children.length > 0) {
    block.children.forEach((child: any) => {
      html += generateGutenbergHTML(child, level + 1);
    });
  }
  html += `${indent}</div>\n`;
  html += `${indent}<!-- /wp:${block.component} -->\n`;
  return html;
}


