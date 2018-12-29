const path = require('path')
const root = path.join(__dirname, '../../')
const env = process.env.NODE_ENV || 'development'
const appConfig = require('./index')
const srcPath = path.join(root, appConfig.path.src)
const distPath = path.join(root, appConfig.path.dist)
const webpack = require('webpack')

module.exports = {
  mode: env === 'development' ? 'development' : 'production',
  entry: {
    vendors: ['@babel/polyfill', 'react', 'react-dom', 'dva', 'bluebird'],
  },
  output: {
    filename: '[name]-[chunkhash].js',
    path: distPath,
    library: '[name]',
  },
  plugins: [new webpack.DllPlugin({
    context: srcPath,
    name: '[name]',
    path: path.join(distPath, '[name]-manifest.json'),
  })]
};
