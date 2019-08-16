const BotiumError = require('../../BotiumError')
const jsonPath = require('jsonpath')

module.exports = class JsonPathAsserter {
  constructor (context, caps = {}) {
    this.context = context
    this.caps = caps
  }

  assertConvoStep ({ convo, convoStep, args, botMsg }) {
    const rawBotResponse = botMsg.sourceData
    const path = args[0]
    const expected = args[1]
    const actual = jsonPath.query(rawBotResponse, path)
    if (expected && !this.context.Match(actual, expected)) {
      return Promise.reject(new BotiumError(`${convoStep.stepTag}: Expected element ${expected} in jsonPath ${path}"`,
        {
          type: 'asserter',
          source: 'JsonPathAsserter',
          context: {
            // effective arguments getting from constructor
            constructor: {},
            params: {
              args,
              botMsg
            }
          },
          cause: `Expected: ${expected} not equals Actual: ${actual}`
        }
      ))
    }

    if (!actual) {
      return Promise.reject(new BotiumError(`${convoStep.stepTag}: Could not find any element in jsonPath ${path}"`,
        {
          type: 'asserter',
          source: 'JsonPathAsserter',
          context: {
            // effective arguments getting from constructor
            constructor: {},
            params: {
              args,
              botMsg
            }
          },
          cause: `No element in path ${path}`
        }
      ))
    }
    return Promise.resolve()
  }
}
