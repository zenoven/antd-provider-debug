const webpack = require('webpack')
const path = require('path')
const HTMLWebpackPlugin = require("html-webpack-plugin")
const HappyPack = require('happypack')
const os = require('os')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const appConfig = require('./index')
const root = path.join(__dirname, '../../')
const srcPath = path.join(root, appConfig.path.src)
const distPath = path.join(root, appConfig.path.dist)
const viewsDistPath = path.join(root, appConfig.path.viewsDist)
const viewsPath = path.join(root, appConfig.path.views)
const env = process.env.NODE_ENV || 'development'
// webpack 4 mode只有 production/development/none 其他取值会报错
const mode = env === 'production' ? 'production' : 'development'
const entry = {
  main: './main'
}
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
const entryViewPath = path.join(viewsPath, 'app.ejs')

const config = {
  mode: mode,
  entry: entry,
  context: srcPath,
  devtool: 'cheap-module-source-map',
  output: {
    pathinfo: true,
    filename: '[name].js',
    chunkFilename: '[chunkhash].js',
    publicPath: '/assets/',
    path: distPath
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'happypack/loader',
        options: {
          id: 'js'
        }
      },
      // 项目内源码样式，使用css modules
      {
        test: /\.(less|css)$/,
        exclude: /node_modules/,
        loader: {
          loader: 'happypack/loader',
          options: {
            id: 'style-src'
          }
        }
      },
      // 针对外部依赖样式，不使用css modules
      {
        test: /\.(less|css)$/,
        include: /node_modules/,
        loader: {
          loader: 'happypack/loader',
          options: {
            id: 'style-dependencies'
          }
        }
      },
      // viewsPath 下的 ejs 文件当做 普通HTML处理(因为此处 ejs 只作 node 端模板使用)
      {
        test: /\.ejs$/,
        loader: 'html-loader',
        include: [
          viewsPath
        ],
        exclude: /node-modules/,
      },
      {
        oneOf: [
          {
            test: /\.(gif|png|jpg|jpeg|eot|ttf|svg|woff|ico|icon)/,
            resourceQuery: /\?.*/,
            loader: 'url-loader'
          },
          {
            test: /\.(gif|png|jpg|jpeg|eot|ttf|svg|woff|ico|icon)$/,
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HappyPack({
      id: 'js',
      loaders: [ 'babel-loader' ],
      threadPool: happyThreadPool,
      verbose: true,
      verboseWhenProfiling: true
    }),
    new HappyPack({
      id: 'style-src',
      loaders: [
        {
          loader: 'style-loader',
          options: {

          }
        },
        {
          loader: 'css-loader',
          options: {
            sourceMap: true,
            modules: true,
            import: true,
            localIdentName: '[name]__[local]--[hash:base64:5]',
            importLoaders: 1,
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            config: {
              ctx: {
                cssnext: {},
                cssnano: {},
                autoprefixer: {}
              }
            }
          }
        },
        {
          loader: 'less-loader',
          options: {
            sourceMap: true,
            javascriptEnabled: true
          },
        }
      ],
      threadPool: happyThreadPool,
      verbose: true,
      verboseWhenProfiling: true
    }),
    new HappyPack({
      id: 'style-dependencies',
      loaders: [
        {
          loader: 'style-loader',
          options: {

          }
        },
        {
          loader: 'css-loader',
          options: {
            sourceMap: true,
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            config: {
              ctx: {
                cssnext: {},
                cssnano: {},
                autoprefixer: {}
              }
            }
          }
        },
        {
          loader: 'less-loader',
          options: {
            sourceMap: true,
            javascriptEnabled: true
          },
        }
      ],
      threadPool: happyThreadPool,
      verbose: true,
      verboseWhenProfiling: true
    }),
    new webpack.HotModuleReplacementPlugin(),
    new HTMLWebpackPlugin({
      filename: entryViewPath.replace('/views', '/_views'),
      template: entryViewPath,
      minify: false,
      chunks: entry.app
    }),
    new HtmlWebpackIncludeAssetsPlugin({
      assets: [
        {
          path: '',
          globPath: distPath,
          glob: 'vendors*.js',
        }
      ],
      append: false
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'static',
    //   openAnalyzer: false,
    // }),
  ],

  resolve: {
    modules: [
      srcPath,
      'node_modules'
    ],
    extensions: ['.js', '.jsx', '.json', '.less']
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      maxSize: 0,
      minChunks: 2,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '-',
      name: true,
      cacheGroups: {
        common: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
      }
    }
  }
}

module.exports = config
