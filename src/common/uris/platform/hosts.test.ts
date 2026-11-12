import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defaultPlatformOptions as faviconPlatformOptions } from '../../../favicons/defaults.js'
import { defaultPlatformOptions as feedPlatformOptions } from '../../../feeds/defaults.js'
import { plurkHandler } from '../../../feeds/platforms/plurk.js'
import { selectHostHandlers } from './hosts.js'
import type { PlatformHandler } from './types.js'

const createHandler = (hosts?: Array<string>): PlatformHandler => {
  return {
    hosts,
    match: () => false,
    resolve: () => [],
  }
}

const srcDirectory = join(import.meta.dir, '../../..')
const urlRegex = /https?:\/\/[^\s'"`<>\\]+/g

const readTestUrls = (): Array<string> => {
  const urls = new Set<string>()

  for (const path of new Bun.Glob('**/*.test.ts').scanSync(srcDirectory)) {
    for (const [url] of readFileSync(join(srcDirectory, path), 'utf8').matchAll(urlRegex)) {
      if (URL.canParse(url)) {
        urls.add(url)
      }
    }
  }

  return [...urls]
}

const findHostViolations = (handlers: Array<PlatformHandler>, urls: Array<string>) => {
  const violations: Array<string> = []

  for (const handler of handlers) {
    if (!handler.hosts) {
      continue
    }

    for (const url of urls) {
      let isMatch = false

      try {
        isMatch = handler.match(url)
      } catch {}

      if (isMatch && selectHostHandlers([handler], url).length === 0) {
        violations.push(`${handler.hosts.join(',')} ${url}`)
      }
    }
  }

  return violations
}

describe('selectHostHandlers', () => {
  it('should return a handler without hosts for any URL', () => {
    const handler = createHandler()
    const value = 'https://example.com/alice'
    const expected = [handler]

    expect(selectHostHandlers([handler], value)).toEqual(expected)
  })

  it('should return a handler whose hosts hold the hostname', () => {
    const handler = createHandler(['example.com'])
    const value = 'https://example.com/alice'
    const expected = [handler]

    expect(selectHostHandlers([handler], value)).toEqual(expected)
  })

  it('should return a handler whose hosts hold a domain above the hostname', () => {
    const handler = createHandler(['example.com'])
    const value = 'https://alice.blog.example.com/'
    const expected = [handler]

    expect(selectHostHandlers([handler], value)).toEqual(expected)
  })

  it('should skip a handler whose hosts only end like the hostname', () => {
    const handler = createHandler(['example.com'])
    const value = 'https://myexample.com/alice'

    expect(selectHostHandlers([handler], value)).toEqual([])
  })

  it('should skip a handler whose hosts sit below the hostname', () => {
    const handler = createHandler(['blog.example.com'])
    const value = 'https://example.com/alice'

    expect(selectHostHandlers([handler], value)).toEqual([])
  })

  it('should keep the handlers in their order', () => {
    const first = createHandler(['example.com'])
    const second = createHandler()
    const third = createHandler(['blog.example.com'])
    const fourth = createHandler(['example.org'])
    const value = 'https://blog.example.com/alice'
    const expected = [first, second, third]

    expect(selectHostHandlers([first, second, third, fourth], value)).toEqual(expected)
  })

  it('should return every handler whose hosts share the hostname', () => {
    const first = createHandler(['example.com'])
    const second = createHandler(['example.com'])
    const value = 'https://example.com/alice'
    const expected = [first, second]

    expect(selectHostHandlers([first, second], value)).toEqual(expected)
  })

  it('should return a handler once when several of its hosts hold the hostname', () => {
    const handler = createHandler(['example.com', 'blog.example.com'])
    const value = 'https://blog.example.com/alice'
    const expected = [handler]

    expect(selectHostHandlers([handler], value)).toEqual(expected)
  })

  it('should read a hostname with a trailing dot', () => {
    const handler = createHandler(['example.com'])
    const value = 'https://example.com./alice'
    const expected = [handler]

    expect(selectHostHandlers([handler], value)).toEqual(expected)
  })

  it('should read hosts in any case and in Unicode', () => {
    const handler = createHandler(['Bücher.Example'])
    const value = 'https://xn--bcher-kva.example/alice'
    const expected = [handler]

    expect(selectHostHandlers([handler], value)).toEqual(expected)
  })

  it('should read a handler added to the array after a call', () => {
    const handlers = [createHandler(['example.org'])]
    const handler = createHandler(['example.com'])
    const value = 'https://example.com/alice'
    const expected = [handler]

    selectHostHandlers(handlers, value)
    handlers.push(handler)

    expect(selectHostHandlers(handlers, value)).toEqual(expected)
  })
})

// A handler whose hosts miss a host its match takes would lose that host's pages, so every URL in
// the test files a handler matches has to sit inside its hosts.
describe('default platform handler hosts', () => {
  const urls = readTestUrls()

  it('should report a test URL a handler matches outside its hosts', () => {
    const handler: PlatformHandler = { ...plurkHandler, hosts: ['www.plurk.com'] }
    const value = ['https://plurk.com/alice', 'https://www.plurk.com/alice']
    const expected = ['www.plurk.com https://plurk.com/alice']

    expect(findHostViolations([handler], value)).toEqual(expected)
  })

  it('should report no test URL when the hosts hold every URL a handler matches', () => {
    const handler: PlatformHandler = { ...plurkHandler, hosts: ['plurk.com'] }
    const value = ['https://plurk.com/alice', 'https://www.plurk.com/alice']

    expect(findHostViolations([handler], value)).toEqual([])
  })

  it('should hold every test URL a feed handler matches', () => {
    expect(urls.length).toBeGreaterThan(0)
    expect(findHostViolations(feedPlatformOptions.handlers, urls)).toEqual([])
  })

  it('should hold every test URL a favicon handler matches', () => {
    expect(urls.length).toBeGreaterThan(0)
    expect(findHostViolations(faviconPlatformOptions.handlers, urls)).toEqual([])
  })
})
