const fs = require('fs');
const path = require('path');

// 读取缺失翻译文件
function readMissingTranslations() {
    const filePath = path.join(__dirname, '../../db/main/postgresql/missing_translations.sql');
    const content = fs.readFileSync(filePath, 'utf8');
    
    const keys = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
        const match = line.match(/\(gen_random_uuid\(\), '([^']+)', '[^']+', '[^']+'\),?/);
        if (match) {
            const key = match[1];
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
    }
    
    return keys;
}

// 在前端目录中搜索翻译键的使用
function searchKeyInFiles(key, directory) {
    const foundFiles = [];
    
    function searchInDirectory(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                searchInDirectory(filePath);
            } else if (stat.isFile() && (file.endsWith('.vue') || file.endsWith('.js') || file.endsWith('.ts'))) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    if (content.includes(key)) {
                        const relativePath = path.relative(directory, filePath).replace(/\\/g, '/');
                        foundFiles.push(relativePath);
                    }
                } catch (err) {
                    // 忽略读取错误
                }
            }
        }
    }
    
    searchInDirectory(directory);
    return foundFiles;
}

// 主函数
function analyzeMissingTranslations() {
    console.log('开始分析缺失的翻译键...');
    
    const missingKeys = readMissingTranslations();
    console.log(`找到 ${missingKeys.length} 个缺失的翻译键`);
    
    const frontendDir = path.join(__dirname, '../../frontend/src');
    const backendDir = path.join(__dirname, '../../backend');
    
    const keyFileMap = {};
    
    for (const key of missingKeys) {
        console.log(`搜索键: ${key}`);
        
        // 在前端搜索
        const frontendFiles = searchKeyInFiles(key, frontendDir);
        // 在后端搜索
        const backendFiles = searchKeyInFiles(key, backendDir);
        
        const allFiles = [...frontendFiles.map(f => `frontend/src/${f}`), ...backendFiles.map(f => `backend/${f}`)];
        
        if (allFiles.length > 0) {
            keyFileMap[key] = allFiles;
        } else {
            keyFileMap[key] = ['未找到使用位置'];
        }
    }
    
    // 按文件分组
    const fileKeyMap = {};
    
    for (const [key, files] of Object.entries(keyFileMap)) {
        for (const file of files) {
            if (!fileKeyMap[file]) {
                fileKeyMap[file] = [];
            }
            fileKeyMap[file].push(key);
        }
    }
    
    // 生成报告
    let report = '# 缺失翻译键分析报告\n\n';
    report += `总计缺失翻译键: ${missingKeys.length}\n\n`;
    
    // 按文件名排序
    const sortedFiles = Object.keys(fileKeyMap).sort();
    
    for (const file of sortedFiles) {
        const keys = fileKeyMap[file].sort();
        if (file === '未找到使用位置') {
            continue; // 跳过未找到使用位置的键
        }
        
        report += `请把 ${file} 文件的 ${keys.join(',')} key 翻译好放到 insert_message_translations_postgresql.sql\n\n`;
    }
    
    // 添加详细的键列表供参考
    report += '\n---\n\n# 详细键列表（供参考）\n\n';
    
    for (const file of sortedFiles) {
        const keys = fileKeyMap[file].sort();
        if (file === '未找到使用位置') {
            continue;
        }
        
        report += `## ${file}\n`;
        report += `缺失键数量: ${keys.length}\n\n`;
        
        for (const key of keys) {
            report += `- \`${key}\`\n`;
        }
        
        report += '\n';
    }
    
    // 处理未找到使用位置的键
    if (fileKeyMap['未找到使用位置'] && fileKeyMap['未找到使用位置'].length > 0) {
        report += '\n## 未找到使用位置的键\n\n';
        for (const key of fileKeyMap['未找到使用位置'].sort()) {
            report += `- \`${key}\`\n`;
        }
        report += '\n';
    }
    
    // 保存报告
    const reportPath = path.join(__dirname, 'missing_translations_analysis.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    
    console.log(`\n分析完成！报告已保存到: ${reportPath}`);
    console.log(`\n文件分布统计:`);
    
    for (const file of sortedFiles) {
        console.log(`${file}: ${fileKeyMap[file].length} 个键`);
    }
}

// 运行分析
analyzeMissingTranslations();