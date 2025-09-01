// 首先加载环境变量配置
require('./config/env');

// 引入日志工具并重写console
if (process.env.NODE_ENV === 'development') {
  const { overrideConsole } = require('./utils/logger');
  overrideConsole();
}
const { BackgroundTaskManager } = require('./utils/backgroundTasks');
const { query } = require('./db/db');
const { sendMail } = require('./utils/email');

// 数据库连接已在db.js中自动初始化

// 创建后台任务管理器实例
const taskManager = new BackgroundTaskManager();

// 引入node-cron用于定时任务
const cron = require('node-cron');

// 获取汇率的函数
async function fetchExchangeRates() {
  try {
    console.log('[SCHEDULE] 开始获取汇率数据...');
    
    const apiKey = process.env.ExchangeAPIKey;
    if (!apiKey) {
      console.error('[SCHEDULE] ExchangeAPIKey 未配置');
      return;
    }
    
    // 调用ExchangeRate-API获取USD到CNY的汇率
    const fetch = require('node-fetch');
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.result !== 'success') {
      throw new Error(`API返回错误: ${data['error-type'] || '未知错误'}`);
    }
    
    const usdToCnyRate = data.conversion_rates.CNY;
    if (!usdToCnyRate) {
      throw new Error('未找到USD到CNY的汇率数据');
    }
    
    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0];
    
    // 检查今天是否已有汇率记录
    const existingRateQuery = `
      SELECT id FROM exchange_rates 
      WHERE from_currency = 'USD' 
        AND to_currency = 'CNY' 
        AND rate_date = $1 
        AND deleted = false
    `;
    
    const existingResult = await query(existingRateQuery, [today]);
    
    if (existingResult.rows.length > 0) {
      // 更新现有记录
      const updateQuery = `
        UPDATE exchange_rates 
        SET exchange_rate = $1, updated_at = NOW() 
        WHERE from_currency = 'USD' 
          AND to_currency = 'CNY' 
          AND rate_date = $2 
          AND deleted = false
      `;
      
      await query(updateQuery, [usdToCnyRate, today]);
      console.log(`[SCHEDULE] 更新汇率成功: 1 USD = ${usdToCnyRate} CNY (${today})`);
    } else {
      // 插入新记录
      const insertQuery = `
        INSERT INTO exchange_rates (exchange_rate, from_currency, to_currency, rate_date, source) 
        VALUES ($1, 'USD', 'CNY', $2, 'ExchangeRate-API')
      `;
      
      await query(insertQuery, [usdToCnyRate, today]);
      console.log(`[SCHEDULE] 插入汇率成功: 1 USD = ${usdToCnyRate} CNY (${today})`);
    }
    
    console.log('[SCHEDULE] 汇率获取任务完成');
    
  } catch (error) {
    console.error('[SCHEDULE] 获取汇率任务执行失败:', error);
  }
}

//fetchExchangeRates();
// 设置每天上午10点执行汇率获取任务
cron.schedule('0 10 * * *', fetchExchangeRates, {
  scheduled: true,
  timezone: "Asia/Shanghai"
});

console.log('[SCHEDULE] 汇率获取定时任务已设置: 每天上午10点执行');

