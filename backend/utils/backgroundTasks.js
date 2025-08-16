class BackgroundTaskManager {
  constructor() {
    this.tasks = new Map();
    this.intervals = new Map();
    this.isRunning = false;
  }

  /**
   * 注册一个后台任务
   * @param {string} name - 任务名称
   * @param {Function} action - 要执行的函数
   * @param {number} intervalMs - 执行间隔（毫秒）
   * @param {boolean} runImmediately - 是否立即执行一次
   */
  registerTask(name, action, intervalMs, runImmediately = false) {
    console.log(`Registering background task: ${name} (interval: ${intervalMs}ms)`);
    
    this.tasks.set(name, {
      action,
      intervalMs,
      runImmediately,
      lastRun: null,
      errorCount: 0
    });
  }

  /**
   * 启动所有后台任务
   */
  start() {
    if (this.isRunning) {
      console.log('Background tasks are already running');
      return;
    }

    console.log('Starting background tasks...');
    this.isRunning = true;

    for (const [name, task] of this.tasks) {
      this.startTask(name, task);
    }
  }

  /**
   * 启动单个任务
   */
  startTask(name, task) {
    const { action, intervalMs, runImmediately } = task;

    // 包装任务执行函数，添加错误处理和日志
    const wrappedAction = async () => {
      try {
        console.log(`Executing background task: ${name}`);
        await action();
        task.lastRun = new Date();
        task.errorCount = 0;
        console.log(`Background task completed: ${name}`);
      } catch (error) {
        task.errorCount++;
        console.error(`Background task failed: ${name}`, error);
        
        // 如果连续失败次数过多，暂停任务
        if (task.errorCount >= 5) {
          console.error(`Background task ${name} failed too many times, stopping...`);
          this.stopTask(name);
        }
      }
    };

    // 如果需要立即执行
    if (runImmediately) {
      wrappedAction();
    }

    // 设置定时执行
    const intervalId = setInterval(wrappedAction, intervalMs);
    this.intervals.set(name, intervalId);
    
    console.log(`Background task started: ${name}`);
  }

  /**
   * 停止单个任务
   */
  stopTask(name) {
    const intervalId = this.intervals.get(name);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(name);
      console.log(`Background task stopped: ${name}`);
    }
  }

  /**
   * 停止所有后台任务
   */
  stop() {
    console.log('Stopping all background tasks...');
    
    for (const name of this.intervals.keys()) {
      this.stopTask(name);
    }
    
    this.isRunning = false;
    console.log('All background tasks stopped');
  }

  /**
   * 获取任务状态
   */
  getTaskStatus() {
    const status = {};
    for (const [name, task] of this.tasks) {
      status[name] = {
        lastRun: task.lastRun,
        errorCount: task.errorCount,
        isRunning: this.intervals.has(name)
      };
    }
    return status;
  }
}

module.exports = {
  BackgroundTaskManager
};