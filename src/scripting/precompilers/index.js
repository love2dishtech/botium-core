const util = require('util')
const { isJson } = require('../../helpers/Utils')
const debug = require('debug')('botium-core-Precompilers')

const PROVIDERS = {
  JSON_TO_JSON_JSONPATH: require('./JsonToJson'),
  SCRIPT: require('./Script'),
  MARKDOWN_RASA: require('./MarkdownRasa')
}
const CAPABILITY_PREFIX = 'PRECOMPILERS'
const { flatCababilities } = require('../../helpers/CapabilitiesUtils')

module.exports.execute = (scriptBuffer, options) => {
  const { caps, filename } = options
  const ownCaps = flatCababilities(caps, CAPABILITY_PREFIX)
  if (Buffer.isBuffer(scriptBuffer)) {
    scriptBuffer = scriptBuffer.toString()
  }

  for (const capSuffixAndVal of ownCaps) {
    if (!(capSuffixAndVal.NAME)) {
      debug(`Precompiler name not defined in ${util.inspect(capSuffixAndVal)}`)
      return null
    }
    const provider = PROVIDERS[capSuffixAndVal.NAME]

    if (!provider) {
      throw new Error(`Precompiler ${util.inspect(capSuffixAndVal.NAME)} not found using caps ${util.inspect(capSuffixAndVal)}`)
    }

    const result = provider.precompile(scriptBuffer, capSuffixAndVal, filename)
    if (result) {
      if (!result.scriptBuffer) {
        return null
      }
      result.scriptBuffer = isJson(result.scriptBuffer)
      result.precompiler = capSuffixAndVal.NAME
      // dont let chain the precompilers. It looks more robust
      return result
    }
  }
}
