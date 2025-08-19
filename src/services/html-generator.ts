// WordPress古腾堡HTML生成器 - 插件化架构
// 根据区块数据结构生成标准的古腾堡HTML代码

export type BlockNode = {
  sectionName: string;
  blockName: string;
  attributes: Record<string, any>;
  innerBlocks: BlockNode[];
};

// 区块渲染器接口
export interface BlockRenderer {
  blockName: string;
  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string;
  generateAttributes(attributes: Record<string, any>): string;
  generateCSSClasses(attributes: Record<string, any>): string[];
}

// 区块渲染器注册中心
export class BlockRendererRegistry {
  private renderers = new Map<string, BlockRenderer>();

  register(renderer: BlockRenderer): void {
    this.renderers.set(renderer.blockName, renderer);
  }

  getRenderer(blockName: string): BlockRenderer | undefined {
    // 移除命名空间前缀，只保留区块名称
    const blockType = blockName.replace(/^[^\/]+\//, '');
    return this.renderers.get(blockType);
  }

  renderBlock(block: BlockNode): string {
    const renderer = this.getRenderer(block.blockName);
    if (!renderer) {
      // 使用通用渲染器作为fallback
      return this.renderGenericBlock(block);
    }

    const { blockName, attributes, innerBlocks } = block;
    const blockType = blockName.replace(/^[^\/]+\//, '');
    
    // 生成区块注释开始
    let html = `<!-- wp:${blockType}`;
    
    // 生成属性JSON（如果有属性）
    const attributesJson = renderer.generateAttributes(attributes);
    if (attributesJson) {
      html += ` ${attributesJson}`;
    }
    
    html += ` -->`;
    
    // 生成区块HTML内容
    html += renderer.renderHTML(attributes, innerBlocks);
    
    // 生成区块注释结束
    html += `<!-- /wp:${blockType} -->`;
    
    return html;
  }

  private renderGenericBlock(block: BlockNode): string {
    const { blockName, attributes, innerBlocks } = block;
    const blockType = blockName.replace(/^[^\/]+\//, '');
    
    let html = `<!-- wp:${blockType}`;
    
    // 过滤并添加属性
    const filteredAttributes = this.filterEmptyAttributes(attributes);
    if (Object.keys(filteredAttributes).length > 0) {
      html += ` ${JSON.stringify(filteredAttributes)}`;
    }
    
    html += ` -->`;
    html += `<div class="wp-block-${blockType}">`;
    
    // 递归渲染内部区块
    if (innerBlocks && innerBlocks.length > 0) {
      innerBlocks.forEach(innerBlock => {
        html += this.renderBlock(innerBlock);
      });
    }
    
    html += `</div>`;
    html += `<!-- /wp:${blockType} -->`;
    
    return html;
  }

  private filterEmptyAttributes(attributes: Record<string, any>): Record<string, any> {
    const filtered: Record<string, any> = {};
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined && value !== null && value !== '') {
        filtered[key] = value;
      }
    }
    return filtered;
  }
}

// 全局区块渲染器注册中心实例
const globalRegistry = new BlockRendererRegistry();

export function generateFullGutenbergHtml(params: {
  structuredData: any;
  pages: Array<{ path: string; outline: BlockNode[]; name: string; purpose: string; seo: any }>;
}): string {
  const { structuredData, pages } = params;

  let fullHTML = '';
  
  // 生成页面内容，不包含HTML文档结构
  pages.forEach(page => {
    if (page.outline && page.outline.length > 0) {
      page.outline.forEach((block, index) => {
        fullHTML += globalRegistry.renderBlock(block);
        // 只在非最后一个区块后添加分隔符
        if (index < page.outline.length - 1) {
          fullHTML += ' '; // 使用空格代替换行作为分隔符
        }
      });
    }
  });

  return fullHTML.trim();
}

// 工具函数：WordPress属性工具类
class WordPressAttributeUtils {
  static filterEmptyAttributes(attributes: Record<string, any>): Record<string, any> {
    const filtered: Record<string, any> = {};
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined && value !== null && value !== '') {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  static generateCSSClasses(baseClass: string, attributes: Record<string, any>): string[] {
    const classes = [baseClass];
    
    // 处理alignment属性
    if (attributes.align) {
      if (attributes.align === 'full') {
        classes.push('alignfull');
      } else if (attributes.align === 'wide') {
        classes.push('alignwide');
      } else if (attributes.align === 'center') {
        classes.push('aligncenter');
      } else if (attributes.align === 'left') {
        classes.push('alignleft');
      } else if (attributes.align === 'right') {
        classes.push('alignright');
      }
    }

    // 处理背景颜色
    if (attributes.backgroundColor) {
      classes.push(`has-${attributes.backgroundColor}-background-color`);
      classes.push('has-background');
    }

    // 处理文字颜色
    if (attributes.textColor) {
      classes.push(`has-${attributes.textColor}-color`);
      classes.push('has-text-color');
    }

    return classes;
  }
}

// WordPress核心区块渲染器实现
abstract class BaseBlockRenderer implements BlockRenderer {
  abstract blockName: string;
  abstract renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string;

