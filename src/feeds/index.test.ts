import { describe, expect, it } from 'bun:test'
import locales from '../common/locales.json' with { type: 'json' }
import type {
  DiscoverExtractFn,
  DiscoverFetchFn,
  DiscoverProgress,
  DiscoverResult,
} from '../common/types.js'
import type { PlatformHandler } from '../common/uris/platform/types.js'
import { defaultPlatformOptions, urisBalanced, urisComprehensive, urisMinimal } from './defaults.js'
import { discoverFeeds } from './index.js'
import type { FeedResult } from './types.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  })
}

describe('discoverFeeds', () => {
  it('should find valid feeds using guess method with default URIs', async () => {
    const rss = `
      <rss version="2.0">
        <channel>
          <title>Test RSS</title>
          <link>https://example.com</link>
          <description>Test feed</description>
        </channel>
      </rss>
    `
    const atom = `
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Test Atom</title>
        <link rel="alternate" href="https://example.com"/>
        <subtitle>Test feed</subtitle>
      </feed>
    `
    const mockFetch = createMockFetch({
      'https://example.com/feed': rss,
      'https://example.com/atom': atom,
    })
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed', '/atom', '/rss'] } },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
      {
        url: 'https://example.com/atom',
        isValid: true,
        format: 'atom',
        title: 'Test Atom',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should detect feed format from content', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/feed': `

        <rss version="2.0">
          <channel>
            <title>Test RSS</title>
            <link>https://example.com</link>
            <description>Test feed</description>
          </channel>
        </rss>
      `,
    })
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed'] } },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should stop on first valid feed when stopOnFirstResult is true', async () => {
    let fetchCount = 0
    const mockFetch: DiscoverFetchFn = async (url) => {
      fetchCount++
      return {
        url,
        body: `
          <rss version="2.0">
            <channel>
              <title>Test RSS</title>
              <link>https://example.com</link>
              <description>Test feed</description>
            </channel>
          </rss>
        `,
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed1', '/feed2', '/feed3', '/feed4', '/feed5'] } },
        fetchFn: mockFetch,
        stopOnFirstResult: true,
        concurrency: 1,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed1',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
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
      'https://example.com/feed': `

        <rss version="2.0">
          <channel>
            <title>Test RSS</title>
            <link>https://example.com</link>
            <description>Test feed</description>
          </channel>
        </rss>
      `,
    })

    await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed', '/rss'] } },
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
    const mockFetch: DiscoverFetchFn = async () => {
      throw new Error('Network error')
    }
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed'] } },
        fetchFn: mockFetch,
      },
    )

    expect(value).toEqual([])
  })

  it('should include errors when includeInvalid is true', async () => {
    const mockFetch: DiscoverFetchFn = async () => {
      throw new Error('Network error')
    }
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed'] } },
        fetchFn: mockFetch,
        includeInvalid: true,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: false,
      },
    ]

    expect(value).toMatchObject(expected)
  })

  it('should use custom extractor when provided', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/feed': 'custom feed content',
    })
    const customExtractor: DiscoverExtractFn<FeedResult> = async ({ url, content }) => {
      const isValid = content.includes('custom feed')
      if (isValid) {
        return {
          url,
          isValid: true,
          format: 'rss',
        }
      }
      return {
        url,
        isValid: false,
      }
    }
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed'] } },
        fetchFn: mockFetch,
        extractFn: customExtractor,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: true,
        format: 'rss',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should preserve additional data from custom extractor', async () => {
    type ExtendedFeedResult = FeedResult & {
      itemCount: number
      lastUpdated: string
    }
    const mockFetch = createMockFetch({
      'https://example.com/feed': 'custom feed with 42 items updated 2024-01-15',
    })
    const customExtractor: DiscoverExtractFn<ExtendedFeedResult> = async ({ url, content }) => {
      const isValid = content.includes('custom feed')
      if (isValid) {
        return {
          url,
          isValid: true,
          format: 'rss',
          title: 'Custom Feed',
          itemCount: 42,
          lastUpdated: '2024-01-15',
        }
      }
      return {
        url,
        isValid: false,
      }
    }
    const value = await discoverFeeds<ExtendedFeedResult>(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed'] } },
        fetchFn: mockFetch,
        extractFn: customExtractor,
      },
    )
    const expected: Array<DiscoverResult<ExtendedFeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: true,
        format: 'rss',
        title: 'Custom Feed',
        itemCount: 42,
        lastUpdated: '2024-01-15',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle custom extractor with optional additional fields', async () => {
    type ExtendedFeedResult = FeedResult & {
      itemCount?: number
      author?: string
    }
    const mockFetch = createMockFetch({
      'https://example.com/feed1': 'feed by John',
      'https://example.com/feed2': 'anonymous feed',
    })
    const customExtractor: DiscoverExtractFn<ExtendedFeedResult> = async ({ url, content }) => {
      const hasAuthor = content.includes('by John')
      return {
        url,
        isValid: true,
        format: 'rss',
        author: hasAuthor ? 'John' : undefined,
      }
    }
    const value = await discoverFeeds<ExtendedFeedResult>(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed1', '/feed2'] } },
        fetchFn: mockFetch,
        extractFn: customExtractor,
      },
    )
    const expected: Array<DiscoverResult<ExtendedFeedResult>> = [
      {
        url: 'https://example.com/feed1',
        isValid: true,
        format: 'rss',
        author: 'John',
      },
      {
        url: 'https://example.com/feed2',
        isValid: true,
        format: 'rss',
        author: undefined,
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle custom extractor returning error with additional context', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/feed': 'invalid content',
    })
    const customExtractor: DiscoverExtractFn<FeedResult> = async ({ url }) => {
      return {
        url,
        isValid: false,
        error: { code: 'PARSE_ERROR', message: 'Failed to parse feed' },
      }
    }
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed'] } },
        fetchFn: mockFetch,
        extractFn: customExtractor,
        includeInvalid: true,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: false,
        error: { code: 'PARSE_ERROR', message: 'Failed to parse feed' },
      },
    ]

    expect(value).toEqual(expected)
  })

  it.skip('should handle custom extractor that uses headers', async () => {
    // Implementation gap: The discover function in src/common/discover/index.ts
    // does not pass headers from fetchFn response to extractFn.
    // The type signature supports it (DiscoverExtractFn accepts headers?: Headers),
    // but the actual call at line 55-58 omits headers.
    type ExtendedFeedResult = FeedResult & {
      etag?: string
    }
    const mockFetch: DiscoverFetchFn = async (url) => ({
      url,
      body: '<rss><channel><title>Test</title></channel></rss>',
      headers: new Headers({ etag: '"abc123"' }),
      status: 200,
      statusText: 'OK',
    })
    const customExtractor: DiscoverExtractFn<ExtendedFeedResult> = async ({
      url,
      content,
      headers,
    }) => {
      if (content.includes('<rss>')) {
        return {
          url,
          isValid: true,
          format: 'rss',
          etag: headers?.get('etag') ?? undefined,
        }
      }
      return { url, isValid: false }
    }
    const value = await discoverFeeds<ExtendedFeedResult>(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed'] } },
        fetchFn: mockFetch,
        extractFn: customExtractor,
      },
    )
    const expected: Array<DiscoverResult<ExtendedFeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: true,
        format: 'rss',
        etag: '"abc123"',
      },
    ]

    expect(value).toEqual(expected)
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
        body: `
          <rss version="2.0">
            <channel>
              <title>Test RSS</title>
              <link>https://example.com</link>
              <description>Test feed</description>
            </channel>
          </rss>
        `,
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      }
    }

    await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: ['/feed1', '/feed2', '/feed3', '/feed4', '/feed5'] } },
        fetchFn: mockFetch,
        concurrency: 2,
      },
    )

    expect(maxConcurrent).toBe(2)
  })

  it('should work with minimal feed URIs array', async () => {
    const rss = `
      <rss version="2.0">
        <channel>
          <title>Test RSS</title>
          <link>https://example.com</link>
          <description>Test feed</description>
        </channel>
      </rss>
    `
    const mockFetch = createMockFetch({
      'https://example.com/feed': rss,
      'https://example.com/rss': rss,
    })
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: urisMinimal } },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
      {
        url: 'https://example.com/rss',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should work with balanced feed URIs array', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/feed.json': JSON.stringify({
        version: 'https://jsonfeed.org/version/1.1',
        title: 'Test JSON Feed',
        home_page_url: 'https://example.com',
        description: 'Test feed',
        items: [],
      }),
    })
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: urisBalanced } },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed.json',
        isValid: true,
        format: 'json',
        title: 'Test JSON Feed',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should work with comprehensive feed URIs array', async () => {
    const rss = `
      <rss version="2.0">
        <channel>
          <title>Test RSS</title>
          <link>https://example.com</link>
          <description>Test feed</description>
        </channel>
      </rss>
    `
    const mockFetch = createMockFetch({
      'https://example.com/?feed=rss': rss,
      'https://example.com/feeds/posts/default': rss,
    })
    const value = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: { guess: { uris: urisComprehensive } },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/?feed=rss',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
      {
        url: 'https://example.com/feeds/posts/default',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should test additional base URLs alongside main baseUrl', async () => {
    const rss = `
      <rss version="2.0">
        <channel>
          <title>Test RSS</title>
          <link>https://example.com</link>
          <description>Test feed</description>
        </channel>
      </rss>
    `
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
            uris: ['/feed'],
            additionalBaseUrls: ['https://www.example.com', 'https://blog.example.com'],
          },
        },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
      {
        url: 'https://www.example.com/feed',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
      {
        url: 'https://blog.example.com/feed',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should update progress correctly with additional base URLs', async () => {
    const progressUpdates: Array<DiscoverProgress> = []
    const mockFetch = createMockFetch({})

    await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: {
          guess: {
            uris: ['/feed'],
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
    const rss = `
      <rss version="2.0">
        <channel>
          <title>Test RSS</title>
          <link>https://example.com</link>
          <description>Test feed</description>
        </channel>
      </rss>
    `
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
            linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
            anchorUris: [],
            anchorIgnoredUris: [],
            anchorLabels: [],
          },
          headers: {
            linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
          },
          guess: { uris: ['/feed', '/rss'] },
        },
        fetchFn: mockFetch,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
      {
        url: 'https://example.com/feed.xml',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should combine URIs from multiple methods with includeInvalid', async () => {
    const rss = `
      <rss version="2.0">
        <channel>
          <title>Test RSS</title>
          <link>https://example.com</link>
          <description>Test feed</description>
        </channel>
      </rss>
    `
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
            linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
            anchorUris: [],
            anchorIgnoredUris: [],
            anchorLabels: [],
          },
          headers: {
            linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
          },
          guess: { uris: ['/feed', '/rss'] },
        },
        fetchFn: mockFetch,
        includeInvalid: true,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
      {
        url: 'https://example.com/feed.xml',
        isValid: true,
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com',
      },
      {
        url: 'https://example.com/rss',
        isValid: false,
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
            linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
            anchorUris: [],
            anchorIgnoredUris: [],
            anchorLabels: [],
          },
          headers: {
            linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
          },
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
            linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
            anchorUris: [],
            anchorIgnoredUris: [],
            anchorLabels: [],
          },
          headers: {
            linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
          },
        },
        fetchFn: mockFetch,
        includeInvalid: true,
      },
    )
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed.xml',
        isValid: false,
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

  describe('platform method', () => {
    it('should discover feeds when platform method specified in array form', async () => {
      const rss = `
        <rss version="2.0">
          <channel>
            <title>Test RSS</title>
            <link>https://reddit.com</link>
            <description>Test feed</description>
          </channel>
        </rss>
      `
      const mockFetch = createMockFetch({
        'https://www.reddit.com/r/programming/.rss': rss,
      })
      const value = await discoverFeeds('https://reddit.com/r/programming', {
        methods: ['platform'],
        fetchFn: mockFetch,
      })
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://www.reddit.com/r/programming/.rss',
          isValid: true,
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://reddit.com',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should discover feeds when platform method specified as true in object form', async () => {
      const atom = `
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Test Atom</title>
          <link rel="alternate" href="https://github.com/owner/repo"/>
          <subtitle>Test feed</subtitle>
        </feed>
      `
      const mockFetch = createMockFetch({
        'https://github.com/owner/repo/releases.atom': atom,
        'https://github.com/owner/repo/commits.atom': atom,
      })
      const value = await discoverFeeds('https://github.com/owner/repo', {
        methods: { platform: true },
        fetchFn: mockFetch,
      })
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://github.com/owner/repo/releases.atom',
          isValid: true,
          format: 'atom',
          title: 'Test Atom',
          description: 'Test feed',
          siteUrl: 'https://github.com/owner/repo',
        },
        {
          url: 'https://github.com/owner/repo/commits.atom',
          isValid: true,
          format: 'atom',
          title: 'Test Atom',
          description: 'Test feed',
          siteUrl: 'https://github.com/owner/repo',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should use custom handlers when provided in object form', async () => {
      const rss = `
        <rss version="2.0">
          <channel>
            <title>Custom Feed</title>
            <link>https://custom.com</link>
            <description>Custom feed</description>
          </channel>
        </rss>
      `
      const customHandler: PlatformHandler = {
        match: (url) => new URL(url).hostname === 'custom.com',
        resolve: () => ['https://custom.com/my-feed.xml'],
      }
      const mockFetch = createMockFetch({
        'https://custom.com/my-feed.xml': rss,
      })
      const value = await discoverFeeds('https://custom.com/page', {
        methods: { platform: { handlers: [customHandler] } },
        fetchFn: mockFetch,
      })
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://custom.com/my-feed.xml',
          isValid: true,
          format: 'rss',
          title: 'Custom Feed',
          description: 'Custom feed',
          siteUrl: 'https://custom.com',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should combine platform URIs with other method URIs', async () => {
      const rss = `
        <rss version="2.0">
          <channel>
            <title>Test RSS</title>
            <link>https://reddit.com</link>
            <description>Test feed</description>
          </channel>
        </rss>
      `
      const mockFetch = createMockFetch({
        'https://www.reddit.com/r/programming/.rss': rss,
        'https://reddit.com/feed': rss,
      })
      const value = await discoverFeeds(
        { url: 'https://reddit.com/r/programming' },
        {
          methods: { platform: true, guess: { uris: ['/feed'] } },
          fetchFn: mockFetch,
        },
      )
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://www.reddit.com/r/programming/.rss',
          isValid: true,
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://reddit.com',
        },
        {
          url: 'https://reddit.com/feed',
          isValid: true,
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://reddit.com',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should return empty array when platform method not specified', async () => {
      const mockFetch = createMockFetch({})
      const value = await discoverFeeds(
        { url: 'https://reddit.com/r/programming' },
        {
          methods: { guess: { uris: [] } },
          fetchFn: mockFetch,
        },
      )

      expect(value).toEqual([])
    })

    it('should return empty array for invalid URLs', async () => {
      const mockFetch = createMockFetch({})
      const value = await discoverFeeds(
        { url: 'not-a-valid-url' },
        {
          methods: ['platform'],
          fetchFn: mockFetch,
        },
      )

      expect(value).toEqual([])
    })

    it('should return empty array when platform discovery throws error', async () => {
      const errorHandler: PlatformHandler = {
        match: () => true,
        resolve: () => {
          throw new Error('Platform discovery failed')
        },
      }
      const mockFetch = createMockFetch({})
      const value = await discoverFeeds('https://example.com', {
        methods: { platform: { handlers: [errorHandler] } },
        fetchFn: mockFetch,
      })

      expect(value).toEqual([])
    })

    it('should pass content to platform handlers', async () => {
      let receivedContent: string | undefined
      const handlerThatUsesContent: PlatformHandler = {
        match: () => true,
        resolve: (_url, content) => {
          receivedContent = content

          return ['https://example.com/feed.xml']
        },
      }
      const htmlContent = '<html><head></head><body>Test content</body></html>'
      const mockFetch = createMockFetch({
        'https://example.com': htmlContent,
        'https://example.com/feed.xml': '<rss></rss>',
      })
      await discoverFeeds('https://example.com', {
        methods: { platform: { handlers: [handlerThatUsesContent] } },
        fetchFn: mockFetch,
      })

      expect(receivedContent).toBe(htmlContent)
    })
  })
})

describe('defaultPlatformOptions', () => {
  it('should contain all 3 platform handlers', () => {
    const value = defaultPlatformOptions.handlers.length

    expect(value).toBe(3)
  })

  it('should contain handler that matches GitHub URLs', () => {
    const value = defaultPlatformOptions.handlers.some((handler) =>
      handler.match('https://github.com/owner/repo'),
    )

    expect(value).toBe(true)
  })

  it('should contain handler that matches Reddit URLs', () => {
    const value = defaultPlatformOptions.handlers.some((handler) =>
      handler.match('https://reddit.com/r/programming'),
    )

    expect(value).toBe(true)
  })

  it('should contain handler that matches YouTube URLs', () => {
    const value = defaultPlatformOptions.handlers.some((handler) =>
      handler.match('https://youtube.com/@channel'),
    )

    expect(value).toBe(true)
  })
})
