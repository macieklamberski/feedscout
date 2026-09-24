import { describe, expect, it } from 'bun:test'
import type {
  DiscoverEnrichFn,
  DiscoverErrorContext,
  DiscoverOnErrorFn,
  DiscoverRef,
  FetchFn,
} from '../../types.js'
import { discoverUrisFromPlatform } from './index.js'
import type { PlatformHandler } from './types.js'

describe('discoverUrisFromPlatform', () => {
  it('should return URIs when handler matches', async () => {
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/feed.xml' }],
    }
    const options = { baseUrl: 'https://example.com', handlers: [handler] }
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })

  it('should return empty array when no handler matches', async () => {
    const handler: PlatformHandler = {
      match: () => false,
      resolve: () => [{ uri: 'https://example.com/feed.xml' }],
    }
    const options = { baseUrl: 'https://example.com', handlers: [handler] }

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual([])
  })

  it('should return empty array when handlers array is empty', async () => {
    const options = { baseUrl: 'https://example.com', handlers: [] }

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual([])
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
    const options = {
      baseUrl: 'https://example.com',
      handlers: [throwingHandler, workingHandler],
    }
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
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
    const options = {
      baseUrl: 'https://example.com',
      handlers: [throwingHandler, workingHandler],
    }
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
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
    const options = { baseUrl: 'https://example.com', handlers: [handler] }

    await discoverUrisFromPlatform(html, undefined, options)

    expect(receivedHtml).toBe(html)
  })

  it('should pass baseUrl to handler match and resolve methods', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(`match:${url}`)

        return true
      },
      resolve: (url) => {
        receivedUrls.push(`resolve:${url}`)

        return []
      },
    }
    const options = { baseUrl: 'https://example.com/page', handlers: [handler] }

    await discoverUrisFromPlatform(undefined, undefined, options)
    const expected = ['match:https://example.com/page', 'resolve:https://example.com/page']

    expect(receivedUrls).toEqual(expected)
  })

  it('should pass headers to handler match and resolve methods', async () => {
    const receivedHeaders: Array<Headers | undefined> = []
    const handler: PlatformHandler = {
      match: (_url, _content, headers) => {
        receivedHeaders.push(headers)

        return true
      },
      resolve: (_url, _content, headers) => {
        receivedHeaders.push(headers)

        return []
      },
    }
    const headers = new Headers({ 'content-type': 'text/html' })
    const options = { baseUrl: 'https://example.com', handlers: [handler] }

    await discoverUrisFromPlatform(undefined, headers, options)

    expect(receivedHeaders).toEqual([headers, headers])
  })

  it('should pass fetchFn to handler resolve method', async () => {
    let receivedFetchFn: FetchFn | undefined
    const handler: PlatformHandler = {
      match: () => true,
      resolve: (_url, _content, _headers, fetchFn) => {
        receivedFetchFn = fetchFn

        return []
      },
    }
    const fetchFn: FetchFn = (url) => {
      return Promise.resolve({
        url,
        body: '',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      })
    }
    const options = { baseUrl: 'https://example.com', handlers: [handler] }

    await discoverUrisFromPlatform(undefined, undefined, options, fetchFn)

    expect(receivedFetchFn).toBe(fetchFn)
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
    const options = {
      baseUrl: 'https://example.com',
      handlers: [firstHandler, secondHandler],
    }
    const expected = [{ uri: 'https://example.com/first.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
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
    const options = {
      baseUrl: 'https://example.com',
      handlers: [firstHandler, secondHandler],
    }

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(secondResolvedCalled).toBe(false)
  })

  it('should continue to next handler if async resolve rejects', async () => {
    const throwingHandler: PlatformHandler = {
      match: () => true,
      resolve: () => Promise.reject(new Error('Async resolve error')),
    }
    const workingHandler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/feed.xml' }],
    }
    const options = {
      baseUrl: 'https://example.com',
      handlers: [throwingHandler, workingHandler],
    }
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
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
    const options = {
      baseUrl: 'https://example.com',
      handlers: [firstHandler, secondHandler],
    }

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(callOrder).toEqual(['first', 'second'])
  })

  it('should append URIs from enrichFn after the handler URIs', async () => {
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [
        { uri: 'https://example.com/avatar.png' },
        { platform: 'example', id: 'alice', url: 'https://example.com/@alice' },
      ],
    }
    const enrichFn: DiscoverEnrichFn = () => [['https://cdn.example.com/alice.png']]
    const options = { baseUrl: 'https://example.com', handlers: [handler], enrichFn }
    const expected = [
      { uri: 'https://example.com/avatar.png' },
      { uri: 'https://cdn.example.com/alice.png' },
    ]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })

  it('should pass every ref to enrichFn in one call', async () => {
    const receivedCalls: Array<Array<DiscoverRef>> = []
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [
        { platform: 'example', id: 'alice', url: 'https://example.com/@alice' },
        { platform: 'example', id: 'bob', url: 'https://example.com/@bob' },
      ],
    }
    const enrichFn: DiscoverEnrichFn = (refs) => {
      receivedCalls.push(refs)

      return []
    }
    const options = { baseUrl: 'https://example.com', handlers: [handler], enrichFn }
    const expected = [
      [
        { platform: 'example', id: 'alice', url: 'https://example.com/@alice' },
        { platform: 'example', id: 'bob', url: 'https://example.com/@bob' },
      ],
    ]

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(receivedCalls).toEqual(expected)
  })

  it('should drop refs when enrichFn is not provided', async () => {
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [
        { uri: 'https://example.com/avatar.png' },
        { platform: 'example', id: 'alice', url: 'https://example.com/@alice' },
      ],
    }
    const options = { baseUrl: 'https://example.com', handlers: [handler] }
    const expected = [{ uri: 'https://example.com/avatar.png' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })

  it('should not call enrichFn when the handler returns no refs', async () => {
    let isEnrichCalled = false
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/avatar.png' }],
    }
    const enrichFn: DiscoverEnrichFn = () => {
      isEnrichCalled = true

      return []
    }
    const options = { baseUrl: 'https://example.com', handlers: [handler], enrichFn }

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(isEnrichCalled).toBe(false)
  })

  it('should skip refs that enrichFn found nothing for', async () => {
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [
        { platform: 'example', id: 'alice', url: 'https://example.com/@alice' },
        { platform: 'example', id: 'bob', url: 'https://example.com/@bob' },
      ],
    }
    const enrichFn: DiscoverEnrichFn = () => [undefined, ['https://cdn.example.com/bob.png']]
    const options = { baseUrl: 'https://example.com', handlers: [handler], enrichFn }
    const expected = [{ uri: 'https://cdn.example.com/bob.png' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })

  it('should keep the handler URIs when enrichFn throws', async () => {
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [
        { uri: 'https://example.com/avatar.png' },
        { platform: 'example', id: 'alice', url: 'https://example.com/@alice' },
      ],
    }
    const enrichFn: DiscoverEnrichFn = () => {
      throw new Error('Enrich error')
    }
    const options = { baseUrl: 'https://example.com', handlers: [handler], enrichFn }
    const expected = [{ uri: 'https://example.com/avatar.png' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })

  it('should report an enrichFn throw to onError with the page URL', async () => {
    const reported: Array<[unknown, DiscoverErrorContext]> = []
    const error = new Error('Enrich error')
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ platform: 'example', id: 'alice', url: 'https://example.com/@alice' }],
    }
    const enrichFn: DiscoverEnrichFn = () => {
      throw error
    }
    const onError: DiscoverOnErrorFn = (error, context) => {
      reported.push([error, context])
    }
    const options = { baseUrl: 'https://example.com/@alice', handlers: [handler], enrichFn }
    const expected: Array<[unknown, DiscoverErrorContext]> = [
      [error, { phase: 'enrichFn', url: 'https://example.com/@alice' }],
    ]

    await discoverUrisFromPlatform(undefined, undefined, options, undefined, onError)

    expect(reported).toEqual(expected)
  })

  it('should report a handler throw to onError with the page URL', async () => {
    const reported: Array<[unknown, DiscoverErrorContext]> = []
    const error = new Error('Resolve error')
    const throwingHandler: PlatformHandler = {
      match: () => true,
      resolve: () => {
        throw error
      },
    }
    const onError: DiscoverOnErrorFn = (error, context) => {
      reported.push([error, context])
    }
    const options = { baseUrl: 'https://example.com/page', handlers: [throwingHandler] }
    const expected: Array<[unknown, DiscoverErrorContext]> = [
      [error, { phase: 'platformHandler', url: 'https://example.com/page' }],
    ]

    await discoverUrisFromPlatform(undefined, undefined, options, undefined, onError)

    expect(reported).toEqual(expected)
  })
})
