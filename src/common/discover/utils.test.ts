import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { parseFeed } from 'feedsmith'
import locales from '../locales.json' with { type: 'json' }
import type { DiscoverFetchFn, DiscoverResolveUrlFn } from '../types.js'
import { defaultFetchFn, defaultResolveSiteUrlFn, defaultResolveUrlFn } from './defaults.js'
import {
  getFeedSiteUrl,
  normalizeInput,
  normalizeMethodsConfig,
  normalizeUriEntry,
} from './utils.js'

describe('defaultFetchFn', () => {
  // biome-ignore lint/suspicious/noExplicitAny: Mock helper needs flexible signature.
  const createFetchMock = <T extends (...args: Array<any>) => Response | Promise<Response>>(
    implementation: T,
  ) => {
    return implementation as unknown as typeof fetch
  }

  type MockResponse = Pick<Response, 'headers' | 'text' | 'url' | 'status' | 'statusText'>

  const createMockResponse = (partial: Partial<MockResponse>): Response => {
    return {
      headers: partial.headers ?? new Headers(),
      text: partial.text ?? (async () => ''),
      url: partial.url ?? '',
      status: partial.status ?? 200,
      statusText: partial.statusText ?? 'OK',
    } as Response
  }

  const fetchSpy = spyOn(globalThis, 'fetch')

  afterEach(() => {
    fetchSpy.mockReset()
  })

  it('should call native fetch with correct URL', async () => {
    fetchSpy.mockImplementation(
      createFetchMock((url: string) => {
        return createMockResponse({
          url,
          text: async () => 'response body',
        })
      }),
    )
    const result = await defaultFetchFn('https://example.com/feed.xml')
    const expected = {
      url: 'https://example.com/feed.xml',
      body: 'response body',
      headers: expect.any(Headers),
      status: 200,
      statusText: 'OK',
    }

    expect(result).toEqual(expected)
  })

  it('should default to GET method when not specified', async () => {
    let capturedOptions: RequestInit | undefined
    fetchSpy.mockImplementation(
      createFetchMock((_url: string, options?: RequestInit) => {
        capturedOptions = options
        return createMockResponse({})
      }),
    )

    await defaultFetchFn('https://example.com/feed.xml')

    expect(capturedOptions?.method).toBe('GET')
  })

  it('should use specified method from options', async () => {
    let capturedOptions: RequestInit | undefined
    fetchSpy.mockImplementation(
      createFetchMock((_url: string, options?: RequestInit) => {
        capturedOptions = options
        return createMockResponse({})
      }),
    )

    await defaultFetchFn('https://example.com/feed.xml', { method: 'HEAD' })

    expect(capturedOptions?.method).toBe('HEAD')
  })

  it('should pass headers to fetch', async () => {
    let capturedOptions: RequestInit | undefined
    fetchSpy.mockImplementation(
      createFetchMock((_url: string, options?: RequestInit) => {
        capturedOptions = options
        return createMockResponse({})
      }),
    )

    await defaultFetchFn('https://example.com/feed.xml', {
      headers: { 'X-Custom': 'value' },
    })

    expect(capturedOptions?.headers).toEqual({ 'X-Custom': 'value' })
  })

  it('should return response with correct structure', async () => {
    fetchSpy.mockImplementation(
      createFetchMock(() => {
        return createMockResponse({
          headers: new Headers({ 'content-type': 'application/rss+xml' }),
          text: async () => 'feed content',
          url: 'https://example.com/feed.xml',
          status: 200,
          statusText: 'OK',
        })
      }),
    )
    const result = await defaultFetchFn('https://example.com/feed.xml')
    const expected = {
      url: 'https://example.com/feed.xml',
      body: 'feed content',
      headers: expect.any(Headers),
      status: 200,
      statusText: 'OK',
    }

    expect(result).toEqual(expected)
    expect(result.headers.get('content-type')).toBe('application/rss+xml')
  })

  it('should preserve response URL for redirect handling', async () => {
    fetchSpy.mockImplementation(
      createFetchMock(() => {
        return createMockResponse({
          url: 'https://redirect.example.com/feed.xml',
        })
      }),
    )
    const result = await defaultFetchFn('https://example.com/feed.xml')
    const expected = {
      url: 'https://redirect.example.com/feed.xml',
      body: '',
      headers: expect.any(Headers),
      status: 200,
      statusText: 'OK',
    }

    expect(result).toEqual(expected)
  })

  it('should convert response body to text', async () => {
    fetchSpy.mockImplementation(
      createFetchMock(() => {
        return createMockResponse({
          text: async () => '<rss>feed content</rss>',
        })
      }),
    )
    const result = await defaultFetchFn('https://example.com/feed.xml')
    const expected = {
      url: '',
      body: '<rss>feed content</rss>',
      headers: expect.any(Headers),
      status: 200,
      statusText: 'OK',
    }

    expect(result).toEqual(expected)
  })

  it('should pass through status and statusText', async () => {
    fetchSpy.mockImplementation(
      createFetchMock(() => {
        return createMockResponse({
          status: 404,
          statusText: 'Not Found',
        })
      }),
    )
    const result = await defaultFetchFn('https://example.com/feed.xml')
    const expected = {
      url: '',
      body: '',
      headers: expect.any(Headers),
      status: 404,
      statusText: 'Not Found',
    }

    expect(result).toEqual(expected)
  })
})

