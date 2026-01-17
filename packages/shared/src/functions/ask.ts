import { log, spinner } from '@clack/prompts'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { i18n } from '../i18n'

function cleanSchema (schema: any): any {
  if (typeof schema !== 'object' || schema === null) {
    return schema
  }

  const { $schema, additionalProperties, ...rest } = schema

  if (rest.properties) {
    for (const key in rest.properties) {
      rest.properties[key] = cleanSchema(rest.properties[key])
    }
  }

  if (rest.items) {
    rest.items = cleanSchema(rest.items)
  }

  return rest
}

export async function askVuetify (question: string, apiKey: string, raw?: boolean, modelName = 'gemini-2.5-flash') {
  const s = spinner()
  if (!raw) {
    s.start(i18n.t('spinners.ask.connecting'))
  }

  let transport: StdioClientTransport | null = null

  try {
    // 1. Setup MCP
    transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@vuetify/mcp'],
      stderr: 'pipe',
    })

    transport.stderr?.on('data', data => {
      if (!data.toString().includes('Welcome to the Vuetify MCP Server')) {
        process.stderr.write(data)
      }
    })

    const mcpClient = new Client({ name: 'vuetify-cli', version: '1.0.0' }, { capabilities: {} })

    await mcpClient.connect(transport)

    const availableTools = await mcpClient.listTools()

    // 2. Setup Gemini with Tools
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: modelName,
      tools: [{
        functionDeclarations: availableTools.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: cleanSchema(tool.inputSchema),
        })),
      }],
    })

    if (!raw) {
      s.message(i18n.t('spinners.ask.generating'))
    }

    const chat = model.startChat()

    // Initial system instruction + user question
    let result = await chat.sendMessage(`
      You are a Vuetify 3 assistant.
      User question: "${question}"
      
      Use the available tools to look up Vuetify component specifications when needed.
      If you have enough data, provide a concise answer with Vue 3 Composition API code.
    `)

    // 3. Tool execution loop
    while (result.response.functionCalls()) {
      const calls = result.response.functionCalls()
      if (!calls) {
        break
      }

      if (!raw) {
        s.message(`Calling tools: ${calls.map(c => c.name).join(', ')}...`)
      }

      const toolOutputs = []

      for (const call of calls) {
        try {
          const mcpResult = await mcpClient.callTool({
            name: call.name,
            arguments: call.args as any,
          })

          toolOutputs.push({
            functionResponse: {
              name: call.name,
              response: { content: mcpResult.content },
            },
          })
        } catch (error) {
          toolOutputs.push({
            functionResponse: {
              name: call.name,
              response: { error: String(error) },
            },
          })
        }
      }

      if (!raw) {
        s.message(i18n.t('spinners.ask.generating'))
      }
      result = await chat.sendMessage(toolOutputs)
    }

    if (!raw) {
      s.stop(i18n.t('spinners.ask.done'))
    }

    const responseText = result.response.text()

    console.log(responseText)

    // @ts-ignore
    if (transport) {
      await transport.close()
    }
  } catch (error) {
    if (raw) {
      console.error(String(error))
    } else {
      s.stop(i18n.t('spinners.ask.error'))
      log.error(String(error))
    }
    // Make sure we close transport on error too
    try {
      // @ts-ignore
      if (transport) {
        await transport.close()
      }
    } catch {
    // ignore
    }
  }
}