  generateAttributes(attributes: Record<string, any>): string {
    // 获取这个区块类型应该保留的属性
    const validAttributes = this.getValidAttributes(attributes);
    const filtered = WordPressAttributeUtils.filterEmptyAttributes(validAttributes);
    return Object.keys(filtered).length > 0 ? JSON.stringify(filtered) : '';
  }

  generateCSSClasses(attributes: Record<string, any>): string[] {
    return WordPressAttributeUtils.generateCSSClasses(`wp-block-${this.blockName}`, attributes);
  }

  protected renderInnerBlocks(innerBlocks: BlockNode[]): string {
    if (!innerBlocks || innerBlocks.length === 0) return '';
    return innerBlocks.map(block => globalRegistry.renderBlock(block)).join('');
  }

  /**
   * 获取对于此区块类型有效的WordPress属性
   * 子类可以重写此方法来定制属性过滤逻辑
   */
  protected getValidAttributes(attributes: Record<string, any>): Record<string, any> {
    // 默认的通用属性过滤
    const validKeys = [
      'align', 'backgroundColor', 'textColor', 'fontSize', 'fontFamily',
      'style', 'className', 'anchor', 'lock'
    ];
    
    const filtered: Record<string, any> = {};
    for (const key of validKeys) {
      if (attributes[key] !== undefined) {
        filtered[key] = attributes[key];
      }
    }
    
    return filtered;
  }
}

// Cover区块渲染器
// Cover区块渲染器
class CoverBlockRenderer extends BaseBlockRenderer {
  blockName = 'cover';