describe('normalizeInput', () => {
  const fetchFn: DiscoverFetchFn = (url) => {
    return Promise.resolve({
      url,
      body: '<html>content</html>',
      headers: new Headers({ 'content-type': 'text/html' }),
      status: 200,
      statusText: 'OK',
    })
  }

  it('should fetch and normalize string input', async () => {
    const expected = {
      url: 'https://example.com',
      content: '<html>content</html>',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', fetchFn)).toEqual(expected)
  })

  it('should preserve redirected URL from fetch response', async () => {
    const redirectFetchFn: DiscoverFetchFn = () => {
      return Promise.resolve({
        url: 'https://example.com/redirected',
        body: '<html>content</html>',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      })
    }
    const expected = {
      url: 'https://example.com/redirected',
      content: '<html>content</html>',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', redirectFetchFn)).toEqual(expected)
  })

  it('should handle ReadableStream body by returning undefined content', async () => {
    const streamFetchFn: DiscoverFetchFn = (url) => {
      return Promise.resolve({
        url,
        body: new ReadableStream(),
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      })
    }
    const expected = {
      url: 'https://example.com',
      content: undefined,
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', streamFetchFn)).toEqual(expected)
  })

  it('should preserve headers from fetch response', async () => {
    const headers = new Headers({ 'content-type': 'text/html', link: '</feed>; rel="alternate"' })
    const headersFetchFn: DiscoverFetchFn = (url) => {
      return Promise.resolve({
        url,
        body: '<html></html>',
        headers,
        status: 200,
        statusText: 'OK',
      })
    }
    const result = await normalizeInput('https://example.com', headersFetchFn)
    const expected = {
      url: 'https://example.com',
      content: '<html></html>',
      headers,
    }

    expect(result).toEqual(expected)
  })

  it('should return object input as-is', async () => {
    const value = {
      url: 'https://example.com',
      content: '<html>existing content</html>',
      headers: new Headers({ 'content-type': 'text/html' }),
    }

    expect(await normalizeInput(value, fetchFn)).toEqual(value)
  })

  it('should return object input with only url', async () => {
    const value = {
      url: 'https://example.com',
    }

    expect(await normalizeInput(value, fetchFn)).toEqual(value)
  })

  it('should return object input with url and content', async () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }

    expect(await normalizeInput(value, fetchFn)).toEqual(value)
  })

  it('should not treat null as object input', async () => {
    const expected = {
      url: null,
      content: '<html>content</html>',
      headers: expect.any(Headers),
    }

    // null reports typeof 'object'; it must take the fetch path, not be returned as-is.
    expect((await normalizeInput(null as never, fetchFn)) as unknown).toEqual(expected)
  })

  it('should not treat an array as object input', async () => {
    const expected = {
      url: [],
      content: '<html>content</html>',
      headers: expect.any(Headers),
    }

    // Arrays report typeof 'object'; they must take the fetch path, not be returned as-is.
    expect((await normalizeInput([] as never, fetchFn)) as unknown).toEqual(expected)
  })

  it('should return object input with url and headers', async () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      headers,
    }

    expect(await normalizeInput(value, fetchFn)).toEqual(value)
  })

  it('should return object input with all fields', async () => {
    const headers = new Headers({ 'content-type': 'text/html' })
    const value = {
      url: 'https://example.com',
      content: '<html>full content</html>',
      headers,
    }

    expect(await normalizeInput(value, fetchFn)).toEqual(value)
  })

  it('should handle empty string content from fetch', async () => {
    const emptyFetchFn: DiscoverFetchFn = (url) => {
      return Promise.resolve({
        url,
        body: '',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      })
    }
    const expected = {
      url: 'https://example.com',
      content: '',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', emptyFetchFn)).toEqual(expected)
  })

  it('should not call fetchFn when object input provided', async () => {
    let fetchCalled = false
    const trackingFetchFn: DiscoverFetchFn = (url) => {
      fetchCalled = true
      return Promise.resolve({
        url,
        body: '<html></html>',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      })
    }
    const value = {
      url: 'https://example.com',
      content: '<html>existing</html>',
    }

    await normalizeInput(value, trackingFetchFn)

    expect(fetchCalled).toBe(false)
  })

  it('should handle fetch response with different status codes', async () => {
    const statusFetchFn: DiscoverFetchFn = (url) => {
      return Promise.resolve({
        url,
        body: '<html>content</html>',
        headers: new Headers(),
        status: 301,
        statusText: 'Moved Permanently',
      })
    }
    const expected = {
      url: 'https://example.com',
      content: '<html>content</html>',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', statusFetchFn)).toEqual(expected)
  })

  it('should return url-only object when fetchFn throws for string input', async () => {
    const throwingFetchFn: DiscoverFetchFn = () => {
      throw new Error('Network error')
    }
    const value = await normalizeInput('https://example.com', throwingFetchFn)
    const expected = { url: 'https://example.com' }

    expect(value).toEqual(expected)
  })
})

describe('normalizeMethodsConfig', () => {
  const feedMimeTypes = [
    'application/rss+xml',
    'text/rss+xml',
    'application/x-rss+xml',
    'application/rss',
    'application/atom+xml',
    'text/atom+xml',
    'application/feed+json',
    'application/json',
    'application/rdf+xml',
    'text/rdf+xml',
    'application/atom',
    'application/xml',
    'text/xml',
  ]
  const feedUrisComprehensive = [
    '/feed',
    '/rss',
    '/atom.xml',
    '/feed.xml',
    '/rss.xml',
    '/index.xml',
    '/feed/',
    '/index.atom',
    '/index.rss',
    '/feed.json',
    '/atom',
    '/feed.rss',
    '/feed.atom',
    '/feed.rss.xml',
    '/feed.atom.xml',
    '/index.rss.xml',
    '/index.atom.xml',
    '/?feed=rss',
    '/?feed=rss2',
    '/?feed=atom',
    '/?format=rss',
    '/?format=atom',
    '/?rss=1',
    '/?atom=1',
    '/.rss',
    '/f.json',
    '/f.rss',
    '/json',
    '/.feed',
    '/comments/feed',
    '/feeds/posts/default',
  ]
  const feedUrisBalanced = [
    '/feed',
    '/rss',
    '/atom.xml',
    '/feed.xml',
    '/rss.xml',
    '/index.xml',
    '/feed/',
    '/index.atom',
    '/index.rss',
    '/feed.json',
  ]
  const ignoredUris = ['wp-json/oembed/', 'wp-json/wp/']
  const anchorLabels = ['rss', 'feed', 'atom', 'subscribe', 'syndicate', 'json feed']
  const linkSelectors = [{ rel: 'alternate', types: feedMimeTypes }, { rel: 'feed' }]
  const extractUrls = () => [] as Array<string>
  const defaults = {
    platform: {
      handlers: [],
    },
    feed: {
      extractUrls,
    },
    html: {
      linkSelectors,
      anchorUris: feedUrisComprehensive,
      anchorIgnoredUris: ignoredUris,
      anchorLabels,
    },
    headers: {
      linkSelectors,
    },
    guess: {
      uris: feedUrisBalanced,
    },
    wellknown: {
      linkSelectors,
    },
  }

  it('should normalize array with single method to config with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const result = normalizeMethodsConfig(value, undefined, ['html'], defaults)
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should normalize array with multiple methods to config with defaults', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers,
    }
    const result = normalizeMethodsConfig(value, undefined, ['html', 'headers', 'guess'], defaults)
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
      headers: {
        headers,
        options: {
          linkSelectors,
          baseUrl: 'https://example.com',
        },
      },
      guess: {
        options: {
          uris: feedUrisBalanced,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should normalize object with true values to config with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const result = normalizeMethodsConfig(value, undefined, { html: true }, defaults)
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should normalize object with custom options and merge with defaults', () => {
    const value = {
      url: 'https://example.com',
    }
    const result = normalizeMethodsConfig(
      value,
      undefined,
      { guess: { uris: ['/custom-feed'] } },
      defaults,
    )
    const expected = {
      guess: {
        options: {
          uris: ['/custom-feed'],
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should normalize mixed object with true and custom options', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const result = normalizeMethodsConfig(
      value,
      undefined,
      { html: true, guess: { uris: ['/custom'] } },
      defaults,
    )
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
      guess: {
        options: {
          uris: ['/custom'],
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should override default options with custom options', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const result = normalizeMethodsConfig(
      value,
      undefined,
      { html: { anchorLabels: ['custom-label'] } },
      defaults,
    )
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels: ['custom-label'],
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should handle empty array', () => {
    const value = {
      url: 'https://example.com',
    }
    const result = normalizeMethodsConfig(value, undefined, [], defaults)
    const expected = {}

    expect(result).toEqual(expected)
  })

  it('should handle empty object', () => {
    const value = {
      url: 'https://example.com',
    }
    const result = normalizeMethodsConfig(value, undefined, {}, defaults)
    const expected = {}

    expect(result).toEqual(expected)
  })

  it('should include baseUrl from input in all method configs', () => {
    const headers = new Headers()
    const value = {
      url: 'https://blog.example.com',
      content: '<html></html>',
      headers,
    }
    const result = normalizeMethodsConfig(value, undefined, ['html', 'headers', 'guess'], defaults)
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://blog.example.com',
        },
      },
      headers: {
        headers,
        options: {
          linkSelectors,
          baseUrl: 'https://blog.example.com',
        },
      },
      guess: {
        options: {
          uris: feedUrisBalanced,
          baseUrl: 'https://blog.example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should pass headers object to headers method config', () => {
    const headers = new Headers({ 'content-type': 'text/html' })
    const value = {
      url: 'https://example.com',
      headers,
    }
    const result = normalizeMethodsConfig(value, undefined, ['headers'], defaults)
    const expected = {
      headers: {
        headers,
        options: {
          linkSelectors,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should pass html content to html method config', () => {
    const htmlContent =
      '<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml" /></head></html>'
    const value = {
      url: 'https://example.com',
      content: htmlContent,
    }
    const result = normalizeMethodsConfig(value, undefined, ['html'], defaults)
    const expected = {
      html: {
        html: htmlContent,
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should preserve custom options when merging with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const customOptions = {
      anchorLabels: ['custom1', 'custom2'],
      anchorUris: ['/custom-feed'],
    }
    const result = normalizeMethodsConfig(value, undefined, { html: customOptions }, defaults)
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: ['/custom-feed'],
          anchorIgnoredUris: ignoredUris,
          anchorLabels: ['custom1', 'custom2'],
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should handle all three methods with array format', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers,
    }
    const result = normalizeMethodsConfig(value, undefined, ['html', 'headers', 'guess'], defaults)
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
      headers: {
        headers,
        options: {
          linkSelectors,
          baseUrl: 'https://example.com',
        },
      },
      guess: {
        options: {
          uris: feedUrisBalanced,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should handle all three methods with object format', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers,
    }
    const result = normalizeMethodsConfig(
      value,
      undefined,
      { html: true, headers: true, guess: true },
      defaults,
    )
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
      headers: {
        headers,
        options: {
          linkSelectors,
          baseUrl: 'https://example.com',
        },
      },
      guess: {
        options: {
          uris: feedUrisBalanced,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should throw error when platform method requested without url', () => {
    const value = {
      url: '',
      content: '<html></html>',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, ['platform'], defaults)

    expect(throwing).toThrow(locales.errors.platformMethodRequiresUrl)
  })

  it('should normalize feed method with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<feed>content</feed>',
    }
    const result = normalizeMethodsConfig(value, undefined, ['feed'], defaults)
    const expected = {
      feed: {
        content: '<feed>content</feed>',
        options: {
          extractUrls,
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should normalize feed method with custom extractUrls', () => {
    const customExtractUrls = () => ['https://example.com/icon.png']
    const value = {
      url: 'https://example.com',
      content: '<feed>content</feed>',
    }
    const result = normalizeMethodsConfig(
      value,
      undefined,
      { feed: { extractUrls: customExtractUrls } },
      defaults,
    )
    const expected = {
      feed: {
        content: '<feed>content</feed>',
        options: {
          extractUrls: customExtractUrls,
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should throw error when feed method requested without content', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, ['feed'], defaults)

    expect(throwing).toThrow(locales.errors.feedMethodRequiresContent)
  })

  it('should throw error when feed method in object format without content', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, { feed: true }, defaults)

    expect(throwing).toThrow(locales.errors.feedMethodRequiresContent)
  })

  it('should throw error when html method requested without content', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, ['html'], defaults)

    expect(throwing).toThrow(locales.errors.htmlMethodRequiresContent)
  })

  it('should throw error when headers method requested without headers', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, ['headers'], defaults)

    expect(throwing).toThrow(locales.errors.headersMethodRequiresHeaders)
  })

  it('should throw error when guess method requested without url', () => {
    const value = {
      url: '',
      content: '<html></html>',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, ['guess'], defaults)

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })

  it('should throw error when platform method in object format without url', () => {
    const value = {
      url: '',
      content: '<html></html>',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, { platform: true }, defaults)

    expect(throwing).toThrow(locales.errors.platformMethodRequiresUrl)
  })

  it('should throw error when html method in object format without content', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, { html: true }, defaults)

    expect(throwing).toThrow(locales.errors.htmlMethodRequiresContent)
  })

  it('should throw error when headers method in object format without headers', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, { headers: true }, defaults)

    expect(throwing).toThrow(locales.errors.headersMethodRequiresHeaders)
  })

  it('should throw error when guess method in object format without url', () => {
    const value = {
      url: '',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, { guess: true }, defaults)

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })

  it('should throw error when wellknown method requested without url', () => {
    const value = {
      url: '',
      content: '<html></html>',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, ['wellknown'], defaults)

    expect(throwing).toThrow(locales.errors.wellknownMethodRequiresUrl)
  })

  it('should throw error when wellknown method in object format without url', () => {
    const value = {
      url: '',
    }
    const throwing = () => normalizeMethodsConfig(value, undefined, { wellknown: true }, defaults)

    expect(throwing).toThrow(locales.errors.wellknownMethodRequiresUrl)
  })

  it('should return complete html config with all default values', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const result = normalizeMethodsConfig(value, undefined, ['html'], defaults)
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should return complete headers config with all default values', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      headers,
    }
    const result = normalizeMethodsConfig(value, undefined, ['headers'], defaults)
    const expected = {
      headers: {
        headers,
        options: {
          linkSelectors,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should return complete guess config with all default values', () => {
    const value = {
      url: 'https://example.com',
    }
    const result = normalizeMethodsConfig(value, undefined, ['guess'], defaults)
    const expected = {
      guess: {
        options: {
          uris: feedUrisBalanced,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should keep all defaults when overriding html anchorLabels', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const result = normalizeMethodsConfig(
      value,
      undefined,
      { html: { anchorLabels: ['custom-label'] } },
      defaults,
    )
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels: ['custom-label'],
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should keep all defaults when overriding html anchorUris', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const result = normalizeMethodsConfig(
      value,
      undefined,
      { html: { anchorUris: ['/custom-feed'] } },
      defaults,
    )
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: ['/custom-feed'],
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should keep all defaults when overriding html anchorIgnoredUris', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const result = normalizeMethodsConfig(
      value,
      undefined,
      { html: { anchorIgnoredUris: ['custom-ignore'] } },
      defaults,
    )
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ['custom-ignore'],
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should keep all defaults when overriding html linkSelectors', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const customSelectors = [{ rel: 'custom', types: ['custom/mime'] }]
    const result = normalizeMethodsConfig(
      value,
      undefined,
      { html: { linkSelectors: customSelectors } },
      defaults,
    )
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors: customSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should keep all defaults when overriding guess feedUris', () => {
    const value = {
      url: 'https://example.com',
    }
    const result = normalizeMethodsConfig(
      value,
      undefined,
      { guess: { uris: ['/custom-feed'] } },
      defaults,
    )
    const expected = {
      guess: {
        options: {
          uris: ['/custom-feed'],
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should keep all defaults when overriding headers linkSelectors', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      headers,
    }
    const customSelectors = [{ rel: 'custom', types: ['custom/mime'] }]
    const result = normalizeMethodsConfig(
      value,
      undefined,
      { headers: { linkSelectors: customSelectors } },
      defaults,
    )
    const expected = {
      headers: {
        headers,
        options: {
          linkSelectors: customSelectors,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should handle empty string content for html method', () => {
    const value = {
      url: 'https://example.com',
      content: '',
    }
    const result = normalizeMethodsConfig(value, undefined, ['html'], defaults)
    const expected = {
      html: {
        html: '',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })

  it('should handle undefined url as falsy', () => {
    const value = {
      content: '<html></html>',
    }
    // @ts-expect-error: This is for testing purposes.
    const throwing = () => normalizeMethodsConfig(value, undefined, ['guess'], defaults)

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })

  it('should return all three method configs with complete defaults', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers,
    }
    const result = normalizeMethodsConfig(value, undefined, ['html', 'headers', 'guess'], defaults)
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          linkSelectors,
          anchorUris: feedUrisComprehensive,
          anchorIgnoredUris: ignoredUris,
          anchorLabels,
          baseUrl: 'https://example.com',
        },
      },
      headers: {
        headers,
        options: {
          linkSelectors,
          baseUrl: 'https://example.com',
        },
      },
      guess: {
        options: {
          uris: feedUrisBalanced,
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(result).toEqual(expected)
  })
})

describe('getFeedSiteUrl', () => {
  it('should return site URL from RSS feed with channel link', () => {
    const value = parseFeed(
      '<?xml version="1.0"?><rss version="2.0"><channel><link>https://example.com</link></channel></rss>',
    )
    const expected = 'https://example.com'

    expect(getFeedSiteUrl(value)).toBe(expected)
  })

  it('should return site URL from RSS feed with atom:link alternate', () => {
    const value = parseFeed(
      '<?xml version="1.0"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><atom:link rel="alternate" href="https://example.com"/></channel></rss>',
    )
    const expected = 'https://example.com'

    expect(getFeedSiteUrl(value)).toBe(expected)
  })

  it('should prefer atom:link alternate over channel link in RSS', () => {
    const value = parseFeed(
      '<?xml version="1.0"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><link>https://fallback.com</link><atom:link rel="alternate" href="https://preferred.com"/></channel></rss>',
    )
    const expected = 'https://preferred.com'

    expect(getFeedSiteUrl(value)).toBe(expected)
  })

  it('should return site URL from Atom feed with alternate link', () => {
    const value = parseFeed(
      '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><link rel="alternate" href="https://example.com"/></feed>',
    )
    const expected = 'https://example.com'

    expect(getFeedSiteUrl(value)).toBe(expected)
  })

  it('should return undefined from Atom feed without alternate link', () => {
    const value = parseFeed(
      '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><link rel="self" href="https://example.com/feed.xml"/></feed>',
    )

    expect(getFeedSiteUrl(value)).toBeUndefined()
  })

  it('should return site URL from JSON Feed with home_page_url', () => {
    const value = parseFeed(
      JSON.stringify({
        version: 'https://jsonfeed.org/version/1.1',
        title: 'Example',
        home_page_url: 'https://example.com',
        items: [],
      }),
    )
    const expected = 'https://example.com'

    expect(getFeedSiteUrl(value)).toBe(expected)
  })

  it('should return undefined from JSON Feed without home_page_url', () => {
    const value = parseFeed(
      JSON.stringify({
        version: 'https://jsonfeed.org/version/1.1',
        title: 'Example',
        items: [],
      }),
    )

    expect(getFeedSiteUrl(value)).toBeUndefined()
  })

  it('should return undefined from RSS feed without link', () => {
    const value = parseFeed(
      '<?xml version="1.0"?><rss version="2.0"><channel><title>Example</title></channel></rss>',
    )

    expect(getFeedSiteUrl(value)).toBeUndefined()
  })
})

describe('defaultResolveUrlFn', () => {
  it('should resolve relative URL with base URL', () => {
    const value = '/feed.xml'
    const baseUrl = 'https://example.com'
    const expected = 'https://example.com/feed.xml'

    expect(defaultResolveUrlFn(value, baseUrl)).toBe(expected)
  })

  it('should resolve relative URL with base URL containing path', () => {
    const value = 'feed.xml'
    const baseUrl = 'https://example.com/blog/'
    const expected = 'https://example.com/blog/feed.xml'

    expect(defaultResolveUrlFn(value, baseUrl)).toBe(expected)
  })

  it('should preserve absolute URL when base URL provided', () => {
    const value = 'https://other.com/feed.xml'
    const baseUrl = 'https://example.com'
    const expected = 'https://other.com/feed.xml'

    expect(defaultResolveUrlFn(value, baseUrl)).toBe(expected)
  })

  it('should return undefined when base URL is undefined and URL is relative', () => {
    const value = '/feed.xml'
    const baseUrl = undefined
    const expected = undefined

    expect(defaultResolveUrlFn(value, baseUrl)).toBe(expected)
  })

  it('should return absolute URL when base URL is undefined', () => {
    const value = 'https://example.com/feed.xml'
    const baseUrl = undefined
    const expected = 'https://example.com/feed.xml'

    expect(defaultResolveUrlFn(value, baseUrl)).toBe(expected)
  })

  it('should handle protocol-relative URLs', () => {
    const value = '//cdn.example.com/feed.xml'
    const baseUrl = 'https://example.com'
    const expected = 'https://cdn.example.com/feed.xml'

    expect(defaultResolveUrlFn(value, baseUrl)).toBe(expected)
  })

  it('should handle parent directory references', () => {
    const value = '../feed.xml'
    const baseUrl = 'https://example.com/blog/posts/'
    const expected = 'https://example.com/blog/feed.xml'

    expect(defaultResolveUrlFn(value, baseUrl)).toBe(expected)
  })
})

describe('defaultResolveSiteUrlFn', () => {
  const resolveUrlFn: DiscoverResolveUrlFn = (url, baseUrl) => {
    try {
      return new URL(url, baseUrl).href
    } catch {}
  }

  it('should return site URL from RSS feed with channel link', () => {
    const value = {
      url: 'https://example.com/feed.xml',
      content: `
        <?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <link>https://example.com</link>
          </channel>
        </rss>
      `,
    }
    const expected = 'https://example.com/'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should return site URL from Atom feed with alternate link', () => {
    const value = {
      url: 'https://example.com/feed.xml',
      content: `
        <?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <link rel="alternate" href="https://example.com"/>
        </feed>
      `,
    }
    const expected = 'https://example.com/'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should return site URL from JSON Feed with home_page_url', () => {
    const value = {
      url: 'https://example.com/feed.json',
      content: JSON.stringify({
        version: 'https://jsonfeed.org/version/1.1',
        title: 'Example',
        home_page_url: 'https://example.com',
        items: [],
      }),
    }
    const expected = 'https://example.com/'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should fall back to origin when feed has no site URL', () => {
    const value = {
      url: 'https://example.com/feed.xml',
      content: `
        <?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Test</title>
        </feed>
      `,
    }
    const expected = 'https://example.com'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should return undefined when resolved URL equals input URL', () => {
    const value = {
      url: 'https://example.com',
      content: `
        <?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <link>https://example.com</link>
          </channel>
        </rss>
      `,
    }

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBeUndefined()
  })

  it('should return undefined for non-feed content', () => {
    const value = {
      url: 'https://example.com',
      content: '<html><head></head><body></body></html>',
    }

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBeUndefined()
  })

  it('should return undefined for empty content', () => {
    const value = {
      url: 'https://example.com',
      content: '',
    }

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBeUndefined()
  })

  it('should return undefined for undefined content', () => {
    const value = {
      url: 'https://example.com',
    }

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBeUndefined()
  })

  it('should return site URL from RSS feed with atom:link alternate', () => {
    const value = {
      url: 'https://cdn.example.com/feed.xml',
      content: `
        <?xml version="1.0"?>
        <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
          <channel>
            <atom:link rel="alternate" href="https://example.com"/>
          </channel>
        </rss>
      `,
    }
    const expected = 'https://example.com/'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should resolve relative site URL from RSS feed against feed URL', () => {
    const value = {
      url: 'https://example.com/feed.xml',
      content: `
        <?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <link>/log/</link>
          </channel>
        </rss>
      `,
    }
    const expected = 'https://example.com/log/'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should resolve relative site URL from Atom feed against feed URL', () => {
    const value = {
      url: 'https://example.com/feed.xml',
      content: `
        <?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <link rel="alternate" href="/blog"/>
        </feed>
      `,
    }
    const expected = 'https://example.com/blog'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should resolve relative site URL from JSON Feed against feed URL', () => {
    const value = {
      url: 'https://example.com/feed.json',
      content: JSON.stringify({
        version: 'https://jsonfeed.org/version/1.1',
        title: 'Example',
        home_page_url: '/site/',
        items: [],
      }),
    }
    const expected = 'https://example.com/site/'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should strip fragment from resolved Atom feed site URL', () => {
    const value = {
      url: 'https://example.com/feed.xml',
      content: `
        <?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <link rel="alternate" href="https://example.com/#section"/>
        </feed>
      `,
    }
    const expected = 'https://example.com/'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should fall back to origin when Atom feed alternate link is fragment-only', () => {
    const value = {
      url: 'https://example.com/path/feed/atom/',
      content: `
        <?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <link rel="alternate" href="#respond"/>
        </feed>
      `,
    }
    const expected = 'https://example.com'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should fall back to origin when RSS channel link is fragment-only', () => {
    const value = {
      url: 'https://example.com/feed.xml',
      content: `
        <?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <link>#section</link>
          </channel>
        </rss>
      `,
    }
    const expected = 'https://example.com'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should strip fragment from resolved RSS feed site URL', () => {
    const value = {
      url: 'https://example.com/feed.xml',
      content: `
        <?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <link>https://example.com/blog#section</link>
          </channel>
        </rss>
      `,
    }
    const expected = 'https://example.com/blog'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })

  it('should fall back to origin when site URL resolves to feed URL', () => {
    const value = {
      url: 'https://example.com/feed.xml',
      content: `
        <?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <link rel="alternate" href="https://example.com/feed.xml"/>
        </feed>
      `,
    }
    const expected = 'https://example.com'

    expect(defaultResolveSiteUrlFn(value, resolveUrlFn)).toBe(expected)
  })
})

describe('normalizeMethodsConfig with siteInput', () => {
  const defaults = {
    feed: { extractUrls: () => [] as Array<string> },
    html: {
      linkSelectors: [{ rel: 'icon' }],
      anchorUris: [] as Array<string>,
      anchorIgnoredUris: [] as Array<string>,
      anchorLabels: [] as Array<string>,
    },
    headers: { linkSelectors: [{ rel: 'icon' }] },
    guess: { uris: ['/favicon.ico'] },
  }

  it('should use siteInput for html, headers, and guess methods', () => {
    const siteHeaders = new Headers({ 'content-type': 'text/html' })
    const value = {
      url: 'https://example.com/feed.xml',
      content: '<rss>feed content</rss>',
      headers: new Headers({ 'content-type': 'application/rss+xml' }),
    }
    const siteValue = {
      url: 'https://example.com',
      content: '<html><link rel="icon" href="/favicon.ico"></html>',
      headers: siteHeaders,
    }
    const expected = {
      html: {
        html: '<html><link rel="icon" href="/favicon.ico"></html>',
        options: {
          linkSelectors: [{ rel: 'icon' }],
          anchorUris: [],
          anchorIgnoredUris: [],
          anchorLabels: [],
          baseUrl: 'https://example.com',
        },
      },
      headers: {
        headers: siteHeaders,
        options: {
          linkSelectors: [{ rel: 'icon' }],
          baseUrl: 'https://example.com',
        },
      },
      guess: {
        options: {
          uris: ['/favicon.ico'],
          baseUrl: 'https://example.com',
        },
      },
    }
    const result = normalizeMethodsConfig(value, siteValue, ['html', 'headers', 'guess'], defaults)

    expect(result).toEqual(expected)
  })

  it('should use original input for feed method when siteInput provided', () => {
    const value = {
      url: 'https://example.com/feed.xml',
      content: '<rss>feed content</rss>',
      headers: new Headers(),
    }
    const siteValue = {
      url: 'https://example.com',
      content: '<html>site content</html>',
      headers: new Headers(),
    }
    const expected = {
      feed: {
        content: '<rss>feed content</rss>',
        options: {
          extractUrls: expect.any(Function),
        },
      },
    }
    const result = normalizeMethodsConfig(value, siteValue, ['feed'], defaults)

    expect(result).toEqual(expected)
  })

  it('should fall back to sourceInput when siteInput is undefined', () => {
    const value = {
      url: 'https://example.com',
      content: '<html>content</html>',
      headers: new Headers(),
    }
    const expected = {
      html: {
        html: '<html>content</html>',
        options: {
          linkSelectors: [{ rel: 'icon' }],
          anchorUris: [],
          anchorIgnoredUris: [],
          anchorLabels: [],
          baseUrl: 'https://example.com',
        },
      },
      guess: {
        options: {
          uris: ['/favicon.ico'],
          baseUrl: 'https://example.com',
        },
      },
    }
    const result = normalizeMethodsConfig(value, undefined, ['html', 'guess'], defaults)

    expect(result).toEqual(expected)
  })
})

describe('normalizeUriEntry', () => {
  const resolveUrlFn: DiscoverResolveUrlFn = (url, baseUrl) => {
    try {
      return new URL(url, baseUrl).href
    } catch {}
  }

  it('should normalize string entry', () => {
    const value = { uri: '/feed.xml' }
    const expected = { uri: 'https://example.com/feed.xml' }

    expect(normalizeUriEntry(value, resolveUrlFn, 'https://example.com')).toEqual(expected)
  })

  it('should normalize array entry', () => {
    const value = { uri: ['/feed/', '?feed=rss'] }
    const expected = { uri: ['https://example.com/feed/', 'https://example.com/?feed=rss'] }

    expect(normalizeUriEntry(value, resolveUrlFn, 'https://example.com')).toEqual(expected)
  })

  it('should apply resolveUrlFn to each alternative in array', () => {
    const value = { uri: ['/feed/atom/', '?feed=atom', '/rss.xml'] }
    const expected = {
      uri: [
        'https://example.com/feed/atom/',
        'https://example.com/?feed=atom',
        'https://example.com/rss.xml',
      ],
    }

    expect(normalizeUriEntry(value, resolveUrlFn, 'https://example.com')).toEqual(expected)
  })

  it('should handle undefined baseUrl for string entry', () => {
    const value = { uri: 'https://example.com/feed.xml' }
    const expected = { uri: 'https://example.com/feed.xml' }

    expect(normalizeUriEntry(value, resolveUrlFn, undefined)).toEqual(expected)
  })

  it('should handle undefined baseUrl for array entry', () => {
    const value = { uri: ['https://example.com/feed/', 'https://example.com/?feed=rss'] }
    const expected = { uri: ['https://example.com/feed/', 'https://example.com/?feed=rss'] }

    expect(normalizeUriEntry(value, resolveUrlFn, undefined)).toEqual(expected)
  })

  it('should handle single-element array', () => {
    const value = { uri: ['/feed.xml'] }
    const expected = { uri: ['https://example.com/feed.xml'] }

    expect(normalizeUriEntry(value, resolveUrlFn, 'https://example.com')).toEqual(expected)
  })

  it('should preserve hint on string entry', () => {
    const value = { uri: '/feed.xml', hint: { key: 'test:feed', label: 'Feed' } }
    const expected = {
      uri: 'https://example.com/feed.xml',
      hint: { key: 'test:feed', label: 'Feed' },
    }

    expect(normalizeUriEntry(value, resolveUrlFn, 'https://example.com')).toEqual(expected)
  })

  it('should preserve hint on array entry', () => {
    const value = { uri: ['/feed/', '?feed=rss'], hint: { key: 'test:feed', label: 'Feed' } }
    const expected = {
      uri: ['https://example.com/feed/', 'https://example.com/?feed=rss'],
      hint: { key: 'test:feed', label: 'Feed' },
    }

    expect(normalizeUriEntry(value, resolveUrlFn, 'https://example.com')).toEqual(expected)
  })
})
