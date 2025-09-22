/**
 * 第三方登录脚本按需加载工具
 * 用于在需要登录功能的页面动态加载第三方认证脚本
 */

// 记录已加载的脚本，避免重复加载
const loadedScripts = new Set();

/**
 * 动态加载脚本
 * @param {string} src - 脚本URL
 * @param {Object} options - 脚本属性选项
 * @returns {Promise} - 加载完成的Promise
 */
function loadScript(src, options = {}) {
  return new Promise((resolve, reject) => {
    // 如果脚本已经加载过，直接返回
    if (loadedScripts.has(src)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    
    // 设置脚本属性
    Object.keys(options).forEach(key => {
      if (key !== 'src') {
        script[key] = options[key];
      }
    });

    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * 加载Apple Sign In脚本
 * @returns {Promise}
 */
export async function loadAppleSignIn() {
  try {
    await loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js', {
      type: 'text/javascript'
    });
    console.log('Apple Sign In script loaded successfully');
  } catch (error) {
    console.error('Failed to load Apple Sign In script:', error);
    throw error;
  }
}

/**
 * 加载Google Identity Services脚本
 * @returns {Promise}
 */
export async function loadGoogleSignIn() {
  try {
    await loadScript('https://accounts.google.com/gsi/client', {
      async: true,
      defer: true
    });
    console.log('Google Identity Services script loaded successfully');
  } catch (error) {
    console.error('Failed to load Google Identity Services script:', error);
    throw error;
  }
}

/**
 * 加载Facebook SDK脚本
 * @returns {Promise}
 */
export async function loadFacebookSDK() {
  try {
    await loadScript('https://connect.facebook.net/en_US/sdk.js', {
      async: true,
      defer: true,
      crossorigin: 'anonymous'
    });
    console.log('Facebook SDK script loaded successfully');
  } catch (error) {
    console.error('Failed to load Facebook SDK script:', error);
    throw error;
  }
}

/**
 * 加载所有第三方登录脚本
 * @returns {Promise}
 */
export async function loadAllAuthScripts() {
  try {
    await Promise.all([
      loadAppleSignIn(),
      loadGoogleSignIn(),
      loadFacebookSDK()
    ]);
    console.log('All third-party authentication scripts loaded successfully');
  } catch (error) {
    console.error('Failed to load some authentication scripts:', error);
    throw error;
  }
}

/**
 * 检查脚本是否已加载
 * @param {string} src - 脚本URL
 * @returns {boolean}
 */
export function isScriptLoaded(src) {
  return loadedScripts.has(src);
}

/**
 * 获取已加载的脚本列表
 * @returns {Array}
 */
export function getLoadedScripts() {
  return Array.from(loadedScripts);
}