  protected getValidAttributes(attributes: Record<string, any>): Record<string, any> {
    // ... (这个方法无需改动)
    const validKeys = ['align', 'dimRatio', 'minHeight', 'overlayColor', 'url', 'backgroundColor'];
    const filtered: Record<string, any> = {};
    
    for (const key of validKeys) {
      if (attributes[key] !== undefined) {
        filtered[key] = attributes[key];
      }
    }
    
    return filtered;
  }

  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string {
    // --- 开始修改 ---

    // 1. 处理最外层容器的类和样式
    const mainClasses = this.generateCSSClasses(attributes); // 假设这个方法会返回 'wp-block-cover', 'alignfull' 等基础类
    const mainStyles: string[] = [];
    
    if (attributes.minHeight) {
      mainStyles.push(`min-height:${attributes.minHeight}px`);
    }

    // **修正点1：如果设置的是 backgroundColor，则将颜色类添加到主div上**
    if (attributes.backgroundColor) {
      mainClasses.push(`has-${attributes.backgroundColor}-background-color`);
      mainClasses.push('has-background'); // 通常背景颜色会伴随这个类
    }

    const mainStyleAttr = mainStyles.length > 0 ? ` style="${mainStyles.join(';')}"` : '';
    let html = `<div class="${mainClasses.join(' ')}"${mainStyleAttr}>`;
    
    // 2. 处理背景图片 (这部分逻辑不变)
    if (attributes.url) {
      html += `<img class="wp-block-cover__image-background" alt="" src="${attributes.url}" data-object-fit="cover"/>`;
    }
    
    // 3. 处理背景遮罩<span>
    const backgroundClasses = ['wp-block-cover__background'];
    const backgroundStyles: string[] = [];

    // **修正点2：只有 overlayColor (图片遮罩颜色) 才应用到span上**
    if (attributes.overlayColor) {
        backgroundClasses.push(`has-${attributes.overlayColor}-background-color`);
    }

    // **修正点3：使用内联样式处理 dimRatio，而不是用class**
    if (attributes.dimRatio !== undefined && attributes.dimRatio > 0) {
        backgroundClasses.push('has-background-dim');
    } else if (Object.keys(attributes).includes('dimRatio') && attributes.dimRatio === 0) {
      // dimRatio 为 0 的特殊情况
      backgroundClasses.push('has-background-dim');
      backgroundClasses.push('has-background-dim-0');
    }

    const backgroundStyleAttr = backgroundStyles.length > 0 ? ` style="${backgroundStyles.join(';')}"` : '';
    html += `<span aria-hidden="true" class="${backgroundClasses.join(' ')}"${backgroundStyleAttr}></span>`;
    
    // 4. 内容容器 (这部分逻辑不变)
    html += `<div class="wp-block-cover__inner-container">`;
    if (innerBlocks && innerBlocks.length > 0) {
      html += this.renderInnerBlocks(innerBlocks);
    }
    html += `</div>`;
    
    html += `</div>`;
    return html;

    // --- 结束修改 ---
  }
}

// Heading区块渲染器
class HeadingBlockRenderer extends BaseBlockRenderer {
  blockName = 'heading';

  protected getValidAttributes(attributes: Record<string, any>): Record<string, any> {
    const validKeys = ['content', 'level', 'textAlign', 'textColor'];
    const filtered: Record<string, any> = {};
    
    for (const key of validKeys) {
      if (attributes[key] !== undefined) {
        filtered[key] = attributes[key];
      }
    }
    
    return filtered;
  }

  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string {
    const level = attributes.level || 2;
    const content = attributes.content || '';
    const classes = ['wp-block-heading'];
    
    // 处理文字对齐
    if (attributes.textAlign) {
      classes.push(`has-text-align-${attributes.textAlign}`);
    }
    
    // 处理颜色类
    if (attributes.textColor) {
      classes.push(`has-${attributes.textColor}-color`);
      classes.push('has-text-color');
    }
    
    return `<h${level} class="${classes.join(' ')}">${content}</h${level}>`;
  }
}

// Paragraph区块渲染器
class ParagraphBlockRenderer extends BaseBlockRenderer {
  blockName = 'paragraph';

  protected getValidAttributes(attributes: Record<string, any>): Record<string, any> {
    const validKeys = ['content', 'textAlign', 'fontSize', 'textColor'];
    const filtered: Record<string, any> = {};
    
    for (const key of validKeys) {
      if (attributes[key] !== undefined) {
        filtered[key] = attributes[key];
      }
    }
    
    return filtered;
  }

  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string {
    const content = attributes.content || '';
    const classes = ['wp-block-paragraph'];
    
    // 处理文字对齐
    if (attributes.textAlign) {
      classes.push(`has-text-align-${attributes.textAlign}`);
    }
    
    // 处理字体大小
    if (attributes.fontSize) {
      classes.push(`has-${attributes.fontSize}-font-size`);
    }
    
    // 处理颜色类
    if (attributes.textColor) {
      classes.push(`has-${attributes.textColor}-color`);
      classes.push('has-text-color');
    }
    
    const classAttr = classes.length > 1 ? ` class="${classes.join(' ')}"` : '';
    return `<p${classAttr}>${content}</p>`;
  }
}

// Button区块渲染器
class ButtonBlockRenderer extends BaseBlockRenderer {
  blockName = 'button';

