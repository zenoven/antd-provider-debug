/**
 * Created by zenoven@2018/5/17 15:39
 */
const webpack = require('webpack')
const path = require('path')
const fs = require('fs-extra')
const IP = require('dev-ip')
const Promise = require('bluebird')
const appConfig = require('./config/index')
const signale = require('signale')

const root = path.join(__dirname, '../')
const distPath = path.join(root, appConfig.path.dist)
const viewsDistPath = path.join(root, appConfig.path.viewsDist)

Promise.promisifyAll(fs)

let env = process.env.NODE_ENV || 'development'
let envMap  = {
  development: ['dev', 'development'],
  test: ['test', 'pre'],  // 预发环境同测试环境处理
  production: ['online', 'netease', 'production']
}

env = Object.keys(envMap).find(e => envMap[e].includes(env))

if(!env) {
  signale.error('env not configured or wrong env, please set NODE_ENV before build process.')
  process.exit(0)
}

signale.start(`start compiling with env:${env}`)

const devIP = IP()[0]
const businessConfigPath = path.join(root, `scripts/config/webpack.config.${env}.js`)
const vendorConfig = require(path.join(root, `scripts/config/webpack.config.vendor.js`))
const businessConfig = require(businessConfigPath)
const { server: { devPort } } = appConfig

let start = Date.now()
Promise
  .resolve()
  .then(() => {
    // 文件清理
    return Promise.all([
      fs.removeAsync(distPath),
      fs.removeAsync(viewsDistPath),
    ])
  })
  .then(() => {
    signale.start('webpack building vendors bundle...')

    return new Promise((resolve, reject) => {
      webpack(vendorConfig, (err, stats) => {
        if (err || stats.hasErrors()) {
          signale.info(stats.toString({
            colors: true,
            timings: true,
            hash: true,
            version: true,
            errorDetails: true,
            assets: false,
            chunks: false,
            children: false,
            modules: false,
            chunkModules: false
          }))
          return reject(err)
        }
        let duration = (stats.endTime - stats.startTime) / 1000
        signale.success(`webpack build vendors bundle successfully in ${duration.toFixed(2)}s`)
        resolve(stats)
      })
    })
  })
  .then((stats) => {
    // build
    signale.start('webpack building business bundle...')

    // if (env === 'development') {
    //   businessConfig.output.publicPath = `http://${devIP}:${devPort}/`
    // }

    let filePath = stats && stats.compilation && stats.compilation.assets ?
      Object.keys(stats.compilation.assets)[0] : ''
    let name = path.basename(filePath, '.js')

    if (!name) return Promise.reject()

    businessConfig.plugins.push(new webpack.DllReferencePlugin({
      context: businessConfig.context,
      manifest: path.join(distPath, 'vendors-manifest.json'),
    }))

    return new Promise((resolve, reject) => {

      webpack(businessConfig, (err, stats) => {
        if (err || stats.hasErrors()) {
          signale.info(stats.toString({
            colors: true,
            timings: true,
            hash: true,
            version: true,
            errorDetails: true,
            assets: false,
            chunks: false,
            children: false,
            modules: false,
            chunkModules: false
          }))
          return reject(err)
        }
        let duration = (stats.endTime - stats.startTime) / 1000
        signale.success(`webpack build business bundle successfully in ${duration.toFixed(2)}s`)
        resolve()
      })
    })
  })
  .then(() => {
    let duration = (Date.now() - start) / 1000
    signale.success(`compile done in ${duration.toFixed(2)}s`)
  })
  .catch(e => {
    signale.fatal(e)
    process.exit(1)
  })
