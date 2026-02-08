import { describe, expect, it } from 'bun:test'
import { discoverFeeds } from '../../feeds/index.js'
import type { FeedResult } from '../../feeds/types.js'
import type { DiscoverFetchFn, DiscoverProgress, DiscoverResult } from '../types.js'
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

describe('discover', () => {
  describe('stopOnFirstMethod', () => {
    it('should fall through to next method when first method URIs are all invalid', async () => {
      const platformHandler: PlatformHandler = {
        match: () => true,
        resolve: () => ['/platform-feed'],
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
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should stop after first method with valid results', async () => {
      const fetchedUrls: Array<string> = []
      const platformHandler: PlatformHandler = {
        match: () => true,
        resolve: () => ['/platform-feed'],
      }
      const mockFetch: DiscoverFetchFn = async (url) => {
        fetchedUrls.push(url)

        return {
          url,
          body: url === 'https://example.com/platform-feed' ? rss : '',
          headers: new Headers(),
          status: 200,
          statusText: 'OK',
        }
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
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com',
        },
      ]

      expect(value).toEqual(expected)
      expect(fetchedUrls).toEqual(['https://example.com/platform-feed'])
    })

    it('should not re-fetch URIs already tested in a previous method group', async () => {
      const fetchedUrls: Array<string> = []
      const platformHandler: PlatformHandler = {
        match: () => true,
        resolve: () => ['/shared-feed'],
      }
      const mockFetch: DiscoverFetchFn = async (url) => {
        fetchedUrls.push(url)

        return {
          url,
          body: url === 'https://example.com/guess-feed' ? rss : '',
          headers: new Headers(),
          status: 200,
          statusText: 'OK',
        }
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
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com',
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
        resolve: () => ['/invalid-feed'],
      }
      const mockFetch: DiscoverFetchFn = async (url) => {
        fetchedUrls.push(url)

        return {
          url,
          body: url.includes('guess') ? rss : '',
          headers: new Headers(),
          status: 200,
          statusText: 'OK',
        }
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
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com',
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
        resolve: () => ['/platform-feed'],
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
})
