const path = require('path')
const assert = require('chai').assert

const BotDriver = require('../../../').BotDriver
const Capabilities = require('../../../').Capabilities

const answers = [
  {
    input: ['buy without variables'],
    output: 'you want to buy productNameFormBegin'
  }
]

const scriptedConnector = ({ queueBotSays }) => {
  return {
    UserSays (msg) {
      let response
      const answer = answers.find((a) => a.input.indexOf(msg.messageText) >= 0)
      if (answer) {
        response = answer.output
      } else {
        response = `You said: ${msg.messageText}`
      }

      const botMsg = { sender: 'bot', sourceData: msg.sourceData, messageText: response }
      queueBotSays(botMsg)
    }
  }
}

describe('scripting.scriptingmemory.memoryenabled.originalkept', function () {
  beforeEach(async function () {
    const myCaps = {
      [Capabilities.PROJECTNAME]: 'scripting.scriptingmemory',
      [Capabilities.CONTAINERMODE]: scriptedConnector,
      [Capabilities.SCRIPTING_XLSX_SHEETNAMES_SCRIPTING_MEMORY]: 'ScriptingMemory',
      [Capabilities.SCRIPTING_XLSX_SHEETNAMES]: 'Convos',
      [Capabilities.SCRIPTING_ENABLE_MEMORY]: true,
      [Capabilities.SCRIPTING_MEMORYEXPANSION_DELORIG]: false

    }
    const driver = new BotDriver(myCaps)
    this.compiler = driver.BuildCompiler()
    this.container = await driver.Build()
  })
  afterEach(async function () {
    this.container && await this.container.Clean()
  })

  it('Original convo kept', async function () {
    this.compiler.ReadScriptsFromDirectory(path.resolve(__dirname, 'convosSimple'))
    this.compiler.ExpandScriptingMemoryToConvos()
    assert.equal(this.compiler.convos.length, 2)
  })
})

describe('scripting.scriptingmemory.memorydisabled', function () {
  beforeEach(async function () {
    const myCaps = {
      [Capabilities.PROJECTNAME]: 'scripting.scriptingmemory',
      [Capabilities.CONTAINERMODE]: scriptedConnector,
      [Capabilities.SCRIPTING_XLSX_SHEETNAMES_SCRIPTING_MEMORY]: 'ScriptingMemory',
      [Capabilities.SCRIPTING_XLSX_SHEETNAMES]: 'Convos',
      [Capabilities.SCRIPTING_ENABLE_MEMORY]: false

    }
    const driver = new BotDriver(myCaps)
    this.compiler = driver.BuildCompiler()
    this.container = await driver.Build()
  })
  afterEach(async function () {
    this.container && await this.container.Clean()
  })

  it('scripting disabled, variable not replaced', async function () {
    this.compiler.ReadScriptsFromDirectory(path.resolve(__dirname, 'convosSimple'))
    this.compiler.ExpandScriptingMemoryToConvos()
    assert.equal(this.compiler.convos.length, 1)

    const transcript = await this.compiler.convos[0].Run(this.container)
    assert.isObject(transcript.scriptingMemory)
    assert.notExists(transcript.scriptingMemory['$productName'])
  })
})

describe('scripting.scriptingmemory.memoryenabled.originaldeleted', function () {
  beforeEach(async function () {
    const myCaps = {
      [Capabilities.PROJECTNAME]: 'scripting.scriptingmemory',
      [Capabilities.CONTAINERMODE]: scriptedConnector,
      [Capabilities.SCRIPTING_XLSX_SHEETNAMES_SCRIPTING_MEMORY]: 'ScriptingMemory',
      [Capabilities.SCRIPTING_XLSX_SHEETNAMES]: 'Convos',
      [Capabilities.SCRIPTING_ENABLE_MEMORY]: true,
      [Capabilities.SCRIPTING_MEMORYEXPANSION_DELORIG]: true
    }
    const driver = new BotDriver(myCaps)
    this.compiler = driver.BuildCompiler()
    this.container = await driver.Build()
  })
  afterEach(async function () {
    this.container && await this.container.Clean()
  })

  it('Set Scripting memory by convo vs by scripting memory file', async function () {
    // scripting memory file wins, log on console
    this.compiler.ReadScriptsFromDirectory(path.resolve(__dirname, 'convosLogicHookCollision'))
    this.compiler.ExpandScriptingMemoryToConvos()
    assert.equal(this.compiler.convos.length, 1)

    const transcript = await this.compiler.convos[0].Run(this.container)
    assert.isObject(transcript.scriptingMemory)
    assert.isDefined(transcript.scriptingMemory['$productName'])
    assert.equal(transcript.scriptingMemory['$productName'], 'Wiener Schnitzel')
  })

  it('one scritping memory file, two colums', async function () {
    // variations are hardcoded into table
    this.compiler.ReadScriptsFromDirectory(path.resolve(__dirname, 'convosOneTable'))
    this.compiler.ExpandScriptingMemoryToConvos()
    assert.equal(this.compiler.convos.length, 4)

    for (let convo of this.compiler.convos) {
      const transcript = await convo.Run(this.container)
      assert.isObject(transcript.scriptingMemory)
      assert.isDefined(transcript.scriptingMemory['$productName'])
    }
  })

  it('two scritping memory file, one colum each', async function () {
    // all variations are generated
    this.compiler.ReadScriptsFromDirectory(path.resolve(__dirname, 'convosTwoTables'))
    this.compiler.ExpandScriptingMemoryToConvos()
    assert.equal(this.compiler.convos.length, 4)

    for (let convo of this.compiler.convos) {
      const transcript = await convo.Run(this.container)
      assert.isObject(transcript.scriptingMemory)
      assert.isDefined(transcript.scriptingMemory['$productName'])
    }
  })

  it('Value is optional in the scripting memory file', async function () {
    // all variations are generated
    this.compiler.ReadScriptsFromDirectory(path.resolve(__dirname, 'convosValueOptional'))
    this.compiler.ExpandScriptingMemoryToConvos()
    assert.equal(this.compiler.convos.length, 1)

    const transcript = await this.compiler.convos[0].Run(this.container)
    assert.isObject(transcript.scriptingMemory)
    assert.isDefined(transcript.scriptingMemory['$productName'])
    assert.notExists(transcript.scriptingMemory['$customerName'])
  })
  it('Same variable in more files -> error', async function () {
    try {
      // assert.throws did not worked to me
      this.compiler.ReadScriptsFromDirectory(path.resolve(__dirname, 'convosMerging'))
      throw (new Error('ReadScriptsFromDirectory had to throw error'))
    } catch (ex) {
      assert.equal(ex.toString(), 'Error: Variable name defined in multiple scripting memory files: productGroup1.xlsx and productGroup2.xlsx')
    }
  })
})
