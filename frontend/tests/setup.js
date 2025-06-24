import { config } from '@vue/test-utils'

// 全局配置
config.global.mocks = {
  $t: key => key,
  $tc: key => key,
  $message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  },
  $api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    getWithErrorHandler: jest.fn(),
    postWithErrorHandler: jest.fn()
  },
  $store: {
    getters: {
      isLoggedIn: false,
      'language/translate': jest.fn()
    },
    dispatch: jest.fn(),
    commit: jest.fn()
  },
  $router: {
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  },
  $route: {
    path: '/',
    params: {},
    query: {},
    hash: '',
    fullPath: '/'
  },
  $bus: {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  },
  $messageHandler: {
    confirm: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn()
  }
}

// 全局插件配置
config.global.plugins = []

// 设置全局存根
config.global.stubs = {
  'router-link': true,
  'router-view': true
}