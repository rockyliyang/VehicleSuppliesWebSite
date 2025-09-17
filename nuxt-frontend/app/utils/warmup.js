#!/usr/bin/env node
/**
 * 页面预热脚本
 * 用于预热网站的关键页面，提升用户访问体验
 * 可以在部署后或定时任务中运行
 */

import { performWarmup } from './sitemapGenerator.js';

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    concurrency: 3,
    skipProducts: false,
    port: 3000,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--concurrency':
      case '-c':
        options.concurrency = parseInt(args[i + 1]) || 3;
        i++;
        break;
      case '--skip-products':
      case '-s':
        options.skipProducts = true;
        break;
      case '--port':
      case '-p':
        options.port = parseInt(args[i + 1]) || 3000;
        i++;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
页面预热脚本使用说明:

用法: node warmup.js [选项]

选项:
  -c, --concurrency <数量>    并发请求数量 (默认: 3)
  -s, --skip-products         跳过产品页面预热
  -p, --port <端口号>         localhost端口号 (默认: 3000)
  -h, --help                  显示此帮助信息

示例:
  node warmup.js                    # 使用默认设置预热所有页面
  node warmup.js -c 5              # 使用5个并发预热
  node warmup.js -s                # 跳过产品页面预热
  node warmup.js -p 5000           # 使用端口5000进行预热
  node warmup.js -c 2 -s -p 5000   # 使用2个并发、跳过产品页面、端口5000
`);
}

/**
 * 主函数
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log('='.repeat(50));
  console.log('🔥 网站页面预热工具');
  console.log('='.repeat(50));
  console.log(`配置: 并发数=${options.concurrency}, 跳过产品=${options.skipProducts}, 端口=${options.port}`);
  console.log('');

  try {
    const startTime = Date.now();
    const results = await performWarmup(options);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('='.repeat(50));
    console.log('📊 预热结果统计');
    console.log('='.repeat(50));
    console.log(`总页面数: ${results.total}`);
    console.log(`成功预热: ${results.success}`);
    console.log(`预热失败: ${results.failed}`);
    console.log(`成功率: ${((results.success / results.total) * 100).toFixed(1)}%`);
    console.log(`总耗时: ${duration}秒`);
    console.log('');

    // 显示失败的页面详情
    const failedPages = results.details.filter(detail => !detail.success);
    if (failedPages.length > 0) {
      console.log('❌ 预热失败的页面:');
      failedPages.forEach(page => {
        console.log(`  - ${page.url}`);
      });
      console.log('');
    }

    console.log('✅ 预热流程完成!');
    
    // 如果有失败的页面，以非零状态码退出
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('');
    console.error('❌ 预热流程执行失败:');
    console.error(error.message);
    console.error('');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main().catch(error => {
    console.error('预热失败:', error);
    process.exit(1);
  });
}

export {
  main,
  parseArgs,
  showHelp
};