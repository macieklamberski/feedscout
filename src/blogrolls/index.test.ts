import { describe, expect, it } from 'bun:test'
import locales from '../common/locales.json' with { type: 'json' }
import type { DiscoverFetchFn, DiscoverResult } from '../common/types.js'
import { urisBalanced, urisComprehensive, urisMinimal } from './defaults.js'
import { discoverBlogrolls } from './index.js'
import type { BlogrollResult } from './types.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: 200,
    statusText: 'OK',
  })
}

const opml = `
  <?xml version="1.0" encoding="UTF-8"?>
  <opml version="2.0">
    <head><title>My Blogroll</title></head>
    <body>
      <outline text="Example Blog" type="rss" xmlUrl="https://example.com/feed.xml"/>
    </body>
  </opml>
`

describe('discoverBlogrolls', () => {
  it('should find valid blogrolls using guess method with default URIs', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/blogroll.opml': opml,
    })
    const value = await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/blogroll.opml', '/opml.xml'] } },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/blogroll.opml',
        isValid: true,
        method: 'guess',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should detect OPML from content', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/.well-known/recommendations.opml': opml,
    })
    const value = await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/.well-known/recommendations.opml'] } },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/.well-known/recommendations.opml',
        isValid: true,
        method: 'guess',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should work with minimal blogroll URIs array', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/.well-known/recommendations.opml': opml,
      'https://example.com/blogroll.opml': opml,
    })
    const value = await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: urisMinimal } },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/.well-known/recommendations.opml',
        isValid: true,
        method: 'guess',
        title: 'My Blogroll',
      },
      {
        url: 'https://example.com/blogroll.opml',
        isValid: true,
        method: 'guess',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should work with balanced blogroll URIs array', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/subscriptions.opml': opml,
    })
    const value = await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: urisBalanced } },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/subscriptions.opml',
        isValid: true,
        method: 'guess',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should work with comprehensive blogroll URIs array', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/links.opml': opml,
      'https://example.com/feeds.opml': opml,
    })
    const value = await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: urisComprehensive } },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/links.opml',
        isValid: true,
        method: 'guess',
        title: 'My Blogroll',
      },
      {
        url: 'https://example.com/feeds.opml',
        isValid: true,
        method: 'guess',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover blogrolls from HTML link elements with rel="blogroll"', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/my-blogroll.opml': opml,
    })
    const value = await discoverBlogrolls(
      {
        url: 'https://example.com',
        content: '<link rel="blogroll" href="/my-blogroll.opml">',
      },
      {
        methods: { html: true },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/my-blogroll.opml',
        isValid: true,
        method: 'html',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover blogrolls from HTML link elements with rel="outline"', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/subscriptions.opml': opml,
    })
    const value = await discoverBlogrolls(
      {
        url: 'https://example.com',
        content: '<link rel="outline" type="text/x-opml" href="/subscriptions.opml">',
      },
      {
        methods: { html: true },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/subscriptions.opml',
        isValid: true,
        method: 'html',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover blogrolls from HTML link elements with rel="alternate" and OPML type', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/blogroll.opml': opml,
    })
    const value = await discoverBlogrolls(
      {
        url: 'https://example.com',
        content:
          '<link rel="alternate" type="application/opml+xml" title="Outline" href="/blogroll.opml">',
      },
      {
        methods: { html: true },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/blogroll.opml',
        isValid: true,
        method: 'html',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should not discover regular feeds advertised as rel="alternate" with a feed MIME type', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/feed.xml': opml,
    })
    const value = await discoverBlogrolls(
      {
        url: 'https://example.com',
        content: '<link rel="alternate" type="application/rss+xml" href="/feed.xml">',
      },
      {
        methods: { html: true },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = []

    expect(value).toEqual(expected)
  })

  it('should discover blogrolls from anchor elements with .opml href', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/reading-list.opml': opml,
    })
    const value = await discoverBlogrolls(
      {
        url: 'https://example.com',
        content: '<a href="/reading-list.opml">My Reading List</a>',
      },
      {
        methods: { html: true },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/reading-list.opml',
        isValid: true,
        method: 'html',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover blogrolls from anchor elements with blogroll label', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/links': opml,
    })
    const value = await discoverBlogrolls(
      {
        url: 'https://example.com',
        content: '<a href="/links">My Blogroll</a>',
      },
      {
        methods: { html: true },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/links',
        isValid: true,
        method: 'html',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover blogrolls from Link header with rel="blogroll"', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/blogroll.opml': opml,
    })
    const headers = new Headers({
      Link: '</blogroll.opml>; rel="blogroll"',
    })
    const value = await discoverBlogrolls(
      { url: 'https://example.com', headers },
      {
        methods: ['headers'],
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/blogroll.opml',
        isValid: true,
        method: 'headers',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover blogrolls from Link header with rel="outline" and OPML type', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/subscriptions.opml': opml,
    })
    const headers = new Headers({
      Link: '</subscriptions.opml>; rel="outline"; type="text/x-opml"',
    })
    const value = await discoverBlogrolls(
      { url: 'https://example.com', headers },
      {
        methods: ['headers'],
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/subscriptions.opml',
        isValid: true,
        method: 'headers',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should throw error when html method requested without content', () => {
    const mockFetch = createMockFetch({})
    const throwing = () =>
      discoverBlogrolls({ url: 'https://example.com' }, { methods: ['html'], fetchFn: mockFetch })

    expect(throwing()).rejects.toThrow(locales.errors.htmlMethodRequiresContent)
  })

  it('should test additional base URLs alongside main baseUrl', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/blogroll.opml': opml,
      'https://www.example.com/blogroll.opml': opml,
    })
    const value = await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: {
          guess: {
            uris: ['/blogroll.opml'],
            additionalBaseUrls: ['https://www.example.com'],
          },
        },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/blogroll.opml',
        isValid: true,
        method: 'guess',
        title: 'My Blogroll',
      },
      {
        url: 'https://www.example.com/blogroll.opml',
        isValid: true,
        method: 'guess',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should filter out invalid results when fetchFn returns 404', async () => {
    const mockFetch: DiscoverFetchFn = async (url: string) => ({
      headers: new Headers(),
      body: 'Not Found',
      url,
      status: 404,
      statusText: 'Not Found',
    })
    const value = await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/blogroll.opml'] } },
        fetchFn: mockFetch,
      },
    )

    expect(value).toEqual([])
  })

  it('should filter out invalid results for valid HTTP 200 with invalid OPML', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/blogroll.opml': '<!DOCTYPE html><html><body>Not OPML</body></html>',
    })
    const value = await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/blogroll.opml'] } },
        fetchFn: mockFetch,
      },
    )

    expect(value).toEqual([])
  })

  it('should return empty array when no blogrolls found', async () => {
    const mockFetch = createMockFetch({})
    const value = await discoverBlogrolls(
      {
        url: 'https://example.com',
        content: '<html><head></head><body>No blogrolls here</body></html>',
      },
      {
        methods: { html: true },
        fetchFn: mockFetch,
      },
    )

    expect(value).toEqual([])
  })

  it('should fall back to guess method when initial URL fetch throws', async () => {
    const fetchFn: DiscoverFetchFn = (url: string) => {
      if (url === 'https://example.com/') {
        throw new Error('Connection refused')
      }

      return Promise.resolve({
        headers: new Headers(),
        body: url === 'https://example.com/blogroll.opml' ? opml : '',
        url,
        status: url === 'https://example.com/blogroll.opml' ? 200 : 404,
        statusText: url === 'https://example.com/blogroll.opml' ? 'OK' : 'Not Found',
      })
    }
    const value = await discoverBlogrolls('https://example.com/', {
      methods: ['guess'],
      fetchFn,
    })
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/blogroll.opml',
        isValid: true,
        method: 'guess',
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })
})
