#!/usr/bin/env node
// scripts/enrich-patterns.js
// 遍历 source-patterns.json，调用 AI 分析，生成 enriched-patterns.json

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
const SOURCE_FILE = path.join(__dirname, '../source-patterns.json');
const OUTPUT_FILE = path.join(__dirname, '../enriched-patterns.json');
const TEMP_FILE = path.join(__dirname, '../.enrich-progress.json');

// 配置
const CONFIG = {
  concurrency: 1,        // 并发数（建议保持1避免 API 限流）
  delayMs: 1000,         // 每个请求间延迟（毫秒）
  saveInterval: 10,      // 每处理N个保存一次
  autoResume: true       // 自动从上次中断处继续
};

// 加载源数据
function loadSourcePatterns() {
  console.log('📂 加载 source-patterns.json...');
  const content = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const patterns = JSON.parse(content);
  const ids = Object.keys(patterns).map(key => patterns[key].id);
  console.log(`✅ 加载了 ${ids.length} 个 Pattern IDs\n`);
  return { patterns, ids };
}

// 加载已有的结果（用于断点续传）
function loadExistingResults() {
  if (!CONFIG.autoResume) return {};
  
  if (fs.existsSync(OUTPUT_FILE)) {
    console.log('📥 发现已有结果文件，加载中...');
    const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const data = JSON.parse(content);
    const count = Object.keys(data).length;
    console.log(`✅ 已加载 ${count} 条已处理的记录\n`);
    return data;
  }
  
  if (fs.existsSync(TEMP_FILE)) {
    console.log('📥 发现临时进度文件，加载中...');
    const content = fs.readFileSync(TEMP_FILE, 'utf-8');
    const data = JSON.parse(content);
    const count = Object.keys(data).length;
    console.log(`✅ 已加载 ${count} 条已处理的记录\n`);
    return data;
  }
  
  return {};
}

// 保存结果
function saveResults(enrichedPatterns, isFinal = false) {
  const targetFile = isFinal ? OUTPUT_FILE : TEMP_FILE;
  const sortedData = {};
  
  // 按 key 排序
  Object.keys(enrichedPatterns).sort().forEach(key => {
    sortedData[key] = enrichedPatterns[key];
  });
  
  fs.writeFileSync(targetFile, JSON.stringify(sortedData, null, 2), 'utf-8');
  
  if (isFinal) {
    console.log(`\n✅ 最终结果已保存到: ${OUTPUT_FILE}`);
    // 删除临时文件
    if (fs.existsSync(TEMP_FILE)) {
      fs.unlinkSync(TEMP_FILE);
    }
  }
}

