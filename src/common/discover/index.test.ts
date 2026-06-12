import { describe, expect, it } from 'bun:test'
import { discoverFeeds } from '../../feeds/index.js'
import type { FeedResult } from '../../feeds/types.js'
import locales from '../locales.json' with { type: 'json' }
import type {
  DiscoverExtractFn,
  DiscoverFetchFn,
  DiscoverProgress,
  DiscoverResolveUrlFn,
  DiscoverResult,
} from '../types.js'
import type { PlatformHandler } from '../uris/platform/types.js'

const rss = `
  <rss version="2.0">
    <channel>
      <title>Test RSS</title>
      <link>https://example.com</link>
      <description>Test feed</description>
    </channel>
  </rss>
`

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  })
}

// These tests cover the generic discover engine co-located with this file (stop flags,
// alternatives, progress, error handling, concurrency, fn injection). They drive it through
// discoverFeeds because discover itself takes an internal options object where every fn is
// mandatory plus a per-method defaults bundle; the wrapper is the public API that supplies those,
// so each test only has to inject a mock fetchFn. Feed-specific behavior (platform/html/headers
// methods, default options wiring) is covered in src/feeds/index.test.ts instead.
describe('discoverFeeds', () => {
  describe('stopOnFirstMethod', () => {
    it('should fall through to next method when first method URIs are all invalid', async () => {
      const platformHandler: PlatformHandler = {
        match: () => true,
        resolve: () => [{ uri: '/platform-feed' }],
      }
      const mockFetch = createMockFetch({
        'https://example.com': '<html></html>',
        'https://example.com/platform-feed': '<html>Not a feed</html>',
        'https://example.com/guess-feed': rss,
      })
      const value = await discoverFeeds(
        { url: 'https://example.com', content: '<html></html>' },
        {
          methods: {
            platform: { handlers: [platformHandler] },
            guess: { uris: ['/guess-feed'] },
          },
          fetchFn: mockFetch,
          stopOnFirstMethod: true,
          concurrency: 1,
        },
      )
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://example.com/guess-feed',
          isValid: true,
          method: 'guess',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should stop after first method with valid results', async () => {
      const fetchedUrls: Array<string> = []
      const platformHandler: PlatformHandler = {
        match: () => true,
        resolve: () => [{ uri: '/platform-feed' }],
      }
      const mockFetch: DiscoverFetchFn = (url) => {
        fetchedUrls.push(url)

        return Promise.resolve({
          url,
          body: url === 'https://example.com/platform-feed' ? rss : '',
          headers: new Headers(),
          status: 200,
          statusText: 'OK',
        })
      }
      const value = await discoverFeeds(
        { url: 'https://example.com', content: '<html></html>' },
        {
          methods: {
            platform: { handlers: [platformHandler] },
            guess: { uris: ['/guess-feed'] },
          },
          fetchFn: mockFetch,
          stopOnFirstMethod: true,
          concurrency: 1,
        },
      )
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://example.com/platform-feed',
          isValid: true,
          method: 'platform',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
      expect(fetchedUrls).toEqual(['https://example.com/platform-feed'])
    })

    it('should not re-fetch URIs already tested in a previous method group', async () => {
      const fetchedUrls: Array<string> = []
      const platformHandler: PlatformHandler = {
        match: () => true,
        resolve: () => [{ uri: '/shared-feed' }],
      }
      const mockFetch: DiscoverFetchFn = (url) => {
        fetchedUrls.push(url)

        return Promise.resolve({
          url,
          body: url === 'https://example.com/guess-feed' ? rss : '',
          headers: new Headers(),
          status: 200,
          statusText: 'OK',
        })
      }
      const value = await discoverFeeds(
        { url: 'https://example.com', content: '<html></html>' },
        {
          methods: {
            platform: { handlers: [platformHandler] },
            guess: { uris: ['/shared-feed', '/guess-feed'] },
          },
          fetchFn: mockFetch,
          stopOnFirstMethod: true,
          concurrency: 1,
        },
      )
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://example.com/guess-feed',
          isValid: true,
          method: 'guess',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
      expect(fetchedUrls).toEqual([
        'https://example.com/shared-feed',
        'https://example.com/guess-feed',
      ])
    })

    it('should compose stopOnFirstMethod and stopOnFirstResult', async () => {
      const fetchedUrls: Array<string> = []
      const platformHandler: PlatformHandler = {
        match: () => true,
        resolve: () => [{ uri: '/invalid-feed' }],
      }
      const mockFetch: DiscoverFetchFn = (url) => {
        fetchedUrls.push(url)

        return Promise.resolve({
          url,
          body: url.includes('guess') ? rss : '',
          headers: new Headers(),
          status: 200,
          statusText: 'OK',
        })
      }
      const value = await discoverFeeds(
        { url: 'https://example.com', content: '<html></html>' },
        {
          methods: {
            platform: { handlers: [platformHandler] },
            guess: { uris: ['/guess-feed1', '/guess-feed2', '/guess-feed3'] },
          },
          fetchFn: mockFetch,
          stopOnFirstMethod: true,
          stopOnFirstResult: true,
          concurrency: 1,
        },
      )
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://example.com/guess-feed1',
          isValid: true,
          method: 'guess',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
      expect(fetchedUrls).toEqual([
        'https://example.com/invalid-feed',
        'https://example.com/guess-feed1',
      ])
    })

    it('should report accurate total in onProgress across method groups', async () => {
      const progressUpdates: Array<DiscoverProgress> = []
      const platformHandler: PlatformHandler = {
        match: () => true,
        resolve: () => [{ uri: '/platform-feed' }],
      }
      const mockFetch = createMockFetch({
        'https://example.com/guess-feed': rss,
      })
      await discoverFeeds(
        { url: 'https://example.com', content: '<html></html>' },
        {
          methods: {
            platform: { handlers: [platformHandler] },
            guess: { uris: ['/guess-feed'] },
          },
          fetchFn: mockFetch,
          stopOnFirstMethod: true,
          concurrency: 1,
          onProgress: (progress) => {
            progressUpdates.push({ ...progress })
          },
        },
      )
      const expected: Array<DiscoverProgress> = [
        { tested: 1, total: 2, found: 0, current: 'https://example.com/platform-feed' },
        { tested: 2, total: 2, found: 1, current: 'https://example.com/guess-feed' },
      ]

      expect(progressUpdates).toEqual(expected)
    })
  })

  describe('stopOnFirstResult', () => {
    it('should stop on first valid result when stopOnFirstResult is true', async () => {
      let fetchCount = 0
      const mockFetch: DiscoverFetchFn = (url) => {
        fetchCount++
        return Promise.resolve({
          url,
          body: rss,
          headers: new Headers(),
          status: 200,
          statusText: 'OK',
        })
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
          method: 'guess',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
      expect(fetchCount).toBe(1)
    })
  })

  describe('alternatives', () => {
    it('should stop trying alternatives when first alternative is valid', async () => {
      const fetchedUrls: Array<string> = []
      const mockFetch: DiscoverFetchFn = (url) => {
        fetchedUrls.push(url)
        return Promise.resolve({
          url,
          body: url === 'https://example.com/feed/' ? rss : '',
          headers: new Headers(),
          status: 200,
          statusText: 'OK',
        })
      }
      const value = await discoverFeeds(
        { url: 'https://example.com' },
        {
          methods: { guess: { uris: [['/feed/', '/?feed=rss']] } },
          fetchFn: mockFetch,
        },
      )
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://example.com/feed/',
          isValid: true,
          method: 'guess',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
      expect(fetchedUrls).toEqual(['https://example.com/feed/'])
    })

    it('should try second alternative when first alternative is not valid', async () => {
      const fetchedUrls: Array<string> = []
      const mockFetch: DiscoverFetchFn = (url) => {
        fetchedUrls.push(url)
        return Promise.resolve({
          url,
          body: url === 'https://example.com/?feed=rss' ? rss : '',
          headers: new Headers(),
          status: 200,
          statusText: 'OK',
        })
      }
      const value = await discoverFeeds(
        { url: 'https://example.com' },
        {
          methods: { guess: { uris: [['/feed/', '/?feed=rss']] } },
          fetchFn: mockFetch,
        },
      )
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://example.com/?feed=rss',
          isValid: true,
          method: 'guess',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
      expect(fetchedUrls).toEqual(['https://example.com/feed/', 'https://example.com/?feed=rss'])
    })
  })

  describe('onProgress', () => {
    it('should call onProgress callback with correct updates', async () => {
      const progressUpdates: Array<DiscoverProgress> = []
      const mockFetch = createMockFetch({
        'https://example.com/feed': rss,
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
  })

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const mockFetch: DiscoverFetchFn = () => {
        return Promise.reject(new Error('Network error'))
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
      const mockFetch: DiscoverFetchFn = () => {
        return Promise.reject(new Error('Network error'))
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
          method: 'guess',
          error: expect.any(Error),
        },
      ]

      expect(value).toEqual(expected)
    })
  })

  describe('concurrency', () => {
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
          body: rss,
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
  })

  describe('multi-method', () => {
    it('should combine URIs from multiple methods', async () => {
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
          method: 'html',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
        {
          url: 'https://example.com/feed.xml',
          isValid: true,
          method: 'headers',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should combine URIs from multiple methods with includeInvalid', async () => {
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
          method: 'html',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
        {
          url: 'https://example.com/feed.xml',
          isValid: true,
          method: 'headers',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
        {
          url: 'https://example.com/rss',
          isValid: false,
          method: 'guess',
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
          method: 'html',
        },
      ]

      expect(value).toEqual(expected)
    })
  })

  describe('extractFn', () => {
    it('should use custom extractor when provided', async () => {
      const mockFetch = createMockFetch({
        'https://example.com/feed': 'custom feed content',
      })
      const customExtractor: DiscoverExtractFn<FeedResult> = ({ url, content }) => {
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
          method: 'guess',
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
      const customExtractor: DiscoverExtractFn<ExtendedFeedResult> = ({ url, content }) => {
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
          method: 'guess',
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
      const customExtractor: DiscoverExtractFn<ExtendedFeedResult> = ({ url, content }) => {
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
          method: 'guess',
          format: 'rss',
          author: 'John',
        },
        {
          url: 'https://example.com/feed2',
          isValid: true,
          method: 'guess',
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
      const customExtractor: DiscoverExtractFn<FeedResult> = ({ url }) => {
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
          method: 'guess',
          error: { code: 'PARSE_ERROR', message: 'Failed to parse feed' },
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should handle custom extractor that uses headers', async () => {
      type ExtendedFeedResult = FeedResult & {
        etag?: string
      }
      const mockFetch: DiscoverFetchFn = (url) =>
        Promise.resolve({
          url,
          body: '<rss><channel><title>Test</title></channel></rss>',
          headers: new Headers({ etag: '"abc123"' }),
          status: 200,
          statusText: 'OK',
        })
      const customExtractor: DiscoverExtractFn<ExtendedFeedResult> = ({
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
          method: 'guess',
          format: 'rss',
          etag: '"abc123"',
        },
      ]

      expect(value).toEqual(expected)
    })
  })

  describe('resolveUrlFn', () => {
    it('should use custom resolveUrlFn to transform discovered URIs', async () => {
      const mockFetch = createMockFetch({
        'https://custom.example.com/feed': rss,
      })
      const customResolveUrlFn: DiscoverResolveUrlFn = (url, baseUrl) => {
        const fullUrl = baseUrl ? new URL(url, baseUrl).href : url
        return fullUrl.replace('example.com', 'custom.example.com')
      }
      const value = await discoverFeeds(
        { url: 'https://example.com' },
        {
          methods: { guess: { uris: ['/feed'] } },
          fetchFn: mockFetch,
          resolveUrlFn: customResolveUrlFn,
        },
      )
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://custom.example.com/feed',
          isValid: true,
          method: 'guess',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should use custom resolveUrlFn for HTML discovered links', async () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const mockFetch = createMockFetch({
        'https://cdn.example.com/feed.xml': rss,
      })
      const customResolveUrlFn: DiscoverResolveUrlFn = (url) => {
        return url.startsWith('/') ? `https://cdn.example.com${url}` : url
      }
      const value = await discoverFeeds(
        { url: 'https://example.com', content: html },
        {
          methods: ['html'],
          fetchFn: mockFetch,
          resolveUrlFn: customResolveUrlFn,
        },
      )
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://cdn.example.com/feed.xml',
          isValid: true,
          method: 'html',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
    })
  })

  describe('hint preservation', () => {
    it('should preserve hint from platform handler in result', async () => {
      const platformHandler: PlatformHandler = {
        match: () => true,
        resolve: () => [{ uri: '/feed', hint: { key: 'test', label: 'Test' } }],
      }
      const mockFetch = createMockFetch({
        'https://example.com/feed': rss,
      })
      const value = await discoverFeeds(
        { url: 'https://example.com', content: '<html></html>' },
        {
          methods: { platform: { handlers: [platformHandler] } },
          fetchFn: mockFetch,
        },
      )
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://example.com/feed',
          isValid: true,
          method: 'platform',
          hint: { key: 'test', label: 'Test' },
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
    })
  })

  describe('empty methods', () => {
    it('should return empty array for empty methods config', async () => {
      const value = await discoverFeeds({ url: 'https://example.com' }, { methods: [] })

      expect(value).toEqual([])
    })
  })

  describe('method validation', () => {
    it('should throw error when html method requested without content', () => {
      const throwing = () => discoverFeeds({ url: 'https://example.com' }, { methods: ['html'] })

      expect(throwing()).rejects.toThrow(locales.errors.htmlMethodRequiresContent)
    })

    it('should throw error when headers method requested without headers', () => {
      const throwing = () => discoverFeeds({ url: 'https://example.com' }, { methods: ['headers'] })

      expect(throwing()).rejects.toThrow(locales.errors.headersMethodRequiresHeaders)
    })

    it('should throw error when guess method requested without url', () => {
      // @ts-expect-error: This is for testing purposes.
      const throwing = () => discoverFeeds({ content: '<html></html>' }, { methods: ['guess'] })

      expect(throwing()).rejects.toThrow(locales.errors.guessMethodRequiresUrl)
    })
  })

  describe('extractFn receives status and headers', () => {
    it('should pass status and headers to extractFn during validation', async () => {
      let receivedStatus: number | undefined
      let receivedHeaders: Headers | undefined
      const responseHeaders = new Headers({ 'content-type': 'application/rss+xml' })
      const customExtractor: DiscoverExtractFn<FeedResult> = ({ url, status, headers }) => {
        if (status !== undefined) {
          receivedStatus = status
          receivedHeaders = headers

          return { url, isValid: true, format: 'rss' }
        }

        return { url, isValid: false }
      }
      const mockFetch: DiscoverFetchFn = (url: string) =>
        Promise.resolve({
          url,
          body: rss,
          headers: responseHeaders,
          status: 200,
          statusText: 'OK',
        })
      await discoverFeeds(
        { url: 'https://example.com', content: '<html></html>' },
        {
          methods: { guess: { uris: ['/feed'] } },
          fetchFn: mockFetch,
          extractFn: customExtractor,
        },
      )

      expect(receivedStatus).toBe(200)
      expect(receivedHeaders).toBe(responseHeaders)
    })

    it('should pass headers to extractFn during initial content check', async () => {
      let receivedHeaders: Headers | undefined
      const customExtractor: DiscoverExtractFn<FeedResult> = ({ url, headers }) => {
        receivedHeaders = headers

        return { url, isValid: true, format: 'rss' }
      }
      const inputHeaders = new Headers({ 'content-type': 'application/rss+xml' })
      await discoverFeeds(
        { url: 'https://example.com', content: rss, headers: inputHeaders },
        {
          methods: ['html'],
          extractFn: customExtractor,
        },
      )

      expect(receivedHeaders).toBe(inputHeaders)
    })
  })

  describe.todo('resolveSiteUrlFn', () => {
    it.todo('should fetch resolved site URL and run html method against site content', () => {
      // Pass resolveSiteUrlFn returning a site URL for feed-like input, with fetchFn serving HTML
      // containing a feed link for that site URL.
      // Expected: the html method discovers URIs from the fetched site content, not the feed
      // content.
    })

    it.todo('should fall back to source input when site fetch throws', () => {
      // Pass resolveSiteUrlFn returning a site URL while fetchFn rejects for that URL.
      // Expected: discovery continues using the original input content without throwing.
    })
  })

  describe('default concurrency', () => {
    it.todo('should process at most three URIs at once when concurrency is not specified', () => {
      // Run discoverFeeds with five guess URIs, a fetchFn that tracks concurrent calls, and no
      // concurrency option. Expected: maximum observed concurrency is 3 (the default).
    })
  })
})
