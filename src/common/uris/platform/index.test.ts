import { describe, expect, it } from 'bun:test'
import { discoverUrisFromPlatform } from './index.js'
import type { PlatformHandler } from './types.js'

describe('discoverUrisFromPlatform', () => {
  it('should return URIs when handler matches', () => {
    const handler: PlatformHandler = {
      match: () => {
        return true
      },
      resolve: () => {
        return ['https://example.com/feed.xml']
      },
    }
    const value = { baseUrl: 'https://example.com', handlers: [handler] }
    const expected = ['https://example.com/feed.xml']

    expect(discoverUrisFromPlatform('', value)).toEqual(expected)
  })

  it('should return empty array when no handler matches', () => {
    const handler: PlatformHandler = {
      match: () => {
        return false
      },
      resolve: () => {
        return ['https://example.com/feed.xml']
      },
    }
    const value = { baseUrl: 'https://example.com', handlers: [handler] }
    const expected: Array<string> = []

    expect(discoverUrisFromPlatform('', value)).toEqual(expected)
  })

  it('should return empty array when handlers array is empty', () => {
    const value = { baseUrl: 'https://example.com', handlers: [] }
    const expected: Array<string> = []

    expect(discoverUrisFromPlatform('', value)).toEqual(expected)
  })

  it('should continue to next handler if first handler throws', () => {
    const throwingHandler: PlatformHandler = {
      match: () => {
        throw new Error('Handler error')
      },
      resolve: () => {
        return []
      },
    }
    const workingHandler: PlatformHandler = {
      match: () => {
        return true
      },
      resolve: () => {
        return ['https://example.com/feed.xml']
      },
    }
    const value = {
      baseUrl: 'https://example.com',
      handlers: [throwingHandler, workingHandler],
    }
    const expected = ['https://example.com/feed.xml']

    expect(discoverUrisFromPlatform('', value)).toEqual(expected)
  })

  it('should continue to next handler if resolve throws', () => {
    const throwingHandler: PlatformHandler = {
      match: () => {
        return true
      },
      resolve: () => {
        throw new Error('Resolve error')
      },
    }
    const workingHandler: PlatformHandler = {
      match: () => {
        return true
      },
      resolve: () => {
        return ['https://example.com/feed.xml']
      },
    }
    const value = {
      baseUrl: 'https://example.com',
      handlers: [throwingHandler, workingHandler],
    }
    const expected = ['https://example.com/feed.xml']

    expect(discoverUrisFromPlatform('', value)).toEqual(expected)
  })

  it('should pass html content to handler resolve method', () => {
    let receivedHtml = ''
    const handler: PlatformHandler = {
      match: () => {
        return true
      },
      resolve: (_url, content) => {
        receivedHtml = content ?? ''

        return []
      },
    }
    const html = '<html><body>Test</body></html>'
    const value = { baseUrl: 'https://example.com', handlers: [handler] }

    discoverUrisFromPlatform(html, value)

    expect(receivedHtml).toBe(html)
  })

  it('should pass baseUrl to handler match and resolve methods', () => {
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

    discoverUrisFromPlatform('', value)

    expect(matchedUrl).toBe('https://example.com/page')
    expect(resolvedUrl).toBe('https://example.com/page')
  })

  it('should use first matching handler when multiple handlers match', () => {
    const firstHandler: PlatformHandler = {
      match: () => {
        return true
      },
      resolve: () => {
        return ['https://example.com/first.xml']
      },
    }
    const secondHandler: PlatformHandler = {
      match: () => {
        return true
      },
      resolve: () => {
        return ['https://example.com/second.xml']
      },
    }
    const value = {
      baseUrl: 'https://example.com',
      handlers: [firstHandler, secondHandler],
    }
    const expected = ['https://example.com/first.xml']

    expect(discoverUrisFromPlatform('', value)).toEqual(expected)
  })

  it('should not call resolve on non-matching handlers', () => {
    let secondResolvedCalled = false
    const firstHandler: PlatformHandler = {
      match: () => {
        return true
      },
      resolve: () => {
        return ['https://example.com/first.xml']
      },
    }
    const secondHandler: PlatformHandler = {
      match: () => {
        return true
      },
      resolve: () => {
        secondResolvedCalled = true

        return ['https://example.com/second.xml']
      },
    }
    const value = {
      baseUrl: 'https://example.com',
      handlers: [firstHandler, secondHandler],
    }

    discoverUrisFromPlatform('', value)

    expect(secondResolvedCalled).toBe(false)
  })

  it('should check handlers in provided order', () => {
    const callOrder: Array<string> = []
    const firstHandler: PlatformHandler = {
      match: () => {
        callOrder.push('first')

        return false
      },
      resolve: () => {
        return []
      },
    }
    const secondHandler: PlatformHandler = {
      match: () => {
        callOrder.push('second')

        return false
      },
      resolve: () => {
        return []
      },
    }
    const value = {
      baseUrl: 'https://example.com',
      handlers: [firstHandler, secondHandler],
    }

    discoverUrisFromPlatform('', value)

    expect(callOrder).toEqual(['first', 'second'])
  })
})
