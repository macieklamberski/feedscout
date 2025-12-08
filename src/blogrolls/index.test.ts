import { describe, expect, it } from 'bun:test'
import locales from '../common/locales.json' with { type: 'json' }
import type { DiscoverFetchFn, DiscoverProgress, DiscoverResult } from '../common/types.js'
import { urisBalanced, urisComprehensive, urisMinimal } from './defaults.js'
import { discoverBlogrolls } from './index.js'
import type { BlogrollResult } from './types.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  })
}

const opml = `<?xml version="1.0" encoding="UTF-8"?>
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
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should stop on first valid blogroll when stopOnFirstResult is true', async () => {
    let fetchCount = 0
    const mockFetch: DiscoverFetchFn = async (url) => {
      fetchCount++
      return {
        url,
        body: opml,
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }
    const value = await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/blogroll1.opml', '/blogroll2.opml', '/blogroll3.opml'] } },
        fetchFn: mockFetch,
        stopOnFirstResult: true,
        concurrency: 1,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/blogroll1.opml',
        isValid: true,
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
    expect(fetchCount).toBe(1)
  })

  it('should call onProgress callback with correct updates', async () => {
    const progressUpdates: Array<DiscoverProgress> = []
    const mockFetch = createMockFetch({
      'https://example.com/blogroll.opml': opml,
    })

    await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/blogroll.opml', '/opml.xml'] } },
        fetchFn: mockFetch,
        onProgress: (progress) => {
          progressUpdates.push(progress)
        },
      },
    )
    const expected: Array<DiscoverProgress> = [
      {
        tested: 1,
        total: 2,
        found: 1,
        current: 'https://example.com/blogroll.opml',
      },
      {
        tested: 2,
        total: 2,
        found: 1,
        current: 'https://example.com/opml.xml',
      },
    ]

    expect(progressUpdates).toEqual(expected)
  })

  it('should handle fetch errors gracefully', async () => {
    const mockFetch: DiscoverFetchFn = async () => {
      throw new Error('Network error')
    }
    const value = await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/blogroll.opml'] } },
        fetchFn: mockFetch,
      },
    )

    expect(value).toEqual([])
  })

  it('should include errors when includeInvalid is true', async () => {
    const mockFetch: DiscoverFetchFn = async () => {
      throw new Error('Network error')
    }
    const value = await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/blogroll.opml'] } },
        fetchFn: mockFetch,
        includeInvalid: true,
      },
    )
    const expected: Array<DiscoverResult<BlogrollResult>> = [
      {
        url: 'https://example.com/blogroll.opml',
        isValid: false,
      },
    ]

    expect(value).toMatchObject(expected)
  })

  it('should respect concurrency limit', async () => {
    let maxConcurrent = 0
    let currentConcurrent = 0
    const mockFetch: DiscoverFetchFn = async (url) => {
      currentConcurrent++
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
      await new Promise((resolve) => {
        return setTimeout(resolve, 50)
      })
      currentConcurrent--
      return {
        url,
        body: opml,
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }

    await discoverBlogrolls(
      { url: 'https://example.com' },
      {
        methods: {
          guess: {
            uris: ['/blogroll1.opml', '/blogroll2.opml', '/blogroll3.opml', '/blogroll4.opml'],
          },
        },
        fetchFn: mockFetch,
        concurrency: 2,
      },
    )

    expect(maxConcurrent).toBe(2)
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

    expect(value.length).toBe(2)
    expect(value[0].isValid).toBe(true)
    expect(value[1].isValid).toBe(true)
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

    expect(value.length).toBe(2)
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
        title: 'My Blogroll',
      },
    ]

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
        title: 'My Blogroll',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should combine URIs from multiple methods', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/blogroll.opml': opml,
      'https://example.com/opml.xml': opml,
    })
    const value = await discoverBlogrolls(
      {
        url: 'https://example.com',
        content: '<link rel="blogroll" href="/blogroll.opml">',
      },
      {
        methods: {
          html: true,
          guess: { uris: ['/opml.xml'] },
        },
        fetchFn: mockFetch,
      },
    )

    expect(value.length).toBe(2)
  })

  it('should deduplicate URIs across multiple methods', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/blogroll.opml': opml,
    })
    const value = await discoverBlogrolls(
      {
        url: 'https://example.com',
        content: '<link rel="blogroll" href="/blogroll.opml">',
      },
      {
        methods: {
          html: true,
          guess: { uris: ['/blogroll.opml'] },
        },
        fetchFn: mockFetch,
      },
    )

    expect(value.length).toBe(1)
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

    expect(value.length).toBe(2)
  })

  it('should throw error when html method requested without content', () => {
    const throwing = () => discoverBlogrolls({ url: 'https://example.com' }, { methods: ['html'] })

    expect(throwing).toThrow(locales.errors.htmlMethodRequiresContent)
  })

  it('should throw error when headers method requested without headers', () => {
    const throwing = () =>
      discoverBlogrolls({ url: 'https://example.com' }, { methods: ['headers'] })

    expect(throwing).toThrow(locales.errors.headersMethodRequiresHeaders)
  })

  it('should throw error when guess method requested without url', () => {
    // @ts-expect-error: This is for testing purposes.
    const throwing = () => discoverBlogrolls({ content: '<html></html>' }, { methods: ['guess'] })

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })
})
