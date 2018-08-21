'use strict'

const glob = require('glob')
const DtsCreator = require('typed-css-modules')
const sass = require('node-sass')

class GenerateStyleTypingsPlugin {
  constructor(srcPath) {
    this.srcPath = srcPath
    this.creator = new DtsCreator();
  }

  apply(compiler) {
    compiler.plugin('before-compile', (_, callback) => {
      return this
        .generateStyleTypings(this.srcPath)
        .then(() => callback());
    });
  }

  handleCssFile(path, fileContent) {
    return this.creator
      .create(path, fileContent)
      .then(content => content.writeFile())
      .catch(error => { throw new Error(`path: ${path}, error: ${error}`) });
  }

  handleSassFile(path) {
    return new Promise((resolve, reject) => {
      sass.render({ file: path }, (err, result) => {
        if (err) {
          reject(err)
        }
        resolve(result)
      })
    })
      .then(result => this.handleCssFile(path, result.css))
  }

  generateStyleTypings() {
    const promises = []
    glob
      .sync(this.srcPath + '/**/*.{sass,scss,css}', {})
      .forEach(filePath => {
        if (filePath.endsWith('sass') || filePath.endsWith('scss')) {
          promises.push(this.handleSassFile(filePath))
        } else {
          promises.push(this.handleCssFile(filePath))
        }
      })
    return Promise.all(promises)
  }
}

module.exports = GenerateStyleTypingsPlugin
