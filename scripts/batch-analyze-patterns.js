// scripts/batch-analyze-patterns.js
// 批量分析所有 patterns 的脚本

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
const SOURCE_PATTERNS_PATH = path.join(__dirname, '../source-patterns.json');
const OUTPUT_PATH = path.join(__dirname, '../pattern-analysis-results.json');

// 从 source-patterns.json 读取所有 pattern IDs
function loadPatternIds() {
  const content = fs.readFileSync(SOURCE_PATTERNS_PATH, 'utf-8');
  const patterns = JSON.parse(content);
  
  const ids = Object.keys(patterns).map(key => patterns[key].id);
  console.log(`✅ 加载了 ${ids.length} 个 Pattern IDs`);
  return ids;
}

// 分析单个 Pattern
async function analyzePattern(patternId) {
  try {
    const response = await axios.post(`${BASE_URL}/site-builder/analyze-pattern`, {
      id: patternId
    }, {
      timeout: 60000 // 60秒超时
    });
    
    return {
      success: true,
      id: patternId,
      data: response.data.data,
      duration: response.data.duration
    };
  } catch (error) {
    return {
      success: false,
      id: patternId,
      error: error.response?.data?.message || error.message
    };
  }
}

// 批量处理
async function batchAnalyze(patternIds, options = {}) {
  const {
    concurrency = 1, // 并发数，默认为1（串行）
    startIndex = 0,   // 起始索引
    limit = null,     // 处理数量限制
    delayMs = 1000    // 每个请求之间的延迟（毫秒）
  } = options;
  
  const idsToProcess = limit ? patternIds.slice(startIndex, startIndex + limit) : patternIds.slice(startIndex);
  const results = [];
  const stats = {
    total: idsToProcess.length,
    success: 0,
    failed: 0,
    startTime: Date.now()
  };
  
  console.log(`\n开始批量分析 ${idsToProcess.length} 个 Patterns...`);
  console.log(`并发数: ${concurrency}, 延迟: ${delayMs}ms\n`);
  
  // 串行处理
  if (concurrency === 1) {
    for (let i = 0; i < idsToProcess.length; i++) {
      const id = idsToProcess[i];
      const progress = Math.round(((i + 1) / idsToProcess.length) * 100);
      
      console.log(`[${i + 1}/${idsToProcess.length}] (${progress}%) 正在分析 Pattern ${id}...`);
      
      const result = await analyzePattern(id);
      results.push(result);
      
      if (result.success) {
        stats.success++;
        console.log(`  ✅ 成功 (耗时: ${result.duration}ms)`);
      } else {
        stats.failed++;
        console.log(`  ❌ 失败: ${result.error}`);
      }
      
      // 延迟
      if (i < idsToProcess.length - 1 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  } else {
    // 并发处理（简单实现）
    for (let i = 0; i < idsToProcess.length; i += concurrency) {
      const batch = idsToProcess.slice(i, i + concurrency);
      const progress = Math.round((Math.min(i + concurrency, idsToProcess.length) / idsToProcess.length) * 100);
      
      console.log(`[${i + 1}-${Math.min(i + concurrency, idsToProcess.length)}/${idsToProcess.length}] (${progress}%) 并发分析...`);
      
      const promises = batch.map(id => analyzePattern(id));
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      
      batchResults.forEach(result => {
        if (result.success) {
          stats.success++;
          console.log(`  ✅ Pattern ${result.id} 成功`);
        } else {
          stats.failed++;
          console.log(`  ❌ Pattern ${result.id} 失败: ${result.error}`);
        }
      });
      
      // 延迟
      if (i + concurrency < idsToProcess.length && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  stats.endTime = Date.now();
  stats.totalDuration = stats.endTime - stats.startTime;
  
  return { results, stats };
}

// 保存结果
function saveResults(results, stats) {
  const output = {
    metadata: {
      totalProcessed: stats.total,
      successCount: stats.success,
      failedCount: stats.failed,
      totalDuration: stats.totalDuration,
      averageDuration: Math.round(stats.totalDuration / stats.total),
      timestamp: new Date().toISOString()
    },
    results: results
  };
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ 结果已保存到: ${OUTPUT_PATH}`);
}

// 主函数
async function main() {
  console.log('====================================');
  console.log('Pattern 批量分析脚本');
  console.log('====================================\n');
  
  // 解析命令行参数
  const args = process.argv.slice(2);
  const options = {
    concurrency: 1,
    startIndex: 0,
    limit: null,
    delayMs: 1000
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--concurrency' || args[i] === '-c') {
      options.concurrency = parseInt(args[i + 1]) || 1;
      i++;
    } else if (args[i] === '--start' || args[i] === '-s') {
      options.startIndex = parseInt(args[i + 1]) || 0;
      i++;
    } else if (args[i] === '--limit' || args[i] === '-l') {
      options.limit = parseInt(args[i + 1]) || null;
      i++;
    } else if (args[i] === '--delay' || args[i] === '-d') {
      options.delayMs = parseInt(args[i + 1]) || 1000;
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log('用法: node scripts/batch-analyze-patterns.js [options]');
      console.log('\n选项:');
      console.log('  -c, --concurrency <数字>  并发数 (默认: 1)');
      console.log('  -s, --start <数字>        起始索引 (默认: 0)');
      console.log('  -l, --limit <数字>        处理数量限制 (默认: 全部)');
      console.log('  -d, --delay <数字>        请求间延迟毫秒数 (默认: 1000)');
      console.log('  -h, --help                显示帮助信息');
      console.log('\n示例:');
      console.log('  node scripts/batch-analyze-patterns.js --limit 10');
      console.log('  node scripts/batch-analyze-patterns.js --start 0 --limit 100 --concurrency 3');
      process.exit(0);
    }
  }
  
  try {
    // 加载 Pattern IDs
    const patternIds = loadPatternIds();
    
    if (options.startIndex >= patternIds.length) {
      console.error(`❌ 起始索引 ${options.startIndex} 超出范围 (总共 ${patternIds.length} 个)`);
      process.exit(1);
    }
    
    // 执行批量分析
    const { results, stats } = await batchAnalyze(patternIds, options);
    
    // 保存结果
    saveResults(results, stats);
    
    // 打印统计信息
    console.log('\n====================================');
    console.log('分析完成!');
    console.log('====================================');
    console.log(`总计: ${stats.total}`);
    console.log(`成功: ${stats.success}`);
    console.log(`失败: ${stats.failed}`);
    console.log(`总耗时: ${(stats.totalDuration / 1000).toFixed(2)}s`);
    console.log(`平均耗时: ${Math.round(stats.totalDuration / stats.total)}ms/个`);
    
    process.exit(stats.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ 脚本执行失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
main();

