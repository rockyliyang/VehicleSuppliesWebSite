module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  // 禁用生产环境的源映射，提高生产构建性能
  productionSourceMap: false,
  configureWebpack: {
    // 禁用所有node_modules的源映射警告
    module: {
      rules: [
        {
          test: /\.js$/,
          include: /node_modules\/html-entities/,
          use: [
            { loader: 'source-map-loader', options: { filterSourceMappingUrl: () => false } }
          ]
        }
      ]
    }
  }
}