  protected getValidAttributes(attributes: Record<string, any>): Record<string, any> {
    const validKeys = ['backgroundColor', 'borderRadius', 'text', 'textColor', 'url'];
    const filtered: Record<string, any> = {};
    
    for (const key of validKeys) {
      if (attributes[key] !== undefined) {
        filtered[key] = attributes[key];
      }
    }
    
    return filtered;
  }

  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string {
    const text = attributes.text || '按钮';
    const url = attributes.url || '#';
    const classes = ['wp-block-button__link'];
    
    // 按照WordPress期望的顺序添加颜色类
    if (attributes.textColor) {
      classes.push(`has-${attributes.textColor}-color`);
    }
    
    if (attributes.backgroundColor) {
      classes.push(`has-${attributes.backgroundColor}-background-color`);
    }
    
    // 在颜色类之后添加通用类
    if (attributes.textColor) {
      classes.push('has-text-color');
    }
    
    if (attributes.backgroundColor) {
      classes.push('has-background');
    }
    
    classes.push('wp-element-button');
    
    // 不添加内联样式，borderRadius应该通过CSS类处理
    return `<div class="wp-block-button"><a class="${classes.join(' ')}" href="${url}">${text}</a></div>`;
  }
}

// Buttons区块渲染器
class ButtonsBlockRenderer extends BaseBlockRenderer {
  blockName = 'buttons';

  protected getValidAttributes(attributes: Record<string, any>): Record<string, any> {
    const validKeys = ['layout'];
    const filtered: Record<string, any> = {};
    
    for (const key of validKeys) {
      if (attributes[key] !== undefined) {
        filtered[key] = attributes[key];
      }
    }
    
    return filtered;
  }

  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string {
    const classes = ['wp-block-buttons'];
    
    // 处理布局
    if (attributes.layout?.justifyContent === 'center') {
      classes.push('is-content-justification-center');
    }
    
    let html = `<div class="${classes.join(' ')}">`;
    html += this.renderInnerBlocks(innerBlocks);
    html += `</div>`;
    return html;
  }
}

// Columns区块渲染器
class ColumnsBlockRenderer extends BaseBlockRenderer {
  blockName = 'columns';

  protected getValidAttributes(attributes: Record<string, any>): Record<string, any> {
    const validKeys = ['align', 'isStackedOnMobile', 'verticalAlignment'];
    const filtered: Record<string, any> = {};
    
    for (const key of validKeys) {
      if (attributes[key] !== undefined) {
        filtered[key] = attributes[key];
      }
    }
    
    return filtered;
  }

  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string {
    const classes = this.generateCSSClasses(attributes);
    
    if (attributes.isStackedOnMobile) {
      classes.push('is-stacked-on-mobile');
    }
    
    if (attributes.verticalAlignment) {
      classes.push(`are-vertically-aligned-${attributes.verticalAlignment}`);
    }
    
    let html = `<div class="${classes.join(' ')}">`;
    html += this.renderInnerBlocks(innerBlocks);
    html += `</div>`;
    return html;
  }
}

// Column区块渲染器
class ColumnBlockRenderer extends BaseBlockRenderer {
  blockName = 'column';

