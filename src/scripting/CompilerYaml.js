const YAML = require('yaml')

const CompilerObjectBase = require('./CompilerObjectBase')
module.exports = class CompilerYaml extends CompilerObjectBase {
  constructor (context, caps = {}) {
    super(context, caps)
  }

  Deserialize (sciptData) {
    return YAML.parse(sciptData)
  }
}