// 注册检查未读消息并发送邮件的任务
taskManager.registerTask('checkUnreadMessagesAndSendEmail', async () => {
  try {
    console.log('[SCHEDULE] 开始检查未读消息并发送邮件通知...');
    
    // 查询未读且未发送邮件的询价消息
    const sqlQuery = `
      SELECT 
        im.id,
        im.sender_id as sender_id,
        im.content as message,
        im.created_at,
        us.email as sender_email,
        us.username as sender_username,
        ur.id as receiver_id,
        ur.email as receiver_email,
        ur.username as receiver_username,
        i.title as inquiry_title
      FROM inquiry_messages im
      JOIN users us ON im.sender_id = us.id and us.deleted = false
      JOIN inquiries i ON im.inquiry_id = i.id and i.deleted = false
      JOIN users ur on i.created_by = ur.id and ur.deleted = false
      WHERE im.is_read = 0 
        AND im.is_emailed = 0
        AND ur.email IS NOT NULL and ur.email != ''
        AND us.email IS NOT NULL and us.email != ''
        AND im.deleted = false
      ORDER BY im.created_at DESC
    `;
    
    const result = await query(sqlQuery);
    
    if (result.rows.length === 0) {
      console.log('[SCHEDULE] 没有需要发送邮件的未读消息');
      return;
    }
    
    console.log(`[SCHEDULE] 找到 ${result.rows.length} 条未读消息需要发送邮件通知`);
    
    // 按用户分组消息
    const messagesByUser = {};
    result.rows.forEach(row => {
      if (!messagesByUser[row.receiver_id]) {
        messagesByUser[row.receiver_id] = {
          email: row.receiver_email,
          username: row.receiver_username,
          messages: []
        };
      }
      messagesByUser[row.receiver_id].messages.push(row);
    });
    
    // 为每个用户发送邮件
    for (const userId in messagesByUser) {
      const userData = messagesByUser[userId];
      
      try {
        // Generate email content using the dedicated function
        const emailHtml = generateInquiryNotificationEmail(userData.username, userData.messages);
        
        // Send email
        await sendMail(
          userData.email,
          'New Inquiry Message Replies',
          emailHtml
        );
        
        console.log(`[SCHEDULE] 邮件发送成功: ${userData.email} (${userData.messages.length} 条消息)`);
        
        // 更新消息的is_emailed状态
        const messageIds = userData.messages.map(msg => msg.id);
        const updateQuery = `
          UPDATE inquiry_messages 
          SET is_emailed = 1 
          WHERE id = ANY($1)
        `;
        
        await query(updateQuery, [messageIds]);
        console.log(`[SCHEDULE] 已更新 ${messageIds.length} 条消息的邮件发送状态`);
        
      } catch (emailError) {
        console.error(`[SCHEDULE] 发送邮件失败 (用户: ${userData.email}):`, emailError);
      }
    }
    
    console.log('[SCHEDULE] 邮件发送任务完成');
    
  } catch (error) {
    console.error('[SCHEDULE] 检查未读消息任务执行失败:', error);
  }
}, 5 * 60 * 1000); // 每5分钟执行一次

// 启动任务管理器
taskManager.start();
console.log('[SCHEDULE] 定时调度任务已启动');

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('[SCHEDULE] 收到SIGINT信号，正在关闭定时任务...');
  taskManager.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[SCHEDULE] 收到SIGTERM信号，正在关闭定时任务...');
  taskManager.stop();
  process.exit(0);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('[SCHEDULE] 未捕获的异常:', error);
  taskManager.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SCHEDULE] 未处理的Promise拒绝:', reason);
  taskManager.stop();
  process.exit(1);
});

console.log('[SCHEDULE] 定时调度服务已启动，PID:', process.pid);

/**
 * Generate HTML email content for inquiry notification
 * @param {string} username - User's display name
 * @param {Array} messages - Array of message objects
 * @returns {string} HTML email content
 */
function generateInquiryNotificationEmail(username, messages) {
  // Build message list HTML
  const messageList = messages.map(msg => `
    <div style="border-left: 3px solid #007bff; padding-left: 15px; margin: 10px 0;">
      <h4 style="color: #333; margin: 0 0 5px 0;">${msg.inquiry_title}</h4>
      <p style="color: #666; margin: 0 0 5px 0; font-size: 14px;">
        Time: ${new Date(msg.created_at).toLocaleString('en-US')}
      </p>
      <p style="color: #333; margin: 0; line-height: 1.5;">${msg.message}</p>
    </div>
  `).join('');
  
  // Generate complete email HTML
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        New Inquiry Message Replies
      </h2>
      <p style="color: #666; font-size: 16px;">Dear ${username},</p>
      <p style="color: #666; font-size: 14px; line-height: 1.6;">
        You have received new replies to your inquiries on our website. Please check them promptly:
      </p>
      ${messageList}
      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
        <p style="color: #666; font-size: 14px; margin: 0;">
          Please log in to your account to view the complete inquiry details and replies. If you have any questions, please feel free to contact our customer service team.
        </p>
      </div>
      <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
        <p>This email is sent automatically by the system. Please do not reply directly.</p>
      </div>
    </div>
  `;
  
  return emailHtml;
}