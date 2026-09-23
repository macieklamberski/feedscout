import { type ParseArgsConfig, parseArgs } from 'node:util'
import { methods as blogrollsMethods } from '../blogrolls/config.js'
import { discoverBlogrolls } from '../blogrolls/index.js'
import type { DiscoverOnProgressFn, DiscoverOptions } from '../common/types.js'
import { methods as faviconsMethods } from '../favicons/config.js'
import { discoverFavicons } from '../favicons/index.js'
import { methods as feedsMethods } from '../feeds/config.js'
import { discoverFeeds } from '../feeds/index.js'
import { methods as hubsMethods } from '../hubs/discover/config.js'
import { discoverHubs } from '../hubs/discover/index.js'

type SharedOptions = Pick<
  DiscoverOptions<unknown>,
  'concurrency' | 'stopOnFirstResult' | 'stopOnFirstMethod' | 'includeInvalid' | 'onProgress'
>

export const options = {
  methods: { type: 'string' },
  concurrency: { type: 'string' },
  'stop-on-first': { type: 'boolean' },
  'stop-on-first-method': { type: 'boolean' },
  'include-invalid': { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
} as const satisfies ParseArgsConfig['options']

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

const commandMethods = {
  feeds: feedsMethods,
  blogrolls: blogrollsMethods,
  favicons: faviconsMethods,
  hubs: hubsMethods,
}

type Command = keyof typeof commandMethods

const hubsIgnoredFlags: Array<keyof typeof options> = [
  'concurrency',
  'stop-on-first',
  'stop-on-first-method',
  'include-invalid',
]

const isCommand = (value: string): value is Command => {
  return Object.hasOwn(commandMethods, value)
}

const parseMethods = <TMethod extends string>(
  value: string | undefined,
  allowed: ReadonlyArray<TMethod>,
): Array<TMethod> | undefined => {
  if (value === undefined) {
    return
  }

  const methods = value.split(',')

  for (const method of methods) {
    if (!allowed.includes(method as TMethod)) {
      throw new Error(`Unknown method: ${method}. Allowed: ${allowed.join(', ')}`)
    }
  }

  return methods as Array<TMethod>
}

const parseConcurrency = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return
  }

  const concurrency = Number(value)

  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('--concurrency must be a positive integer')
  }

  return concurrency
}

const writeProgress: DiscoverOnProgressFn = (progress) => {
  process.stderr.write(
    `\r\x1b[K[${progress.tested}/${progress.total}] ${progress.found} found — ${progress.current}`,
  )
}

const clearProgress = () => {
  if (process.stderr.isTTY) {
    process.stderr.write('\r\x1b[K')
  }
}

const replacer = (_key: string, value: unknown) => {
  if (value instanceof Error) {
    return value.message
  }

  return value
}

const discoverCommand = (
  command: Command,
  url: string,
  methods: string | undefined,
  sharedOptions: SharedOptions,
): Promise<unknown> => {
  switch (command) {
    case 'feeds': {
      return discoverFeeds(url, {
        ...sharedOptions,
        methods: parseMethods(methods, feedsMethods),
      })
    }

    case 'blogrolls': {
      return discoverBlogrolls(url, {
        ...sharedOptions,
        methods: parseMethods(methods, blogrollsMethods),
      })
    }

    case 'favicons': {
      return discoverFavicons(url, {
        ...sharedOptions,
        methods: parseMethods(methods, faviconsMethods),
      })
    }

    case 'hubs': {
      return discoverHubs(url, {
        methods: parseMethods(methods, hubsMethods),
      })
    }
  }
}

const discover = async (args: Array<string>) => {
  const { values, positionals } = parseArgs({
    args,
    options,
    allowPositionals: true,
  })

  if (values.help || positionals.length === 0) {
    console.log(help)
    return
  }

  const [command, url, ...extra] = positionals

  if (!isCommand(command)) {
    console.error(`Unknown command: ${command}\n\n${help}`)
    process.exitCode = 1
    return
  }

  if (!url) {
    console.error(`URL is required\n\n${help}`)
    process.exitCode = 1
    return
  }

  if (extra.length > 0) {
    console.error(`Unexpected argument: ${extra[0]}\n\n${help}`)
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

  const sharedOptions: SharedOptions = {
    concurrency: parseConcurrency(values.concurrency),
    stopOnFirstResult: values['stop-on-first'],
    stopOnFirstMethod: values['stop-on-first-method'],
    includeInvalid: values['include-invalid'],
    onProgress: process.stderr.isTTY ? writeProgress : undefined,
  }

  const results = await discoverCommand(command, url, values.methods, sharedOptions)

  clearProgress()
  console.log(JSON.stringify(results, replacer, 2))
}

export const run = async (args = process.argv.slice(2)) => {
  try {
    await discover(args)
  } catch (error) {
    clearProgress()
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