  protected getValidAttributes(attributes: Record<string, any>): Record<string, any> {
    const validKeys = ['width'];
    const filtered: Record<string, any> = {};
    
    for (const key of validKeys) {
      if (attributes[key] !== undefined) {
        filtered[key] = attributes[key];
      }
    }
    
    return filtered;
  }

  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string {
    const classes = ['wp-block-column'];
    
    let style = '';
    if (attributes.width) {
      style = ` style="flex-basis:${attributes.width}"`;
    }
    
    let html = `<div class="${classes.join(' ')}"${style}>`;
    html += this.renderInnerBlocks(innerBlocks);
    html += `</div>`;
    return html;
  }
}

// Spacer区块渲染器
class SpacerBlockRenderer extends BaseBlockRenderer {
  blockName = 'spacer';

  protected getValidAttributes(attributes: Record<string, any>): Record<string, any> {
    const validKeys = ['height'];
    const filtered: Record<string, any> = {};
    
    for (const key of validKeys) {
      if (attributes[key] !== undefined) {
        filtered[key] = attributes[key];
      }
    }
    
    return filtered;
  }

  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string {
    const height = attributes.height || '100px';
    return `<div style="height:${height}" aria-hidden="true" class="wp-block-spacer"></div>`;
  }
}

// Group区块渲染器
class GroupBlockRenderer extends BaseBlockRenderer {
  blockName = 'group';

  protected getValidAttributes(attributes: Record<string, any>): Record<string, any> {
    const validKeys = ['align', 'backgroundColor', 'layout'];
    const filtered: Record<string, any> = {};
    
    for (const key of validKeys) {
      if (attributes[key] !== undefined) {
        filtered[key] = attributes[key];
      }
    }
    
    return filtered;
  }

  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string {
    const classes = this.generateCSSClasses(attributes);
    
    let html = `<div class="${classes.join(' ')}">`;
    html += this.renderInnerBlocks(innerBlocks);
    html += `</div>`;
    return html;
  }
}

// 注册所有WordPress核心区块渲染器
function registerCoreBlockRenderers(): void {
  globalRegistry.register(new CoverBlockRenderer());
  globalRegistry.register(new HeadingBlockRenderer());
  globalRegistry.register(new ParagraphBlockRenderer());
  globalRegistry.register(new ButtonBlockRenderer());
  globalRegistry.register(new ButtonsBlockRenderer());
  globalRegistry.register(new ColumnsBlockRenderer());
  globalRegistry.register(new ColumnBlockRenderer());
  globalRegistry.register(new SpacerBlockRenderer());
  globalRegistry.register(new GroupBlockRenderer());
}

// 自动注册核心区块
registerCoreBlockRenderers();

// 导出注册中心，供自定义区块注册使用
export { globalRegistry as blockRendererRegistry };

// =================
// 自定义区块渲染器架构
// =================

/**
 * 自定义区块渲染器基类
 * 继承此类来创建自定义区块渲染器
 */
export abstract class CustomBlockRenderer extends BaseBlockRenderer {
  /**
   * 自定义区块的命名空间，通常为 'custom'
   */
  protected namespace = 'custom';

  /**
   * 生成自定义区块的CSS类
   */
  generateCSSClasses(attributes: Record<string, any>): string[] {
    return WordPressAttributeUtils.generateCSSClasses(`wp-block-${this.namespace}-${this.blockName}`, attributes);
  }

  /**
   * 处理自定义属性，子类可以重写此方法
   */
  protected processCustomAttributes(attributes: Record<string, any>): Record<string, any> {
    return attributes;
  }

