import { discoverBlogrolls } from './blogrolls/index.js'
import { discoverFavicons } from './favicons/index.js'
import { discoverFeeds } from './feeds/index.js'
import { discoverHubs } from './hubs/discover/index.js'

const commands = ['feeds', 'blogrolls', 'favicons', 'hubs'] as const

type Command = (typeof commands)[number]

const help = `Usage: feedscout <command> <url> [options]

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

const parseArgs = (argv: Array<string>) => {
  const flags: Record<string, string | true> = {}
  const positional: Array<string> = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]

      if (next && !next.startsWith('-')) {
        flags[key] = next
        i++
      } else {
        flags[key] = true
      }
    } else if (arg.startsWith('-')) {
      flags[arg.slice(1)] = true
    } else {
      positional.push(arg)
    }
  }

  return { flags, positional }
}

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

const run = async () => {
  const { flags, positional } = parseArgs(process.argv.slice(2))

  if (flags.help || flags.h || positional.length === 0) {
    console.log(help)
    return
  }

  const [command, url] = positional

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

  const options: Record<string, unknown> = {}

  if (typeof flags.methods === 'string') {
    options.methods = flags.methods.split(',')
  }

  if (typeof flags.concurrency === 'string') {
    options.concurrency = Number(flags.concurrency)
  }

  if (flags['stop-on-first']) {
    options.stopOnFirstResult = true
  }

  if (flags['stop-on-first-method']) {
    options.stopOnFirstMethod = true
  }

  if (flags['include-invalid']) {
    options.includeInvalid = true
  }

  // Show progress on stderr when running in a terminal.
  if (process.stderr.isTTY) {
    options.onProgress = (progress: {
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

  const discover = discoverers[command as Command]
  const results = await discover(url, options)

  // Clear progress line.
  if (process.stderr.isTTY) {
    process.stderr.write('\r\x1b[K')
  }

  console.log(JSON.stringify(results, replacer, 2))
}

run().catch((error: Error) => {
  if (process.stderr.isTTY) {
    process.stderr.write('\r\x1b[K')
  }

  console.error(error.message)
  process.exitCode = 1
})
