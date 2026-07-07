import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { parseFeed } from 'feedsmith'
import locales from '../locales.json' with { type: 'json' }
import type {
  DiscoverFetchFn,
  DiscoverMethodsConfig,
  DiscoverMethodsConfigDefaults,
  DiscoverResolveUrlFn,
} from '../types.js'
import { defaultFetchFn, defaultResolveSiteUrlFn, defaultResolveUrlFn } from './defaults.js'
import {
  getFeedSiteUrl,
  normalizeInput,
  normalizeMethodsConfig,
  normalizeUriEntry,
} from './utils.js'

describe('defaultFetchFn', () => {
  type MockResponse = Pick<Response, 'headers' | 'text' | 'url' | 'status' | 'statusText'>

  type MockFetchImplementation = (
    url: string,
    options?: RequestInit,
  ) => MockResponse | Promise<MockResponse>

  const createFetchMock = (implementation: MockFetchImplementation): typeof fetch => {
    const fetchMock = async (input: URL | RequestInfo, init?: RequestInit) => {
      return (await implementation(input.toString(), init)) as Response
    }

    return fetchMock as typeof fetch
  }

  const createMockResponse = (partial: Partial<MockResponse>): MockResponse => {
    return {
      headers: partial.headers ?? new Headers(),
      text: partial.text ?? (async () => ''),
      url: partial.url ?? '',
      status: partial.status ?? 200,
      statusText: partial.statusText ?? 'OK',
    }
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
    const expected = {
      url: 'https://example.com/feed.xml',
      body: 'response body',
      headers: expect.any(Headers),
      status: 200,
      statusText: 'OK',
    }

    expect(await defaultFetchFn('https://example.com/feed.xml')).toEqual(expected)
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
    const expected = {
      url: 'https://redirect.example.com/feed.xml',
      body: '',
      headers: expect.any(Headers),
      status: 200,
      statusText: 'OK',
    }

    expect(await defaultFetchFn('https://example.com/feed.xml')).toEqual(expected)
  })

  it('should convert response body to text', async () => {
    fetchSpy.mockImplementation(
      createFetchMock(() => {
        return createMockResponse({
          text: async () => '<rss>feed content</rss>',
        })
      }),
    )
    const expected = {
      url: '',
      body: '<rss>feed content</rss>',
      headers: expect.any(Headers),
      status: 200,
      statusText: 'OK',
    }

    expect(await defaultFetchFn('https://example.com/feed.xml')).toEqual(expected)
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
    const expected = {
      url: '',
      body: '',
      headers: expect.any(Headers),
      status: 404,
      statusText: 'Not Found',
    }

    expect(await defaultFetchFn('https://example.com/feed.xml')).toEqual(expected)
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
    const expected = {
      url: 'https://example.com',
      content: '<html></html>',
      headers,
    }

    expect(await normalizeInput('https://example.com', headersFetchFn)).toEqual(expected)
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
    const expected = { url: 'https://example.com' }

    expect(await normalizeInput('https://example.com', throwingFetchFn)).toEqual(expected)
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
  const extractUrls = (): Array<string> => []
  const defaults: DiscoverMethodsConfigDefaults = {
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
  }
  const expectedHtmlOptions = {
    linkSelectors,
    anchorUris: feedUrisComprehensive,
    anchorIgnoredUris: ignoredUris,
    anchorLabels,
    baseUrl: 'https://example.com',
  }
  const expectedHeadersOptions = {
    linkSelectors,
    baseUrl: 'https://example.com',
  }
  const expectedGuessOptions = {
    uris: feedUrisBalanced,
    baseUrl: 'https://example.com',
  }

  it('should normalize array with single method to config with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const expected = {
      html: {
        html: '<html></html>',
        options: expectedHtmlOptions,
      },
    }

    expect(normalizeMethodsConfig(value, undefined, ['html'], defaults)).toEqual(expected)
  })

  it('should normalize array with multiple methods to config with defaults', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers,
    }
    const methods: DiscoverMethodsConfig = ['html', 'headers', 'guess']
    const expected = {
      html: {
        html: '<html></html>',
        options: expectedHtmlOptions,
      },
      headers: {
        headers,
        options: expectedHeadersOptions,
      },
      guess: {
        options: expectedGuessOptions,
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
  })

  it('should normalize object with true values to config with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const expected = {
      html: {
        html: '<html></html>',
        options: expectedHtmlOptions,
      },
    }

    expect(normalizeMethodsConfig(value, undefined, { html: true }, defaults)).toEqual(expected)
  })

  it('should normalize object with custom options and merge with defaults', () => {
    const value = {
      url: 'https://example.com',
    }
    const methods: DiscoverMethodsConfig = { guess: { uris: ['/custom-feed'] } }
    const expected = {
      guess: {
        options: {
          ...expectedGuessOptions,
          uris: ['/custom-feed'],
        },
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
  })

  it('should normalize mixed object with true and custom options', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const methods: DiscoverMethodsConfig = { html: true, guess: { uris: ['/custom'] } }
    const expected = {
      html: {
        html: '<html></html>',
        options: expectedHtmlOptions,
      },
      guess: {
        options: {
          ...expectedGuessOptions,
          uris: ['/custom'],
        },
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
  })

  it('should override default options with custom options', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const methods: DiscoverMethodsConfig = { html: { anchorLabels: ['custom-label'] } }
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          ...expectedHtmlOptions,
          anchorLabels: ['custom-label'],
        },
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
  })

  it('should handle empty array', () => {
    const value = {
      url: 'https://example.com',
    }
    const expected = {}

    expect(normalizeMethodsConfig(value, undefined, [], defaults)).toEqual(expected)
  })

  it('should handle empty object', () => {
    const value = {
      url: 'https://example.com',
    }
    const expected = {}

    expect(normalizeMethodsConfig(value, undefined, {}, defaults)).toEqual(expected)
  })

  it('should include baseUrl from input in all method configs', () => {
    const headers = new Headers()
    const value = {
      url: 'https://blog.example.com',
      content: '<html></html>',
      headers,
    }
    const methods: DiscoverMethodsConfig = ['html', 'headers', 'guess']
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          ...expectedHtmlOptions,
          baseUrl: 'https://blog.example.com',
        },
      },
      headers: {
        headers,
        options: {
          ...expectedHeadersOptions,
          baseUrl: 'https://blog.example.com',
        },
      },
      guess: {
        options: {
          ...expectedGuessOptions,
          baseUrl: 'https://blog.example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
  })

  it('should pass headers object to headers method config', () => {
    const headers = new Headers({ 'content-type': 'text/html' })
    const value = {
      url: 'https://example.com',
      headers,
    }
    const expected = {
      headers: {
        headers,
        options: expectedHeadersOptions,
      },
    }

    expect(normalizeMethodsConfig(value, undefined, ['headers'], defaults)).toEqual(expected)
  })

  it('should pass html content to html method config', () => {
    const htmlContent =
      '<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml" /></head></html>'
    const value = {
      url: 'https://example.com',
      content: htmlContent,
    }
    const expected = {
      html: {
        html: htmlContent,
        options: expectedHtmlOptions,
      },
    }

    expect(normalizeMethodsConfig(value, undefined, ['html'], defaults)).toEqual(expected)
  })

  it('should preserve custom options when merging with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const methods: DiscoverMethodsConfig = {
      html: {
        anchorLabels: ['custom1', 'custom2'],
        anchorUris: ['/custom-feed'],
      },
    }
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          ...expectedHtmlOptions,
          anchorUris: ['/custom-feed'],
          anchorLabels: ['custom1', 'custom2'],
        },
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
  })

  it('should handle all three methods with object format', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers,
    }
    const methods: DiscoverMethodsConfig = { html: true, headers: true, guess: true }
    const expected = {
      html: {
        html: '<html></html>',
        options: expectedHtmlOptions,
      },
      headers: {
        headers,
        options: expectedHeadersOptions,
      },
      guess: {
        options: expectedGuessOptions,
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
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
    const expected = {
      feed: {
        content: '<feed>content</feed>',
        options: {
          extractUrls,
        },
      },
    }

    expect(normalizeMethodsConfig(value, undefined, ['feed'], defaults)).toEqual(expected)
  })

  it('should normalize feed method with custom extractUrls', () => {
    const customExtractUrls = () => ['https://example.com/icon.png']
    const value = {
      url: 'https://example.com',
      content: '<feed>content</feed>',
    }
    const methods: DiscoverMethodsConfig = { feed: { extractUrls: customExtractUrls } }
    const expected = {
      feed: {
        content: '<feed>content</feed>',
        options: {
          extractUrls: customExtractUrls,
        },
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
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

  it('should return complete headers config with all default values', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      headers,
    }
    const expected = {
      headers: {
        headers,
        options: expectedHeadersOptions,
      },
    }

    expect(normalizeMethodsConfig(value, undefined, ['headers'], defaults)).toEqual(expected)
  })

  it('should return complete guess config with all default values', () => {
    const value = {
      url: 'https://example.com',
    }
    const expected = {
      guess: {
        options: expectedGuessOptions,
      },
    }

    expect(normalizeMethodsConfig(value, undefined, ['guess'], defaults)).toEqual(expected)
  })

  it('should keep all defaults when overriding html anchorUris', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const methods: DiscoverMethodsConfig = { html: { anchorUris: ['/custom-feed'] } }
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          ...expectedHtmlOptions,
          anchorUris: ['/custom-feed'],
        },
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
  })

  it('should keep all defaults when overriding html anchorIgnoredUris', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const methods: DiscoverMethodsConfig = { html: { anchorIgnoredUris: ['custom-ignore'] } }
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          ...expectedHtmlOptions,
          anchorIgnoredUris: ['custom-ignore'],
        },
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
  })

  it('should keep all defaults when overriding html linkSelectors', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const customSelectors = [{ rel: 'custom', types: ['custom/mime'] }]
    const methods: DiscoverMethodsConfig = { html: { linkSelectors: customSelectors } }
    const expected = {
      html: {
        html: '<html></html>',
        options: {
          ...expectedHtmlOptions,
          linkSelectors: customSelectors,
        },
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
  })

  it('should keep all defaults when overriding headers linkSelectors', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      headers,
    }
    const customSelectors = [{ rel: 'custom', types: ['custom/mime'] }]
    const methods: DiscoverMethodsConfig = { headers: { linkSelectors: customSelectors } }
    const expected = {
      headers: {
        headers,
        options: {
          ...expectedHeadersOptions,
          linkSelectors: customSelectors,
        },
      },
    }

    expect(normalizeMethodsConfig(value, undefined, methods, defaults)).toEqual(expected)
  })

  it('should handle empty string content for html method', () => {
    const value = {
      url: 'https://example.com',
      content: '',
    }
    const expected = {
      html: {
        html: '',
        options: expectedHtmlOptions,
      },
    }

    expect(normalizeMethodsConfig(value, undefined, ['html'], defaults)).toEqual(expected)
  })

  it('should handle undefined url as falsy', () => {
    const value = {
      content: '<html></html>',
    }
    // @ts-expect-error: This is for testing purposes.
    const throwing = () => normalizeMethodsConfig(value, undefined, ['guess'], defaults)

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })

  it.todo('should omit method entry when defaults lack that method', () => {
    // Request a method (e.g. ['html']) with a defaults object that has no html entry.
    // Expected: the returned config omits the method instead of throwing.
  })

  describe('siteInput', () => {
    const siteDefaults: DiscoverMethodsConfigDefaults = {
      feed: { extractUrls: () => [] },
      html: {
        linkSelectors: [{ rel: 'icon' }],
        anchorUris: [],
        anchorIgnoredUris: [],
        anchorLabels: [],
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
      const methods: DiscoverMethodsConfig = ['html', 'headers', 'guess']
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

      expect(normalizeMethodsConfig(value, siteValue, methods, siteDefaults)).toEqual(expected)
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

      expect(normalizeMethodsConfig(value, siteValue, ['feed'], siteDefaults)).toEqual(expected)
    })

    it('should fall back to sourceInput when siteInput is undefined', () => {
      const value = {
        url: 'https://example.com',
        content: '<html>content</html>',
        headers: new Headers(),
      }
      const methods: DiscoverMethodsConfig = ['html', 'guess']
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

      expect(normalizeMethodsConfig(value, undefined, methods, siteDefaults)).toEqual(expected)
    })
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
      '<?xml version="1.0"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><link>https://fallback.example.com</link><atom:link rel="alternate" href="https://preferred.example.com"/></channel></rss>',
    )
    const expected = 'https://preferred.example.com'

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

  it('should return site URL from RDF feed with channel link', () => {
    const value = parseFeed(
      '<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/"><channel><title>Example</title><link>https://example.com</link></channel></rdf:RDF>',
    )
    const expected = 'https://example.com'

    expect(getFeedSiteUrl(value)).toBe(expected)
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
    const value = 'https://other.example.com/feed.xml'
    const baseUrl = 'https://example.com'
    const expected = 'https://other.example.com/feed.xml'

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

  it('should keep original string uri when resolveUrlFn returns undefined', () => {
    const resolveNothingFn: DiscoverResolveUrlFn = () => undefined
    const value = { uri: '/feed.xml' }
    const expected = { uri: '/feed.xml' }

    expect(normalizeUriEntry(value, resolveNothingFn, undefined)).toEqual(expected)
  })

  it('should keep original array uris when resolveUrlFn returns undefined', () => {
    const resolveNothingFn: DiscoverResolveUrlFn = () => undefined
    const value = { uri: ['/feed/', '?feed=rss'] }
    const expected = { uri: ['/feed/', '?feed=rss'] }

    expect(normalizeUriEntry(value, resolveNothingFn, undefined)).toEqual(expected)
  })
})
