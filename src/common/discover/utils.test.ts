import { describe, expect, it } from 'bun:test'
import locales from '../locales.json' with { type: 'json' }
import type { DiscoverFetchFn } from '../types.js'
import { normalizeInput, normalizeMethodsConfig } from './utils.js'

describe('normalizeInput', () => {
  const fetchFn: DiscoverFetchFn = async (url) => {
    return {
      url,
      body: '<html>content</html>',
      headers: new Headers({ 'content-type': 'text/html' }),
      status: 200,
      statusText: 'OK',
    }
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
    const redirectFetchFn: DiscoverFetchFn = async () => {
      return {
        url: 'https://example.com/redirected',
        body: '<html>content</html>',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }
    const expected = {
      url: 'https://example.com/redirected',
      content: '<html>content</html>',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', redirectFetchFn)).toEqual(expected)
  })

  it('should handle ReadableStream body by converting to empty string', async () => {
    const streamFetchFn: DiscoverFetchFn = async (url) => {
      return {
        url,
        body: new ReadableStream(),
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }
    const expected = {
      url: 'https://example.com',
      content: '',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', streamFetchFn)).toEqual(expected)
  })

  it('should preserve headers from fetch response', async () => {
    const headers = new Headers({ 'content-type': 'text/html', link: '</feed>; rel="alternate"' })
    const headersFetchFn: DiscoverFetchFn = async (url) => {
      return {
        url,
        body: '<html></html>',
        headers,
        status: 200,
        statusText: 'OK',
      }
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
    const emptyFetchFn: DiscoverFetchFn = async (url) => {
      return {
        url,
        body: '',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
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
    const trackingFetchFn: DiscoverFetchFn = async (url) => {
      fetchCalled = true
      return {
        url,
        body: '<html></html>',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }
    const value = {
      url: 'https://example.com',
      content: '<html>existing</html>',
    }

    await normalizeInput(value, trackingFetchFn)

    expect(fetchCalled).toBe(false)
  })

  it('should handle fetch response with different status codes', async () => {
    const statusFetchFn: DiscoverFetchFn = async (url) => {
      return {
        url,
        body: '<html>content</html>',
        headers: new Headers(),
        status: 301,
        statusText: 'Moved Permanently',
      }
    }
    const expected = {
      url: 'https://example.com',
      content: '<html>content</html>',
      headers: expect.any(Headers),
    }

    expect(await normalizeInput('https://example.com', statusFetchFn)).toEqual(expected)
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
  const defaults = {
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

  it('should normalize array with single method to config with defaults', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
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

    expect(normalizeMethodsConfig(value, ['html'], defaults)).toEqual(expected)
  })

  it('should normalize array with multiple methods to config with defaults', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers,
    }
    const result = normalizeMethodsConfig(value, ['html', 'headers', 'guess'], defaults)
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

    expect(normalizeMethodsConfig(value, { html: true }, defaults)).toEqual(expected)
  })

  it('should normalize object with custom options and merge with defaults', () => {
    const value = {
      url: 'https://example.com',
    }
    const expected = {
      guess: {
        options: {
          uris: ['/custom-feed'],
          baseUrl: 'https://example.com',
        },
      },
    }

    expect(normalizeMethodsConfig(value, { guess: { uris: ['/custom-feed'] } }, defaults)).toEqual(
      expected,
    )
  })

  it('should normalize mixed object with true and custom options', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const result = normalizeMethodsConfig(
      value,
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
    const expected = {}

    expect(normalizeMethodsConfig(value, [], defaults)).toEqual(expected)
  })

  it('should handle empty object', () => {
    const value = {
      url: 'https://example.com',
    }
    const expected = {}

    expect(normalizeMethodsConfig(value, {}, defaults)).toEqual(expected)
  })

  it('should include baseUrl from input in all method configs', () => {
    const headers = new Headers()
    const value = {
      url: 'https://blog.example.com',
      content: '<html></html>',
      headers,
    }
    const result = normalizeMethodsConfig(value, ['html', 'headers', 'guess'], defaults)
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
    const result = normalizeMethodsConfig(value, ['headers'], defaults)
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
    const result = normalizeMethodsConfig(value, ['html'], defaults)
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
    const result = normalizeMethodsConfig(value, { html: customOptions }, defaults)
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
    const result = normalizeMethodsConfig(value, ['html', 'headers', 'guess'], defaults)
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

  it('should throw error when html method requested without content', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, ['html'], defaults)

    expect(throwing).toThrow(locales.errors.htmlMethodRequiresContent)
  })

  it('should throw error when headers method requested without headers', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, ['headers'], defaults)

    expect(throwing).toThrow(locales.errors.headersMethodRequiresHeaders)
  })

  it('should throw error when guess method requested without url', () => {
    const value = {
      url: '',
      content: '<html></html>',
    }
    const throwing = () => normalizeMethodsConfig(value, ['guess'], defaults)

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })

  it('should throw error when html method in object format without content', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, { html: true }, defaults)

    expect(throwing).toThrow(locales.errors.htmlMethodRequiresContent)
  })

  it('should throw error when headers method in object format without headers', () => {
    const value = {
      url: 'https://example.com',
    }
    const throwing = () => normalizeMethodsConfig(value, { headers: true }, defaults)

    expect(throwing).toThrow(locales.errors.headersMethodRequiresHeaders)
  })

  it('should throw error when guess method in object format without url', () => {
    const value = {
      url: '',
    }
    const throwing = () => normalizeMethodsConfig(value, { guess: true }, defaults)

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })

  it('should return complete html config with all default values', () => {
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
    }
    const result = normalizeMethodsConfig(value, ['html'], defaults)
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
    const result = normalizeMethodsConfig(value, ['headers'], defaults)
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
    const result = normalizeMethodsConfig(value, ['guess'], defaults)
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
    const result = normalizeMethodsConfig(value, { guess: { uris: ['/custom-feed'] } }, defaults)
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
    const result = normalizeMethodsConfig(value, ['html'], defaults)
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
    const throwing = () => normalizeMethodsConfig(value, ['guess'], defaults)

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })

  it('should return all three method configs with complete defaults', () => {
    const headers = new Headers()
    const value = {
      url: 'https://example.com',
      content: '<html></html>',
      headers,
    }
    const result = normalizeMethodsConfig(value, ['html', 'headers', 'guess'], defaults)
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
