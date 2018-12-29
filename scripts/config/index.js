const fs = require('fs-extra')
const yaml = require('js-yaml')
const path = require('path')

const filePath = path.join(__dirname, 'app.yml')
const appConfig = yaml.safeLoad(fs.readFileSync(filePath))

module.exports = appConfig
