import { describe, expect, it } from 'bun:test'
import type {
  DiscoverEnrichFn,
  DiscoverErrorContext,
  DiscoverOnErrorFn,
  DiscoverRef,
  FetchFn,
} from '../../types.js'
import { discoverUrisFromPlatform, resolveFromPlatform } from './index.js'
import type { PlatformHandler } from './types.js'

const guessExclusionRegex = /^https:\/\/example\.com\/[^/]+\.xml$/
const samePageUrls = [
  'https://example.com/page?a=1&b=2',
  'http://example.com/page?a=1&b=2',
  'https://www.example.com/page?a=1&b=2',
  'https://example.com/page/?a=1&b=2',
  'https://example.com/page?a=1&b=2#top',
  'https://example.com/page?b=2&a=1',
  'https://EXAMPLE.com/page?a=1&b=2',
  'https://example.com:443/page?a=1&b=2',
  'https://user:pw@example.com/page?a=1&b=2',
  'https://example.com/p%61ge?a=1&b=2',
]

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

  it('should return empty array for a page without an http origin', async () => {
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/feed.xml' }],
    }
    const options = { baseUrl: 'foo://example.com', handlers: [handler] }

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

  it('should collapse repeated slashes in the page path before handlers see it', async () => {
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
    const options = { baseUrl: 'https://example.com/r//programming///hot', handlers: [handler] }

    await discoverUrisFromPlatform(undefined, undefined, options)
    const expected = [
      'match:https://example.com/r/programming/hot',
      'resolve:https://example.com/r/programming/hot',
    ]

    expect(receivedUrls).toEqual(expected)
  })

  it('should keep repeated slashes in the query string', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return false
      },
      resolve: () => {
        return []
      },
    }
    const options = { baseUrl: 'https://example.com//page?next=//example.org', handlers: [handler] }

    await discoverUrisFromPlatform(undefined, undefined, options)
    const expected = ['https://example.com/page?next=//example.org']

    expect(receivedUrls).toEqual(expected)
  })

  it('should trim whitespace around a path segment before handlers see it', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return false
      },
      resolve: () => [],
    }
    const options = { baseUrl: 'https://example.com/photos/name%20/', handlers: [handler] }

    await discoverUrisFromPlatform(undefined, undefined, options)
    const expected = ['https://example.com/photos/name/']

    expect(receivedUrls).toEqual(expected)
  })

  it('should trim whitespace around a query value before handlers see it', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return false
      },
      resolve: () => [],
    }
    const options = { baseUrl: 'https://example.com/playlist?list=PL123%20', handlers: [handler] }

    await discoverUrisFromPlatform(undefined, undefined, options)
    const expected = ['https://example.com/playlist?list=PL123']

    expect(receivedUrls).toEqual(expected)
  })

  it('should pass handlers the page url in its standard form', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return false
      },
      resolve: () => {
        return []
      },
    }
    const options = { baseUrl: 'https://EXAMPLE.com:443', handlers: [handler] }

    await discoverUrisFromPlatform(undefined, undefined, options)
    const expected = ['https://example.com/']

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

    // The first call asks whether the handler takes the URL alone.
    expect(receivedHeaders).toEqual([undefined, headers, headers])
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

  it('should continue to next handler if a matching handler resolves nothing', async () => {
    const emptyHandler: PlatformHandler = {
      match: () => true,
      resolve: () => [],
    }
    const workingHandler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/feed.xml' }],
    }
    const options = {
      baseUrl: 'https://example.com',
      handlers: [emptyHandler, workingHandler],
    }
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
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

  it('should try a handler that takes the URL alone before one that needs a marker', async () => {
    const markerHandler: PlatformHandler = {
      match: (_url, content) => content !== undefined,
      resolve: () => [{ uri: 'https://example.com/marker.xml' }],
    }
    const urlHandler: PlatformHandler = {
      match: () => true,
      resolve: () => [{ uri: 'https://example.com/url.xml' }],
    }
    const options = { baseUrl: 'https://example.com', handlers: [markerHandler, urlHandler] }
    const expected = [{ uri: 'https://example.com/url.xml' }]

    expect(await discoverUrisFromPlatform('<html></html>', undefined, options)).toEqual(expected)
  })

  it('should keep a handler whose match throws on the URL alone among the marker ones', async () => {
    const handler: PlatformHandler = {
      match: (_url, content) => {
        if (content === undefined) {
          throw new Error('No content')
        }

        return true
      },
      resolve: () => [{ uri: 'https://example.com/feed.xml' }],
    }
    const options = { baseUrl: 'https://example.com', handlers: [handler] }
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    expect(await discoverUrisFromPlatform('<html></html>', undefined, options)).toEqual(expected)
  })

  it('should keep the provided order among handlers that need a marker', async () => {
    const firstHandler: PlatformHandler = {
      match: (_url, content) => content !== undefined,
      resolve: () => [{ uri: 'https://example.com/first.xml' }],
    }
    const secondHandler: PlatformHandler = {
      match: (_url, content) => content !== undefined,
      resolve: () => [{ uri: 'https://example.com/second.xml' }],
    }
    const options = { baseUrl: 'https://example.com', handlers: [firstHandler, secondHandler] }
    const expected = [{ uri: 'https://example.com/first.xml' }]

    expect(await discoverUrisFromPlatform('<html></html>', undefined, options)).toEqual(expected)
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
    const enrichFn: DiscoverEnrichFn = () => ['https://cdn.example.com/alice.png']
    const options = { baseUrl: 'https://example.com', handlers: [handler], enrichFn }
    const expected = [
      { uri: 'https://example.com/avatar.png' },
      { uri: 'https://cdn.example.com/alice.png' },
    ]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })

  it('should call enrichFn once per ref', async () => {
    const receivedRefs: Array<DiscoverRef> = []
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [
        { platform: 'example', id: 'alice', url: 'https://example.com/@alice' },
        { platform: 'example', id: 'bob', url: 'https://example.com/@bob' },
      ],
    }
    const enrichFn: DiscoverEnrichFn = (ref) => {
      receivedRefs.push(ref)

      return []
    }
    const options = { baseUrl: 'https://example.com', handlers: [handler], enrichFn }
    const expected = [
      { platform: 'example', id: 'alice', url: 'https://example.com/@alice' },
      { platform: 'example', id: 'bob', url: 'https://example.com/@bob' },
    ]

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(receivedRefs).toEqual(expected)
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
    const enrichFn: DiscoverEnrichFn = (ref) => {
      if (ref.id !== 'bob') {
        return
      }

      return ['https://cdn.example.com/bob.png']
    }
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

  it('should keep the other refs when enrichFn throws for one', async () => {
    const handler: PlatformHandler = {
      match: () => true,
      resolve: () => [
        { platform: 'example', id: 'alice', url: 'https://example.com/@alice' },
        { platform: 'example', id: 'bob', url: 'https://example.com/@bob' },
      ],
    }
    const enrichFn: DiscoverEnrichFn = (ref) => {
      if (ref.id === 'alice') {
        throw new Error('Enrich error')
      }

      return ['https://cdn.example.com/bob.png']
    }
    const options = { baseUrl: 'https://example.com', handlers: [handler], enrichFn }
    const expected = [{ uri: 'https://cdn.example.com/bob.png' }]

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

  it('should return the entries of the requested URL when no handler matches the page', async () => {
    const handler: PlatformHandler = {
      match: (url) => url === 'https://example.com/popular',
      resolve: () => [{ uri: 'https://example.com/popular/feed.xml' }],
    }
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com/popular',
      handlers: [handler],
    }
    const expected = [{ uri: 'https://example.com/popular/feed.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })

  it('should try the requested URL when a handler matched the page but resolved nothing', async () => {
    const handler: PlatformHandler = {
      match: () => true,
      resolve: (url) => {
        if (url !== 'https://example.com/popular') {
          return []
        }

        return [{ uri: 'https://example.com/popular/feed.xml' }]
      },
    }
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com/popular',
      handlers: [handler],
    }
    const expected = [{ uri: 'https://example.com/popular/feed.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })

  it('should not try the requested URL when a handler produced entries for the page', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return true
      },
      resolve: () => [{ uri: 'https://example.com/feed.xml' }],
    }
    const options = {
      baseUrl: 'https://example.com/page',
      requestedUrl: 'https://example.com/popular',
      handlers: [handler],
    }

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(receivedUrls).toEqual(['https://example.com/page'])
  })

  it('should not try the requested URL when a handler produced a ref for the page', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return true
      },
      resolve: () => [
        {
          platform: 'example',
          id: 'alice',
          url: 'https://example.com/@alice',
        },
      ],
    }
    const options = {
      baseUrl: 'https://example.com/page',
      requestedUrl: 'https://example.com/popular',
      handlers: [handler],
    }

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(receivedUrls).toEqual(['https://example.com/page'])
  })

  it('should pass no content to the handler for the requested URL', async () => {
    const receivedContents: Array<string | undefined> = []
    const handler: PlatformHandler = {
      match: (url, content) => {
        if (url !== 'https://example.com/popular') {
          return false
        }

        receivedContents.push(content)

        return true
      },
      resolve: (_url, content) => {
        receivedContents.push(content)

        return []
      },
    }
    const html = '<html><body>Sign in</body></html>'
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com/popular',
      handlers: [handler],
    }

    await discoverUrisFromPlatform(html, undefined, options)

    expect(receivedContents).toEqual([undefined, undefined])
  })

  it('should pass no headers to the handler for the requested URL', async () => {
    const receivedHeaders: Array<Headers | undefined> = []
    const handler: PlatformHandler = {
      match: (url, _content, headers) => {
        if (url !== 'https://example.com/popular') {
          return false
        }

        receivedHeaders.push(headers)

        return true
      },
      resolve: (_url, _content, headers) => {
        receivedHeaders.push(headers)

        return []
      },
    }
    const headers = new Headers({ 'content-type': 'text/html' })
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com/popular',
      handlers: [handler],
    }

    await discoverUrisFromPlatform(undefined, headers, options)

    expect(receivedHeaders).toEqual([undefined, undefined])
  })

  it('should collapse repeated slashes in the requested URL before handlers see it', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return false
      },
      resolve: () => [],
    }
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com//popular',
      handlers: [handler],
    }
    const expected = ['https://example.com/login', 'https://example.com/popular']

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(receivedUrls).toEqual(expected)
  })

  it('should trim whitespace around a value in the requested URL before handlers see it', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return false
      },
      resolve: () => [],
    }
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com/photos/name%20/',
      handlers: [handler],
    }
    const expected = ['https://example.com/login', 'https://example.com/photos/name/']

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(receivedUrls).toEqual(expected)
  })

  it.each(samePageUrls)('should skip %s as the fetched page', async (requestedUrl) => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return false
      },
      resolve: () => [],
    }
    const options = {
      baseUrl: 'https://example.com/page?a=1&b=2',
      requestedUrl,
      handlers: [handler],
    }

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(receivedUrls).toEqual(['https://example.com/page?a=1&b=2'])
  })

  it('should skip a requested URL that differs by an empty query', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return false
      },
      resolve: () => [],
    }
    const options = {
      baseUrl: 'https://example.com/page',
      requestedUrl: 'https://example.com/page?',
      handlers: [handler],
    }

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(receivedUrls).toEqual(['https://example.com/page'])
  })

  it('should skip the requested URL when the fetch ends on another host', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return false
      },
      resolve: () => [],
    }
    const options = {
      baseUrl: 'https://example.org/',
      requestedUrl: 'https://example.com/popular',
      handlers: [handler],
    }

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(receivedUrls).toEqual(['https://example.org/'])
  })

  it('should try the requested URL when the fetch ends on the www host', async () => {
    const handler: PlatformHandler = {
      match: (url) => url === 'https://example.com/popular',
      resolve: () => [{ uri: 'https://example.com/popular/feed.xml' }],
    }
    const options = {
      baseUrl: 'https://www.example.com/login',
      requestedUrl: 'https://example.com/popular',
      handlers: [handler],
    }
    const expected = [{ uri: 'https://example.com/popular/feed.xml' }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })

  it('should skip a handler for the requested URL when it declined the page from its content', async () => {
    const handler: PlatformHandler = {
      match: (_url, content) => !content?.includes('Create your blog'),
      resolve: (url) => {
        if (url !== 'https://example.com/admin') {
          return []
        }

        return [{ uri: 'https://example.com/posts.rss' }]
      },
    }
    const html = '<html><body>Create your blog</body></html>'
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com/admin',
      handlers: [handler],
    }

    expect(await discoverUrisFromPlatform(html, undefined, options)).toEqual([])
  })

  it('should skip a handler for the requested URL when it declined the page from its headers', async () => {
    const handler: PlatformHandler = {
      match: (_url, _content, headers) => headers?.get('x-robots-tag') !== 'noindex',
      resolve: (url) => {
        if (url !== 'https://example.com/admin') {
          return []
        }

        return [{ uri: 'https://example.com/posts.rss' }]
      },
    }
    const headers = new Headers({ 'x-robots-tag': 'noindex' })
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com/admin',
      handlers: [handler],
    }

    expect(await discoverUrisFromPlatform(undefined, headers, options)).toEqual([])
  })

  it('should keep the other handlers for the requested URL when one declined the page', async () => {
    const decliningHandler: PlatformHandler = {
      match: (_url, content) => !content?.includes('Create your blog'),
      resolve: () => [{ uri: 'https://example.com/posts.rss' }],
    }
    const handler: PlatformHandler = {
      match: (url) => url === 'https://example.com/admin',
      resolve: () => [{ uri: 'https://example.com/admin/feed.xml' }],
    }
    const html = '<html><body>Create your blog</body></html>'
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com/admin',
      handlers: [decliningHandler, handler],
    }
    const expected = [{ uri: 'https://example.com/admin/feed.xml' }]

    expect(await discoverUrisFromPlatform(html, undefined, options)).toEqual(expected)
  })

  it('should skip the requested URL when it is not an http URL', async () => {
    const receivedUrls: Array<string> = []
    const handler: PlatformHandler = {
      match: (url) => {
        receivedUrls.push(url)

        return false
      },
      resolve: () => [],
    }
    const options = {
      baseUrl: 'https://example.com/page',
      requestedUrl: 'foo://example.com/popular',
      handlers: [handler],
    }

    await discoverUrisFromPlatform(undefined, undefined, options)

    expect(receivedUrls).toEqual(['https://example.com/page'])
  })

  it('should report a handler throw to onError with the requested URL', async () => {
    const reported: Array<[unknown, DiscoverErrorContext]> = []
    const error = new Error('Resolve error')
    const throwingHandler: PlatformHandler = {
      match: (url) => url === 'https://example.com/popular',
      resolve: () => {
        throw error
      },
    }
    const onError: DiscoverOnErrorFn = (error, context) => {
      reported.push([error, context])
    }
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com/popular',
      handlers: [throwingHandler],
    }
    const expected: Array<[unknown, DiscoverErrorContext]> = [
      [
        error,
        {
          phase: 'platformHandler',
          url: 'https://example.com/popular',
        },
      ],
    ]

    await discoverUrisFromPlatform(undefined, undefined, options, undefined, onError)

    expect(reported).toEqual(expected)
  })

  it('should report an enrichFn throw to onError with the requested URL', async () => {
    const reported: Array<[unknown, DiscoverErrorContext]> = []
    const error = new Error('Enrich error')
    const handler: PlatformHandler = {
      match: (url) => url === 'https://example.com/@alice',
      resolve: () => [
        {
          platform: 'example',
          id: 'alice',
          url: 'https://example.com/@alice',
        },
      ],
    }
    const enrichFn: DiscoverEnrichFn = () => {
      throw error
    }
    const onError: DiscoverOnErrorFn = (error, context) => {
      reported.push([error, context])
    }
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com/@alice',
      handlers: [handler],
      enrichFn,
    }
    const expected: Array<[unknown, DiscoverErrorContext]> = [
      [
        error,
        {
          phase: 'enrichFn',
          url: 'https://example.com/@alice',
        },
      ],
    ]

    await discoverUrisFromPlatform(undefined, undefined, options, undefined, onError)

    expect(reported).toEqual(expected)
  })
})

describe('resolveFromPlatform', () => {
  it('should collect the guessExclusionRegex of a handler that matched the requested URL', async () => {
    const handler: PlatformHandler = {
      match: (url) => url === 'https://example.com/popular',
      resolve: () => [{ uri: 'https://example.com/popular/feed.xml' }],
      guessExclusionRegex,
    }
    const options = {
      baseUrl: 'https://example.com/login',
      requestedUrl: 'https://example.com/popular',
      handlers: [handler],
    }
    const expected = {
      entries: [{ uri: 'https://example.com/popular/feed.xml' }],
      guessExclusionRegexes: [guessExclusionRegex],
    }

    expect(await resolveFromPlatform(undefined, undefined, options)).toEqual(expected)
  })
})
