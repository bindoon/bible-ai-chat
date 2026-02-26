#!/usr/bin/env node

/**
 * 上传构建产物到阿里云 OSS
 * 运行前需要设置环境变量：
 * - OSS_REGION: OSS区域，如 oss-cn-shanghai
 * - OSS_ACCESS_KEY_ID: AccessKey ID
 * - OSS_ACCESS_KEY_SECRET: AccessKey Secret
 * - OSS_BUCKET: Bucket名称
 * - OSS_BASE_PATH: OSS上传路径前缀，如 daily-static
 * - CDN_BASE_URL: CDN域名，如 https://cdn.example.com/
 * - OSS_ASSETS_FOLDER: OSS上静态资源子目录名，默认 rtcassets（本地 assets/ 映射到此目录）
 * - ALIYUN_OSS_INTERNAL: 是否使用内网上传（true/false），适用于阿里云 VPC 环境
 * 
 * 此脚本会：
 * 1. 上传静态资源文件到 OSS
 * 2. 替换 index.html 中的资源路径为 CDN_BASE_URL + OSS_BASE_PATH + /
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载 .env.web 配置到 process.env（不覆盖已存在的环境变量）
const envWebPath = path.join(__dirname, '..', '.env.web');
if (fs.existsSync(envWebPath)) {
  dotenv.config({ path: envWebPath, override: false });
} else {
  console.warn('⚠️  .env.web 文件不存在，跳过加载');
}

// OSS 配置（优先使用环境变量，其次使用 .env.web）
const OSS_CONFIG = {
  region: process.env.OSS_REGION || 'oss-us-west-1',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET || 'us-withjesus',
  basePath: process.env.OSS_BASE_PATH || 'daily-static',
  assetsFolder: process.env.OSS_ASSETS_FOLDER || 'rtcassets',
  internal: process.env.ALIYUN_OSS_INTERNAL === 'true',
};

// CDN 配置
const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://us-withjesus.oss-us-west-1.aliyuncs.com/';
const CDN_FULL_PATH = CDN_BASE_URL && OSS_CONFIG.basePath
  ? `${CDN_BASE_URL.replace(/\/$/, '')}/${OSS_CONFIG.basePath}/`
  : CDN_BASE_URL;

// 验证配置
function validateConfig() {
  const required = ['accessKeyId', 'accessKeySecret', 'bucket'];
  const missing = required.filter(key => !OSS_CONFIG[key]);
  
  if (missing.length > 0) {
    console.error('❌ 缺少必要的环境变量：');
    missing.forEach(key => {
      const envKey = `OSS_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
      console.error(`   ${envKey}`);
    });
    console.error('\n请设置环境变量后重试。');
    process.exit(1);
  }
}

// 计算文件 MD5
function calculateMD5(filePath) {
  const content = fs.readFileSync(filePath);
  return createHash('md5').update(content).digest('hex');
}

// 获取文件列表
function getFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      files.push(...getFiles(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath);
      files.push({
        localPath: fullPath,
        relativePath: relativePath.replace(/\\/g, '/'),
      });
    }
  }
  
  return files;
}

// 检查文件是否需要上传（比较文件大小）
async function shouldUpload(client, localPath, ossPath) {
  try {
    // 获取本地文件大小
    const localStats = fs.statSync(localPath);
    const localSize = localStats.size;
    
    // 尝试获取 OSS 上的文件信息
    try {
      const result = await client.head(ossPath);
      const ossSize = parseInt(result.res.headers['content-length'] || '0', 10);
      
      // 如果文件大小相同，不需要上传
      if (localSize === ossSize) {
        return { needUpload: false, reason: '文件大小相同' };
      }
      
      return { needUpload: true, reason: `大小不同 (本地:${localSize}, OSS:${ossSize})` };
    } catch (error) {
      // 文件不存在或其他错误，需要上传
      if (error.code === 'NoSuchKey' || error.status === 404) {
        return { needUpload: true, reason: '文件不存在' };
      }
      // 其他错误也上传
      return { needUpload: true, reason: `检查失败: ${error.message}` };
    }
  } catch (error) {
    // 本地文件读取失败
    return { needUpload: true, reason: `本地文件检查失败: ${error.message}` };
  }
}

// 上传文件到 OSS（使用 PUT 请求）
async function uploadFile(localPath, ossPath) {
  try {
    // 动态导入 ali-oss
    const OSS = (await import('ali-oss')).default;
    
    const client = new OSS({
      region: OSS_CONFIG.region,
      accessKeyId: OSS_CONFIG.accessKeyId,
      accessKeySecret: OSS_CONFIG.accessKeySecret,
      bucket: OSS_CONFIG.bucket,
      internal: OSS_CONFIG.internal,
      timeout: 60000,
    });
    
    // 检查是否需要上传
    const check = await shouldUpload(client, localPath, ossPath);
    
    if (!check.needUpload) {
      return { skipped: true, reason: check.reason };
    }
    
    const result = await client.put(ossPath, localPath);
    return { ...result, skipped: false };
  } catch (error) {
    console.error(`上传失败 ${ossPath}:`, error.message);
    throw error;
  }
}

// 修改 index.html 中的资源路径
function updateIndexHtml(distPath, urlMap) {
  const indexPath = path.join(distPath, 'index.html');
  let content = fs.readFileSync(indexPath, 'utf-8');
  
  // 替换所有资源路径
  for (const [localPath, ossUrl] of Object.entries(urlMap)) {
    content = content.replace(new RegExp(localPath, 'g'), ossUrl);
  }
  
  fs.writeFileSync(indexPath, content, 'utf-8');
  console.log('✅ 已更新 index.html 中的资源路径');
}

// 主函数
async function main() {
  console.log('🚀 开始上传静态资源到 OSS...\n');
  
  // 显示使用的 CDN 配置
  if (CDN_FULL_PATH) {
    console.log(`📍 CDN 完整路径: ${CDN_FULL_PATH}`);
    console.log(`   (CDN: ${CDN_BASE_URL}, Path: ${OSS_CONFIG.basePath})\n`);
  } else {
    console.log('⚠️  未配置 CDN，将使用 OSS 默认地址\n');
  }
  
  // 验证配置
  validateConfig();
  
  // 检查是否安装了 ali-oss
  try {
    await import('ali-oss');
  } catch (error) {
    console.error('❌ 未安装 ali-oss 包，请运行：pnpm add -D ali-oss');
    process.exit(1);
  }
  
  const distPath = path.join(__dirname, '..', 'client/dist');
  
  // 检查 dist 目录是否存在
  if (!fs.existsSync(distPath)) {
    console.error('❌ dist 目录不存在，请先运行 pnpm build');
    process.exit(1);
  }
  
  // 获取所有文件
  const files = getFiles(distPath);
  console.log(`📦 找到 ${files.length} 个文件\n`);
  
  // 过滤需要上传的文件（排除 index.html，最后单独处理）
  const assetsToUpload = files.filter(file => {
    const ext = path.extname(file.relativePath).toLowerCase();
    return ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'].includes(ext);
  });
  
  const urlMap = {};
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  
  // 上传资源文件
  for (const file of assetsToUpload) {
    // 将本地 assets/ 子目录映射为 OSS 上的 assetsFolder（默认 rtcassets）
    const ossRelativePath = file.relativePath.startsWith('assets/')
      ? `${OSS_CONFIG.assetsFolder}/${file.relativePath.slice('assets/'.length)}`
      : file.relativePath;

    const ossPath = OSS_CONFIG.basePath
      ? `${OSS_CONFIG.basePath}/${ossRelativePath}`
      : ossRelativePath;
    
    try {
      const result = await uploadFile(file.localPath, ossPath);
      
      // 构建 CDN URL（指向 assetsFolder 下的路径）
      const ossUrl = CDN_FULL_PATH 
        ? `${CDN_FULL_PATH}${ossRelativePath}`
        : result.url;
      
      urlMap[`/${file.relativePath}`] = ossUrl;
      
      if (result.skipped) {
        console.log(`⏭️  ${file.relativePath} (${result.reason})`);
        skippedCount++;
      } else {
        console.log(`✅ ${file.relativePath} -> ${ossUrl}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ ${file.relativePath} 上传失败`);
      failCount++;
    }
  }
  
  console.log(`\n📊 上传完成：成功 ${successCount}，跳过 ${skippedCount}，失败 ${failCount}\n`);
  
  if (failCount > 0) {
    console.error('❌ 部分文件上传失败，请检查错误信息');
    process.exit(1);
  }
  
  // 替换 index.html 中的资源路径
  if (CDN_FULL_PATH) {
    try {
      const indexPath = path.join(distPath, 'index.html');
      let indexContent = fs.readFileSync(indexPath, 'utf-8');
      
      // 替换所有 /assets/ 开头的路径为完整 CDN 路径（映射到 assetsFolder）
      indexContent = indexContent.replace(
        /(["'])\/?assets\//g,
        `$1${CDN_FULL_PATH}${OSS_CONFIG.assetsFolder}/`
      );
      
      fs.writeFileSync(indexPath, indexContent, 'utf-8');
      console.log('✅ 已替换 index.html 中的资源路径\n');
    } catch (error) {
      console.error('❌ 替换 index.html 路径失败:', error.message);
    }
  } else {
    console.log('⚠️  未配置 CDN，跳过 index.html 路径替换\n');
  }
  
  // 可选：也上传 index.html
  if (process.env.UPLOAD_INDEX_HTML === 'true') {
    const indexPath = path.join(distPath, 'index.html');
    const indexOssPath = OSS_CONFIG.basePath 
      ? `${OSS_CONFIG.basePath}/index.html`
      : 'index.html';
    
    try {
      await uploadFile(indexPath, indexOssPath);
      console.log(`✅ index.html 已上传到 OSS`);
    } catch (error) {
      console.error('❌ index.html 上传失败');
    }
  }
  
  console.log('\n✨ 所有操作完成！');
}

main().catch(error => {
  console.error('❌ 发生错误：', error);
  process.exit(1);
});