  /**
   * 生成自定义样式，子类可以重写此方法
   */
  protected generateCustomStyles(attributes: Record<string, any>): string {
    return '';
  }
}

/**
 * 自定义区块注册工具函数
 */
export function registerCustomBlockRenderer(renderer: BlockRenderer): void {
  globalRegistry.register(renderer);
}

// =================
// 自定义区块渲染器示例
// =================

/**
 * 示例：产品展示卡片区块渲染器
 */
export class ProductCardBlockRenderer extends CustomBlockRenderer {
  blockName = 'product-card';

  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string {
    const { title, price, image, description, buttonText, buttonUrl } = attributes;
    const classes = this.generateCSSClasses(attributes);
    const customStyles = this.generateCustomStyles(attributes);
    
    const styleAttr = customStyles ? ` style="${customStyles}"` : '';
    
    let html = `<div class="${classes.join(' ')}"${styleAttr}>`;
    
    if (image) {
      html += `<div class="wp-block-custom-product-card__image">`;
      html += `<img src="${image}" alt="${title || ''}" />`;
      html += `</div>`;
    }
    
    html += `<div class="wp-block-custom-product-card__content">`;
    
    if (title) {
      html += `<h3 class="wp-block-custom-product-card__title">${title}</h3>`;
    }
    
    if (price) {
      html += `<div class="wp-block-custom-product-card__price">${price}</div>`;
    }
    
    if (description) {
      html += `<p class="wp-block-custom-product-card__description">${description}</p>`;
    }
    
    // 渲染内部区块（可能包含更多自定义内容）
    if (innerBlocks && innerBlocks.length > 0) {
      html += `<div class="wp-block-custom-product-card__inner">`;
      html += this.renderInnerBlocks(innerBlocks);
      html += `</div>`;
    }
    
    if (buttonText && buttonUrl) {
      html += `<div class="wp-block-custom-product-card__button">`;
      html += `<a href="${buttonUrl}" class="wp-block-custom-product-card__link">${buttonText}</a>`;
      html += `</div>`;
    }
    
    html += `</div>`; // content
    html += `</div>`; // card
    
    return html;
  }

  protected generateCustomStyles(attributes: Record<string, any>): string {
    const styles: string[] = [];
    
    if (attributes.cardBackgroundColor) {
      styles.push(`background-color: ${attributes.cardBackgroundColor}`);
    }
    
    if (attributes.cardBorderRadius) {
      styles.push(`border-radius: ${attributes.cardBorderRadius}px`);
    }
    
    return styles.join('; ');
  }
}

/**
 * 示例：团队成员介绍区块渲染器
 */
export class TeamMemberBlockRenderer extends CustomBlockRenderer {
  blockName = 'team-member';

  renderHTML(attributes: Record<string, any>, innerBlocks: BlockNode[]): string {
    const { name, position, avatar, bio, social } = attributes;
    const classes = this.generateCSSClasses(attributes);
    
    let html = `<div class="${classes.join(' ')}">`;
    
    if (avatar) {
      html += `<div class="wp-block-custom-team-member__avatar">`;
      html += `<img src="${avatar}" alt="${name || ''}" />`;
      html += `</div>`;
    }
    
    html += `<div class="wp-block-custom-team-member__info">`;
    
    if (name) {
      html += `<h4 class="wp-block-custom-team-member__name">${name}</h4>`;
    }
    
    if (position) {
      html += `<div class="wp-block-custom-team-member__position">${position}</div>`;
    }
    
    if (bio) {
      html += `<p class="wp-block-custom-team-member__bio">${bio}</p>`;
    }
    
    // 社交媒体链接
    if (social && Array.isArray(social) && social.length > 0) {
      html += `<div class="wp-block-custom-team-member__social">`;
      social.forEach((link: any) => {
        if (link.url && link.platform) {
          html += `<a href="${link.url}" class="wp-block-custom-team-member__social-link" data-platform="${link.platform}">${link.platform}</a>`;
        }
      });
      html += `</div>`;
    }
    
    // 渲染内部区块
    if (innerBlocks && innerBlocks.length > 0) {
      html += this.renderInnerBlocks(innerBlocks);
    }
    
    html += `</div>`; // info
    html += `</div>`; // team-member
    
    return html;
  }
}

// 使用示例：注册自定义区块渲染器
// registerCustomBlockRenderer(new ProductCardBlockRenderer());
// registerCustomBlockRenderer(new TeamMemberBlockRenderer());