// 调用 API 分析单个 Pattern
async function analyzePattern(patternId) {
  try {
    const response = await axios.post(
      `${BASE_URL}/site-builder/analyze-pattern`,
      { id: patternId },
      { timeout: 60000 }
    );
    
    // 打印调试信息
    console.log('result=>', {
      success: true,
      data: response.data.data,
      duration: response.data.duration
    });
    
    return {
      success: true,
      data: response.data.data,
      duration: response.data.duration
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// 主处理函数
async function enrichPatterns(options = {}) {
  const startTime = Date.now();
  
  // 加载数据
  const { patterns, ids } = loadSourcePatterns();
  const enrichedPatterns = loadExistingResults();
  
  // 筛选需要处理的 ID
  const processedIds = new Set(
    Object.keys(enrichedPatterns).map(key => parseInt(key.replace('ptn-', '')))
  );
  const remainingIds = ids.filter(id => !processedIds.has(id));
  
  // 应用命令行参数
  const startIndex = options.start || 0;
  const limit = options.limit || null;
  const idsToProcess = limit 
    ? remainingIds.slice(startIndex, startIndex + limit)
    : remainingIds.slice(startIndex);
  
  if (idsToProcess.length === 0) {
    console.log('🎉 所有 Pattern 都已处理完成！');
    return;
  }
  
  console.log('📊 处理统计:');
  console.log(`   总数: ${ids.length}`);
  console.log(`   已完成: ${processedIds.size}`);
  console.log(`   待处理: ${remainingIds.length}`);
  console.log(`   本次处理: ${idsToProcess.length}\n`);
  
  const stats = {
    total: idsToProcess.length,
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  // 开始处理
  console.log('🚀 开始处理...\n');
  
  for (let i = 0; i < idsToProcess.length; i++) {
    const id = idsToProcess[i];
    const progress = Math.round(((i + 1) / idsToProcess.length) * 100);
    const key = `ptn-${id}`;
    
    console.log(`[${i + 1}/${idsToProcess.length}] (${progress}%) 分析 Pattern ${id}...`);
    
    // 检查图片是否存在
    const imagePath = path.join(__dirname, '../images', `ptn-${id}.jpeg`);
    if (!fs.existsSync(imagePath)) {
      console.log(`  ⚠️  图片不存在，跳过`);
      stats.skipped++;
      continue;
    }
    
    // 调用 API
    const result = await analyzePattern(id);
    
    if (result.success) {
      enrichedPatterns[key] = result.data;
      stats.success++;
      console.log(`  ✅ 成功 (耗时: ${result.duration}ms)`);
    } else {
      stats.failed++;
      console.log(`  ❌ 失败: ${result.error}`);
    }
    
    // 定期保存进度
    if ((i + 1) % CONFIG.saveInterval === 0) {
      saveResults(enrichedPatterns, false);
      console.log(`  💾 已保存进度 (${i + 1}/${idsToProcess.length})\n`);
    }
    
    // 延迟
    if (i < idsToProcess.length - 1 && CONFIG.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayMs));
    }
  }
  
  // 保存最终结果
  saveResults(enrichedPatterns, true);
  
  // 统计信息
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ 处理完成！');
  console.log('='.repeat(60));
  console.log(`📊 统计信息:`);
  console.log(`   本次处理: ${stats.total}`);
  console.log(`   ✅ 成功: ${stats.success}`);
  console.log(`   ❌ 失败: ${stats.failed}`);
  console.log(`   ⚠️  跳过: ${stats.skipped}`);
  console.log(`   ⏱️  总耗时: ${(totalDuration / 1000).toFixed(2)}s`);
  if (stats.success > 0) {
    console.log(`   📈 平均耗时: ${Math.round(totalDuration / stats.success)}ms/个`);
  }
  console.log(`\n📁 输出文件: ${OUTPUT_FILE}`);
  console.log(`📦 总记录数: ${Object.keys(enrichedPatterns).length}`);
  
  return stats;
}

// 命令行参数解析
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--start':
      case '-s':
        options.start = parseInt(args[++i]) || 0;
        break;
      case '--limit':
      case '-l':
        options.limit = parseInt(args[++i]) || null;
        break;
      case '--delay':
      case '-d':
        CONFIG.delayMs = parseInt(args[++i]) || 1000;
        break;
      case '--save-interval':
        CONFIG.saveInterval = parseInt(args[++i]) || 10;
        break;
      case '--no-resume':
        CONFIG.autoResume = false;
        break;
      case '--fresh':
        CONFIG.autoResume = false;
        // 删除已有文件
        if (fs.existsSync(OUTPUT_FILE)) fs.unlinkSync(OUTPUT_FILE);
        if (fs.existsSync(TEMP_FILE)) fs.unlinkSync(TEMP_FILE);
        console.log('🗑️  已清除历史记录，将从头开始处理\n');
        break;
      case '--help':
      case '-h':
        console.log('用法: npm run enrich [options]\n');
        console.log('选项:');
        console.log('  -s, --start <N>        从第 N 个待处理项开始（默认: 0）');
        console.log('  -l, --limit <N>        限制处理数量（默认: 全部）');
        console.log('  -d, --delay <ms>       请求间延迟毫秒数（默认: 1000）');
        console.log('  --save-interval <N>    每 N 个保存一次进度（默认: 10）');
        console.log('  --no-resume            不加载已有结果，从头开始（保留已有文件）');
        console.log('  --fresh                删除已有结果，完全重新开始');
        console.log('  -h, --help             显示帮助信息\n');
        console.log('示例:');
        console.log('  npm run enrich                    # 自动续传，处理所有待处理项');
        console.log('  npm run enrich -- --limit 10      # 测试处理 10 个');
        console.log('  npm run enrich -- --fresh         # 重新开始全部处理');
        process.exit(0);
    }
  }
  
  return options;
}

// 主函数
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Pattern Enrichment - AI 数据丰富化工具           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const options = parseArgs();
  
  try {
    const stats = await enrichPatterns(options);
    process.exit(stats && stats.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ 处理失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行
main();

