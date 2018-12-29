const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const path = require('path')
const fs = require('fs-extra')
const IP = require('dev-ip')
const Promise = require('bluebird')
const appConfig = require('./config/index')
const signale = require('signale')
const glob = require('glob')

Promise.promisifyAll(fs)

const devIP = IP()[0]
const root = path.join(__dirname, '../')
const env = process.env.NODE_ENV || 'development'
const srcPath = path.join(root, appConfig.path.src)
const distPath = path.join(root, appConfig.path.dist)
const viewsPath = path.join(root, appConfig.path.views)
const viewsDistPath = path.join(root, appConfig.path.viewsDist)
const vendorConfig = require(path.join(root, `scripts/config/webpack.config.vendor.js`))
const businessConfigPath = path.join(root, `scripts/config/webpack.config.${env}.js`)
const businessConfig = require(businessConfigPath)
const {server: {devPort}} = appConfig

const devClient = [`webpack-dev-server/client?http://${devIP}:${devPort}`]
const publicPath = businessConfig.output.publicPath = `http://${devIP}:${devPort}/`

fs.removeSync(viewsDistPath)

Object.keys(businessConfig.entry).forEach(chunk => {
  let items = Array.isArray(chunk) ? chunk : [chunk]
  businessConfig.entry[chunk] = devClient.concat(['webpack/hot/dev-server', ...items])
})

const vendorCompiler = webpack(vendorConfig)

const compileAPP = (webpackConfig) => {
  const appCompiler = webpack(webpackConfig)

  const server = new WebpackDevServer(appCompiler, {
    quiet: true,
    noInfo: true,
    hot: true,
    inline: true,
    host: '0.0.0.0',
    compress: true,
    disableHostCheck: true,
    publicPath: publicPath,
    contentBase: distPath,
    watchOptions: {
      aggregateTimeout: 300
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    },
  })

  appCompiler.hooks.compile.tap('compile', () => {
    signale.start('webpack compiling...')
  })

  appCompiler.hooks.done.tap('done', (stats) => {
    const time = (stats.endTime - stats.startTime) / 1000

    if(stats.hasErrors()){
      signale.fatal('webpack build error')

      return signale.fatal(stats.toString({
        colors: true,
        timings: false,
        hash: false,
        version: false,
        assets: false,
        reasons: false,
        chunks: false,
        children: false,
        chunkModules: false,
        modules: false
      }))
    }

    const assets = stats.compilation.assets

    Promise.map(Object.keys(assets), (file) => {
      const asset = assets[file]

      if (path.extname(file) === '.ejs') {
        const content = asset.source()
        const absPath = path.join(viewsPath, file)
        let outputPath = absPath.replace('/views', '/_views')

        signale.start(`generating ${outputPath}...`)
        return fs.outputFileAsync(outputPath, content)
      }
    })
    .then(() => {
      signale.success(`webpack build succeed in ${time.toFixed(2)} s`)
    })
    .catch(e => {
      signale.error(e)
    })

  })

  server.listen(devPort, '0.0.0.0', () => {
    signale.success('dev server started')
  })

}

const compileVendors = () => {
  // 开发环境下不打vendors包，但是还会自动调用 DllReferencePlugin，引入 vendors*.js 文件，故先清除掉
  // (猜测是由于 distPath 下存在 vendors-manifest.json 等文件）
  if(env === 'development') return new Promise((resolve, reject) => {
    glob(`${distPath}/vendors*.*`, (err, files) => {
      if (err) return reject(err)
      Promise.all(files.map((file) => {
        return fs.remove(path.join(file))
      }))
        .then(() => resolve(businessConfig))
        .catch(reject)
    })
  });
  signale.start('compiling vendors bundle...')
  return new Promise((resolve, reject) => {
    glob
      .sync('vendors*.js', {cwd: distPath})
      .forEach(file => {
        fs.removeSync(path.join(distPath, file))
      })

    vendorCompiler.run((err, stats) => {
      if(err) {
        return signale.error(err)
      }

      const time = (stats.endTime - stats.startTime) / 1000

      try {
        signale.success(`vendor bundle created in ${time.toFixed(2)}s`)
        businessConfig.plugins.push(new webpack.DllReferencePlugin({
          context: businessConfig.context,
          manifest: path.join(distPath, 'vendors-manifest.json'),
        }))
        resolve(businessConfig)
      }catch(e){
        reject(e)
      }
    })

  })
}

compileVendors()
  .then(conf => {
    compileAPP(conf)
  })
  .catch(e => {
    signale.error(e)
  })


/***
 *
 * publicPath  /dist/
 * proxy  /dist =>   webpack-dev-server
 * `webpack-dev-server/client?http://${devIP}:${devPort}`
 *
 *
 */

