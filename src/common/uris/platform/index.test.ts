import { describe, expect, it } from 'bun:test'
import { discoverUrisFromPlatform } from './index.js'
import type { PlatformHandler } from './types.js'

describe('discoverUrisFromPlatform', () => {
  it('should return URIs when handler matches', async () => {
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/feed.xml' }],
    }
    const value = { baseUrl: 'https://example.com', handlers: [handler] }
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, value)).toEqual(expected)
  })

  it('should return empty array when no handler matches', async () => {
    const handler: PlatformHandler = {
      match: () => false,
      resolve: () => [{ uri: 'https://example.com/feed.xml' }],
    }
    const value = { baseUrl: 'https://example.com', handlers: [handler] }

    expect(await discoverUrisFromPlatform(undefined, undefined, value)).toEqual([])
  })

  it('should return empty array when handlers array is empty', async () => {
    const value = { baseUrl: 'https://example.com', handlers: [] }

    expect(await discoverUrisFromPlatform(undefined, undefined, value)).toEqual([])
  })

  it('should continue to next handler if first handler throws', async () => {
    const throwingHandler: PlatformHandler = {
      match: () => {
        throw new Error('Handler error')
      },
      resolve: () => [],
    }
    const workingHandler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/feed.xml' }],
    }
    const value = {
      baseUrl: 'https://example.com',
      handlers: [throwingHandler, workingHandler],
    }
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, value)).toEqual(expected)
  })

  it('should continue to next handler if resolve throws', async () => {
    const throwingHandler: PlatformHandler = {
      match: () => true,
      resolve: () => {
        throw new Error('Resolve error')
      },
    }
    const workingHandler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/feed.xml' }],
    }
    const value = {
      baseUrl: 'https://example.com',
      handlers: [throwingHandler, workingHandler],
    }
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, value)).toEqual(expected)
  })

  it('should pass html content to handler resolve method', async () => {
    let receivedHtml = ''
    const handler: PlatformHandler = {
      match: () => true,
      resolve: (_url, content) => {
        receivedHtml = content ?? ''

        return []
      },
    }
    const html = '<html><body>Test</body></html>'
    const value = { baseUrl: 'https://example.com', handlers: [handler] }

    await discoverUrisFromPlatform(html, undefined, value)

    expect(receivedHtml).toBe(html)
  })

  it('should pass baseUrl to handler match and resolve methods', async () => {
    let matchedUrl = ''
    let resolvedUrl = ''
    const handler: PlatformHandler = {
      match: (url) => {
        matchedUrl = url

        return true
      },
      resolve: (url) => {
        resolvedUrl = url

        return []
      },
    }
    const value = { baseUrl: 'https://example.com/page', handlers: [handler] }

    await discoverUrisFromPlatform(undefined, undefined, value)

    expect(matchedUrl).toBe('https://example.com/page')
    expect(resolvedUrl).toBe('https://example.com/page')
  })

  it('should use first matching handler when multiple handlers match', async () => {
    const firstHandler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/first.xml' }],
    }
    const secondHandler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/second.xml' }],
    }
    const value = {
      baseUrl: 'https://example.com',
      handlers: [firstHandler, secondHandler],
    }
    const expected = [{ uri: 'https://example.com/first.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, value)).toEqual(expected)
  })

  it('should not call resolve on non-matching handlers', async () => {
    let secondResolvedCalled = false
    const firstHandler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/first.xml' }],
    }
    const secondHandler: PlatformHandler = {
      match: () => true,
      resolve: () => {
        secondResolvedCalled = true

        return [{ uri: 'https://example.com/second.xml' }]
      },
    }
    const value = {
      baseUrl: 'https://example.com',
      handlers: [firstHandler, secondHandler],
    }

    await discoverUrisFromPlatform(undefined, undefined, value)

    expect(secondResolvedCalled).toBe(false)
  })

  it('should check handlers in provided order', async () => {
    const callOrder: Array<string> = []
    const firstHandler: PlatformHandler = {
      match: () => {
        callOrder.push('first')

        return false
      },
      resolve: () => [],
    }
    const secondHandler: PlatformHandler = {
      match: () => {
        callOrder.push('second')

        return false
      },
      resolve: () => [],
    }
    const value = {
      baseUrl: 'https://example.com',
      handlers: [firstHandler, secondHandler],
    }

    await discoverUrisFromPlatform(undefined, undefined, value)

    expect(callOrder).toEqual(['first', 'second'])
  })
})
