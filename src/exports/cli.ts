import { type ParseArgsConfig, parseArgs } from 'node:util'
import { discoverBlogrolls } from '../blogrolls/index.js'
import { discoverFavicons } from '../favicons/index.js'
import { discoverFeeds } from '../feeds/index.js'
import { discoverHubs } from '../hubs/discover/index.js'

const commands = ['feeds', 'blogrolls', 'favicons', 'hubs'] as const

type Command = (typeof commands)[number]

export const options: ParseArgsConfig['options'] = {
  methods: { type: 'string' },
  concurrency: { type: 'string' },
  'stop-on-first': { type: 'boolean' },
  'stop-on-first-method': { type: 'boolean' },
  'include-invalid': { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
}

export const help = `Usage: feedscout <command> <url> [options]

Commands:
  feeds       Discover feeds
  blogrolls   Discover blogrolls
  favicons    Discover favicons
  hubs        Discover hubs

Options:
  --methods <list>       Comma-separated methods
  --concurrency <n>      Max parallel validations
  --stop-on-first        Stop after first valid result
  --stop-on-first-method Stop after first method with results
  --include-invalid      Include invalid results
  -h, --help             Show help`

const hubsIgnoredFlags = ['concurrency', 'stop-on-first', 'stop-on-first-method', 'include-invalid']

const replacer = (_key: string, value: unknown) => {
  if (value instanceof Error) {
    return value.message
  }

  return value
}

// biome-ignore lint/suspicious/noExplicitAny: CLI bridges dynamic flags to typed functions.
const discoverers: Record<Command, (url: string, options?: any) => Promise<unknown>> = {
  feeds: discoverFeeds,
  blogrolls: discoverBlogrolls,
  favicons: discoverFavicons,
  hubs: discoverHubs,
}

const clearProgress = () => {
  if (process.stderr.isTTY) {
    process.stderr.write('\r\x1b[K')
  }
}

const discover = async () => {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options,
    allowPositionals: true,
    strict: true,
  })

  if (values.help || positionals.length === 0) {
    console.log(help)
    return
  }

  const [command, url] = positionals

  if (!commands.includes(command as Command)) {
    console.error(`Unknown command: ${command}\n\n${help}`)
    process.exitCode = 1
    return
  }

  if (!url) {
    console.error(`URL is required\n\n${help}`)
    process.exitCode = 1
    return
  }

  if (command === 'hubs') {
    for (const flag of hubsIgnoredFlags) {
      if (values[flag] !== undefined) {
        console.error(`Ignoring --${flag}: not supported by hubs`)
      }
    }
  }

  const discoverOptions: Record<string, unknown> = {}

  if (typeof values.methods === 'string') {
    discoverOptions.methods = values.methods.split(',')
  }

  if (typeof values.concurrency === 'string') {
    const concurrency = Number(values.concurrency)

    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new Error('--concurrency must be a positive integer')
    }

    discoverOptions.concurrency = concurrency
  }

  if (values['stop-on-first']) {
    discoverOptions.stopOnFirstResult = true
  }

  if (values['stop-on-first-method']) {
    discoverOptions.stopOnFirstMethod = true
  }

  if (values['include-invalid']) {
    discoverOptions.includeInvalid = true
  }

  if (process.stderr.isTTY) {
    discoverOptions.onProgress = (progress: {
      tested: number
      total: number
      found: number
      current: string
    }) => {
      process.stderr.write(
        `\r\x1b[K[${progress.tested}/${progress.total}] ${progress.found} found — ${progress.current}`,
      )
    }
  }

  const results = await discoverers[command as Command](url, discoverOptions)

  clearProgress()
  console.log(JSON.stringify(results, replacer, 2))
}

export const run = async () => {
  try {
    await discover()
  } catch (error) {
    clearProgress()
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
