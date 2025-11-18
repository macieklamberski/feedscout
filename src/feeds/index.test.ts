import { describe, expect, it } from 'bun:test'
import type { FeedInfo, FetchFnResponse, Progress } from '../common/types.js'
import locales from '../locales.json' with { type: 'json' }
import { feedUrisBalanced, feedUrisComprehensive, feedUrisMinimal } from '../methods/guess/index.js'
import { discoverFeeds } from './index.js'

const createMockFetch = (
  responses: Record<string, string>,
): ((url: string) => Promise<FetchFnResponse>) => {
  return async (url: string): Promise<FetchFnResponse> => {
    const body = responses[url] ?? ''
    return {
      url,
      body,
      headers: new Headers(),
      status: 200,
      statusText: 'OK',
    }
  }
}

describe('discoverFeeds', () => {
  it('should find valid feeds using guess method with default URIs', async () => {
    const rss = '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const atom = '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>'
    const mockFetch = createMockFetch({
      'https://example.com/feed': rss,
      'https://example.com/atom': atom,
    })

    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { feedUris: ['/feed', '/atom', '/rss'] } },
        fetchFn: mockFetch,
      },
    )

    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/feed',
        isFeed: true,
        format: 'rss',
      },
      {
        url: 'https://example.com/atom',
        isFeed: true,
        format: 'atom',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should detect feed format from content', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/feed':
        '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>',
    })

    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { feedUris: ['/feed'] } },
        fetchFn: mockFetch,
      },
    )

    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/feed',
        isFeed: true,
        format: 'rss',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should stop on first valid feed when stopOnFirst is true', async () => {
    let fetchCount = 0
    const mockFetch = async (url: string): Promise<FetchFnResponse> => {
      fetchCount++
      return {
        url,
        body: '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { feedUris: ['/feed1', '/feed2', '/feed3', '/feed4', '/feed5'] } },
        fetchFn: mockFetch,
        stopOnFirst: true,
        concurrency: 1,
      },
    )

    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/feed1',
        isFeed: true,
        format: 'rss',
      },
    ]

    expect(value).toEqual(expected)
    expect(fetchCount).toBe(1)
  })

  it('should call onProgress callback with correct updates', async () => {
    const progressUpdates: Array<{
      tested: number
      total: number
      found: number
      current: string
    }> = []
    const mockFetch = createMockFetch({
      'https://example.com/feed':
        '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>',
    })

    await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { feedUris: ['/feed', '/rss'] } },
        fetchFn: mockFetch,
        onProgress: (progress) => {
          progressUpdates.push(progress)
        },
      },
    )

    const expected: Array<Progress> = [
      {
        tested: 1,
        total: 2,
        found: 1,
        current: 'https://example.com/feed',
      },
      {
        tested: 2,
        total: 2,
        found: 1,
        current: 'https://example.com/rss',
      },
    ]

    expect(progressUpdates).toEqual(expected)
  })

  it('should handle fetch errors gracefully', async () => {
    const mockFetch = async (_url: string): Promise<FetchFnResponse> => {
      throw new Error('Network error')
    }
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { feedUris: ['/feed'] } },
        fetchFn: mockFetch,
      },
    )

    expect(value).toEqual([])
  })

  it('should include errors when includeInvalid is true', async () => {
    const mockFetch = async (_url: string): Promise<FetchFnResponse> => {
      throw new Error('Network error')
    }
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { feedUris: ['/feed'] } },
        fetchFn: mockFetch,
        includeInvalid: true,
      },
    )
    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/feed',
        isFeed: false,
      },
    ]

    expect(value).toMatchObject(expected)
  })

  it('should use custom extractor when provided', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/feed': 'custom feed content',
    })
    const customExtractor = async ({
      url,
      content,
    }: {
      url: string
      content: string
    }): Promise<FeedInfo> => {
      const isFeed = content.includes('custom feed')
      if (isFeed) {
        return {
          url,
          isFeed: true,
          format: 'rss',
        }
      }
      return {
        url,
        isFeed: false,
      }
    }
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { feedUris: ['/feed'] } },
        fetchFn: mockFetch,
        extractFn: customExtractor,
      },
    )

    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/feed',
        isFeed: true,
        format: 'rss',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should respect concurrency limit', async () => {
    let maxConcurrent = 0
    let currentConcurrent = 0
    const mockFetch = async (url: string): Promise<FetchFnResponse> => {
      currentConcurrent++
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
      await new Promise((resolve) => {
        return setTimeout(resolve, 50)
      })
      currentConcurrent--
      return {
        url,
        body: '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }

    await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { feedUris: ['/feed1', '/feed2', '/feed3', '/feed4', '/feed5'] } },
        fetchFn: mockFetch,
        concurrency: 2,
      },
    )

    expect(maxConcurrent).toBe(2)
  })

  it('should work with minimal feed URIs array', async () => {
    const rss = '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const mockFetch = createMockFetch({
      'https://example.com/feed': rss,
      'https://example.com/rss': rss,
    })

    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { feedUris: feedUrisMinimal } },
        fetchFn: mockFetch,
      },
    )

    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/feed',
        isFeed: true,
        format: 'rss',
      },
      {
        url: 'https://example.com/rss',
        isFeed: true,
        format: 'rss',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should work with balanced feed URIs array', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/feed.json': '{"version":"https://jsonfeed.org/version/1.1"}',
    })

    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { feedUris: feedUrisBalanced } },
        fetchFn: mockFetch,
      },
    )

    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/feed.json',
        isFeed: true,
        format: 'json',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should work with comprehensive feed URIs array', async () => {
    const rss = '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const mockFetch = createMockFetch({
      'https://example.com/?feed=rss': rss,
      'https://example.com/feeds/posts/default': rss,
    })

    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { feedUris: feedUrisComprehensive } },
        fetchFn: mockFetch,
      },
    )

    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/?feed=rss',
        isFeed: true,
        format: 'rss',
      },
      {
        url: 'https://example.com/feeds/posts/default',
        isFeed: true,
        format: 'rss',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should test additional base URLs alongside main baseUrl', async () => {
    const rss = '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const mockFetch = createMockFetch({
      'https://example.com/feed': rss,
      'https://www.example.com/feed': rss,
      'https://blog.example.com/feed': rss,
    })

    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: {
          guess: {
            feedUris: ['/feed'],
            additionalBaseUrls: ['https://www.example.com', 'https://blog.example.com'],
          },
        },
        fetchFn: mockFetch,
      },
    )

    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/feed',
        isFeed: true,
        format: 'rss',
      },
      {
        url: 'https://www.example.com/feed',
        isFeed: true,
        format: 'rss',
      },
      {
        url: 'https://blog.example.com/feed',
        isFeed: true,
        format: 'rss',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should update progress correctly with additional base URLs', async () => {
    const progressUpdates: Array<Progress> = []
    const mockFetch = createMockFetch({})

    await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: {
          guess: {
            feedUris: ['/feed'],
            additionalBaseUrls: ['https://www.example.com'],
          },
        },
        fetchFn: mockFetch,
        onProgress: (progress) => {
          progressUpdates.push(progress)
        },
      },
    )

    const expected = {
      tested: 2,
      total: 2,
      found: 0,
      current: 'https://www.example.com/feed',
    }

    expect(progressUpdates[progressUpdates.length - 1]).toEqual(expected)
  })

  it('should combine URIs from multiple methods', async () => {
    const rss = '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const mockFetch = createMockFetch({
      'https://example.com/feed': rss,
      'https://example.com/feed.xml': rss,
    })

    const headers = new Headers({
      Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
    })

    const value = await discoverFeeds(
      {
        url: 'https://example.com',
        content: '<link rel="alternate" type="application/rss+xml" href="/feed">',
        headers,
      },
      {
        methods: {
          html: {
            linkMimeTypes: ['application/rss+xml'],
            anchorUris: [],
            anchorIgnoredUris: [],
            anchorLabels: [],
          },
          headers: { linkMimeTypes: ['application/rss+xml'] },
          guess: { feedUris: ['/feed', '/rss'] },
        },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/feed',
        isFeed: true,
        format: 'rss',
      },
      {
        url: 'https://example.com/feed.xml',
        isFeed: true,
        format: 'rss',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should combine URIs from multiple methods with includeInvalid', async () => {
    const rss = '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
    const mockFetch = createMockFetch({
      'https://example.com/feed': rss,
      'https://example.com/feed.xml': rss,
    })

    const headers = new Headers({
      Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
    })

    const value = await discoverFeeds(
      {
        url: 'https://example.com',
        content: '<link rel="alternate" type="application/rss+xml" href="/feed">',
        headers,
      },
      {
        methods: {
          html: {
            linkMimeTypes: ['application/rss+xml'],
            anchorUris: [],
            anchorIgnoredUris: [],
            anchorLabels: [],
          },
          headers: { linkMimeTypes: ['application/rss+xml'] },
          guess: { feedUris: ['/feed', '/rss'] },
        },
        fetchFn: mockFetch,
        includeInvalid: true,
      },
    )
    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/feed',
        isFeed: true,
        format: 'rss',
      },
      {
        url: 'https://example.com/feed.xml',
        isFeed: true,
        format: 'rss',
      },
      {
        url: 'https://example.com/rss',
        isFeed: false,
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should deduplicate URIs across multiple methods', async () => {
    const mockFetch = createMockFetch({})

    const headers = new Headers({
      Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
    })

    const value = await discoverFeeds(
      {
        url: 'https://example.com',
        content: '<link rel="alternate" type="application/rss+xml" href="/feed.xml">',
        headers,
      },
      {
        methods: {
          html: {
            linkMimeTypes: ['application/rss+xml'],
            anchorUris: [],
            anchorIgnoredUris: [],
            anchorLabels: [],
          },
          headers: { linkMimeTypes: ['application/rss+xml'] },
        },
        fetchFn: mockFetch,
      },
    )

    expect(value).toEqual([])
  })

  it('should deduplicate URIs across multiple methods with includeInvalid', async () => {
    const mockFetch = createMockFetch({})

    const headers = new Headers({
      Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
    })

    const value = await discoverFeeds(
      {
        url: 'https://example.com',
        content: '<link rel="alternate" type="application/rss+xml" href="/feed.xml">',
        headers,
      },
      {
        methods: {
          html: {
            linkMimeTypes: ['application/rss+xml'],
            anchorUris: [],
            anchorIgnoredUris: [],
            anchorLabels: [],
          },
          headers: { linkMimeTypes: ['application/rss+xml'] },
        },
        fetchFn: mockFetch,
        includeInvalid: true,
      },
    )
    const expected: Array<FeedInfo> = [
      {
        url: 'https://example.com/feed.xml',
        isFeed: false,
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should throw error when html method requested without content', () => {
    const throwing = () => discoverFeeds({ url: 'https://example.com' }, { methods: ['html'] })

    expect(throwing).toThrow(locales.errors.htmlMethodRequiresContent)
  })

  it('should throw error when headers method requested without headers', () => {
    const throwing = () => discoverFeeds({ url: 'https://example.com' }, { methods: ['headers'] })

    expect(throwing).toThrow(locales.errors.headersMethodRequiresHeaders)
  })

  it('should throw error when guess method requested without url', () => {
    // @ts-expect-error: This is for testing purposes.
    const throwing = () => discoverFeeds({ content: '<html></html>' }, { methods: ['guess'] })

    expect(throwing).toThrow(locales.errors.guessMethodRequiresUrl)
  })
})
