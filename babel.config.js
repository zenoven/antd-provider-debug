const path = require('path')

module.exports = function(api) {
  const env = api.env()

  const config = {
    overrides: [
      {
        test: './app',
        presets: [
          [
            "@babel/env", {
              "targets": {
                "browsers": ["> 1%", "last 2 versions", "ie >= 9"]
              },
              "modules": "commonjs",
              "useBuiltIns": "entry"
            }
          ],
          "@babel/react"
        ],
        plugins: [
          ["module-resolver", {
            "root": path.join(__dirname, './app'),
            "alias": {
              "c": "./components"
            },
          }],
          ["react-hot-loader/babel"],
          ["@babel/plugin-transform-runtime", {

          }],
          env === 'development' && ["dva-hmr"],
          ["import", { "libraryName": "antd", "style": true }],
          "@babel/plugin-proposal-class-properties",
          "transform-es2015-modules-commonjs"
        ].filter(Boolean)
      }
    ]
  }
  return config
}
