# Vue Devtools Installation Guide

## Overview
Vue Devtools is a browser extension that provides debugging tools for Vue.js applications. It allows you to inspect your Vue components, view their state, track events, and more.

## Installation Options

### Chrome
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
2. Click "Add to Chrome"
3. After installation, open your Vue application and the Vue panel will appear in Chrome DevTools

### Firefox
1. Visit the [Firefox Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
2. Click "Add to Firefox"
3. After installation, open your Vue application and the Vue panel will appear in Firefox DevTools

### Edge
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
2. Click "Add to Chrome" (Edge supports Chrome extensions)
3. After installation, open your Vue application and the Vue panel will appear in Edge DevTools

## Standalone Electron App
If you prefer not to use a browser extension, you can use the standalone Electron app:

```bash
# Install globally
npm install -g @vue/devtools

# Then launch the app
vue-devtools
```

## Verifying Installation
1. Open your Vue application in the browser
2. Open browser DevTools (F12 or right-click and select "Inspect")
3. Look for the "Vue" tab in the DevTools panel

## Troubleshooting
- Make sure you're using a development build of Vue.js
- If you don't see the Vue panel, try restarting your browser
- Check that the extension is enabled in your browser's extension settings

## Official Repository
For more information, visit the [Vue Devtools GitHub repository](https://github.com/vuejs/devtools-v6)