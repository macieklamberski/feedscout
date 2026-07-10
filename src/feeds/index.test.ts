import { describe, expect, it } from 'bun:test'
import type {
  DiscoverExtractFn,
  DiscoverFetchFn,
  DiscoverResolveUrlFn,
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
  it('should use all methods by default when options not provided', async () => {
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
    })
    const result = await discoverFeeds('https://example.com', { fetchFn: mockFetch })
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: true,
        method: 'guess',
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
    ]

    expect(result).toEqual(expected)
  })

  it('should find feeds at ancestor paths when the page has no feed hints', async () => {
    const rss = `
      <rss version="2.0">
        <channel>
          <title>Blog RSS</title>
          <link>https://example.com/blog/</link>
          <description>Blog feed</description>
        </channel>
      </rss>
    `
    const html = `
      <html>
        <head><title>Post</title></head>
        <body><a href="/blog/">Blog</a></body>
      </html>
    `
    const mockFetch = createMockFetch({
      'https://example.com/blog/post-slug/': html,
      'https://example.com/blog/feed.xml': rss,
    })
    const value = await discoverFeeds('https://example.com/blog/post-slug/', {
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/blog/feed.xml',
        isValid: true,
        method: 'guess',
        format: 'rss',
        title: 'Blog RSS',
        description: 'Blog feed',
        siteUrl: 'https://example.com/blog/',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should find feeds under linked sections when the root has no feed hints', async () => {
    const rss = `
      <rss version="2.0">
        <channel>
          <title>Blog RSS</title>
          <link>https://example.com/blog</link>
          <description>Blog feed</description>
        </channel>
      </rss>
    `
    const html = `
      <html>
        <head><title>Home</title></head>
        <body><nav><a href="/blog">Blog</a><a href="/about">About</a></nav></body>
      </html>
    `
    const mockFetch = createMockFetch({
      'https://example.com/': html,
      'https://example.com/blog/rss.xml': rss,
    })
    const value = await discoverFeeds('https://example.com/', { fetchFn: mockFetch })
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/blog/rss.xml',
        isValid: true,
        method: 'guess',
        format: 'rss',
        title: 'Blog RSS',
        description: 'Blog feed',
        siteUrl: 'https://example.com/blog',
      },
    ]

    expect(value).toEqual(expected)
  })

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
    const result = await discoverFeeds(
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
        method: 'guess',
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
      {
        url: 'https://example.com/atom',
        isValid: true,
        method: 'guess',
        format: 'atom',
        title: 'Test Atom',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
    ]

    expect(result).toEqual(expected)
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
    const result = await discoverFeeds(
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
        method: 'guess',
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
    ]

    expect(result).toEqual(expected)
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
    const result = await discoverFeeds(
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
        method: 'guess',
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
      {
        url: 'https://example.com/rss',
        isValid: true,
        method: 'guess',
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
    ]

    expect(result).toEqual(expected)
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
    const result = await discoverFeeds(
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
        method: 'guess',
        format: 'json',
        title: 'Test JSON Feed',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
    ]

    expect(result).toEqual(expected)
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
    const result = await discoverFeeds(
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
        method: 'guess',
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
      {
        url: 'https://example.com/feeds/posts/default',
        isValid: true,
        method: 'guess',
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
    ]

    expect(result).toEqual(expected)
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
    const result = await discoverFeeds(
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
        method: 'guess',
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
      {
        url: 'https://www.example.com/feed',
        isValid: true,
        method: 'guess',
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
      {
        url: 'https://blog.example.com/feed',
        isValid: true,
        method: 'guess',
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
    ]

    expect(result).toEqual(expected)
  })

  it('should return empty array when methods is empty array', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/feed': '<rss><channel><title>Test</title></channel></rss>',
    })
    const result = await discoverFeeds(
      { url: 'https://example.com' },
      {
        methods: [],
        fetchFn: mockFetch,
      },
    )

    expect(result).toEqual([])
  })

  it('should fall back to guess method when initial URL fetch throws', async () => {
    const rssContent = `
      <?xml version="1.0"?>
      <rss version="2.0">
        <channel><title>Test</title></channel>
      </rss>
    `
    const fetchFn: DiscoverFetchFn = (url: string) => {
      if (url === 'https://example.com/') {
        throw new Error('Connection refused')
      }

      return Promise.resolve({
        url,
        body: url === 'https://example.com/feed.xml' ? rssContent : '',
        headers: new Headers(),
        status: url === 'https://example.com/feed.xml' ? 200 : 404,
        statusText: url === 'https://example.com/feed.xml' ? 'OK' : 'Not Found',
      })
    }
    const result = await discoverFeeds('https://example.com/', {
      methods: ['guess'],
      fetchFn,
    })
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed.xml',
        isValid: true,
        method: 'guess',
        format: 'rss',
        title: 'Test',
        description: undefined,
        siteUrl: undefined,
      },
    ]

    expect(result).toEqual(expected)
  })

  it('should use custom extractFn when provided', async () => {
    const mockFetch = createMockFetch({
      'https://example.com/feed': '<data>opaque payload</data>',
    })
    const extractFn: DiscoverExtractFn<FeedResult> = ({ url }) => ({
      url,
      isValid: true,
      format: 'rss',
      title: 'Custom Extract',
    })
    const result = await discoverFeeds('https://example.com', {
      methods: { guess: { uris: ['/feed'] } },
      fetchFn: mockFetch,
      extractFn,
    })
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://example.com/feed',
        isValid: true,
        method: 'guess',
        format: 'rss',
        title: 'Custom Extract',
      },
    ]

    expect(result).toEqual(expected)
  })

  it('should use custom resolveUrlFn when provided', async () => {
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
      'https://feeds.example.com/feed': rss,
    })
    const resolveUrlFn: DiscoverResolveUrlFn = (url, baseUrl) => {
      const resolved = new URL(url, baseUrl)

      resolved.hostname = 'feeds.example.com'

      return resolved.href
    }
    const result = await discoverFeeds('https://example.com', {
      methods: { guess: { uris: ['/feed'] } },
      fetchFn: mockFetch,
      resolveUrlFn,
    })
    const expected: Array<DiscoverResult<FeedResult>> = [
      {
        url: 'https://feeds.example.com/feed',
        isValid: true,
        method: 'guess',
        format: 'rss',
        title: 'Test RSS',
        description: 'Test feed',
        siteUrl: 'https://example.com/',
      },
    ]

    expect(result).toEqual(expected)
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
      const result = await discoverFeeds('https://reddit.com/r/programming', {
        methods: ['platform'],
        fetchFn: mockFetch,
      })
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://www.reddit.com/r/programming/.rss',
          isValid: true,
          method: 'platform',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://reddit.com/',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
      ]

      expect(result).toEqual(expected)
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
      const result = await discoverFeeds('https://github.com/owner/repo', {
        methods: { platform: true },
        fetchFn: mockFetch,
      })
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://github.com/owner/repo/releases.atom',
          isValid: true,
          method: 'platform',
          format: 'atom',
          title: 'Test Atom',
          description: 'Test feed',
          siteUrl: 'https://github.com/owner/repo',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          url: 'https://github.com/owner/repo/commits.atom',
          isValid: true,
          method: 'platform',
          format: 'atom',
          title: 'Test Atom',
          description: 'Test feed',
          siteUrl: 'https://github.com/owner/repo',
          hint: { key: 'github:commits', label: 'Commits' },
        },
      ]

      expect(result).toEqual(expected)
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
        resolve: () => [{ uri: 'https://custom.com/my-feed.xml' }],
      }
      const mockFetch = createMockFetch({
        'https://custom.com/my-feed.xml': rss,
      })
      const result = await discoverFeeds('https://custom.com/page', {
        methods: { platform: { handlers: [customHandler] } },
        fetchFn: mockFetch,
      })
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://custom.com/my-feed.xml',
          isValid: true,
          method: 'platform',
          format: 'rss',
          title: 'Custom Feed',
          description: 'Custom feed',
          siteUrl: 'https://custom.com/',
        },
      ]

      expect(result).toEqual(expected)
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
      const result = await discoverFeeds(
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
          method: 'platform',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://reddit.com/',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
        {
          url: 'https://reddit.com/feed',
          isValid: true,
          method: 'guess',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://reddit.com/',
        },
      ]

      expect(result).toEqual(expected)
    })

    it('should return empty array when platform method not specified', async () => {
      const mockFetch = createMockFetch({})
      const result = await discoverFeeds(
        { url: 'https://reddit.com/r/programming' },
        {
          methods: { guess: { uris: [] } },
          fetchFn: mockFetch,
        },
      )

      expect(result).toEqual([])
    })

    it('should return empty array for invalid URLs', async () => {
      const mockFetch = createMockFetch({})
      const result = await discoverFeeds(
        { url: 'not-a-valid-url' },
        {
          methods: ['platform'],
          fetchFn: mockFetch,
        },
      )

      expect(result).toEqual([])
    })

    it('should return empty array when platform discovery throws error', async () => {
      const errorHandler: PlatformHandler = {
        match: () => true,
        resolve: () => {
          throw new Error('Platform discovery failed')
        },
      }
      const mockFetch = createMockFetch({})
      const result = await discoverFeeds('https://example.com', {
        methods: { platform: { handlers: [errorHandler] } },
        fetchFn: mockFetch,
      })

      expect(result).toEqual([])
    })

    it('should pass content to platform handlers', async () => {
      let receivedContent: string | undefined
      const handlerThatUsesContent: PlatformHandler = {
        match: () => true,
        resolve: (_url, content) => {
          receivedContent = content

          return [{ uri: 'https://example.com/feed.xml' }]
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

  describe('html method', () => {
    it('should discover feeds from link rel=alternate elements', async () => {
      const html = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
          </head>
          <body>Example blog</body>
        </html>
      `
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
        'https://example.com': html,
        'https://example.com/feed.xml': rss,
      })
      const result = await discoverFeeds('https://example.com', {
        methods: ['html'],
        fetchFn: mockFetch,
      })
      const expected: Array<DiscoverResult<FeedResult>> = [
        {
          url: 'https://example.com/feed.xml',
          isValid: true,
          method: 'html',
          format: 'rss',
          title: 'Test RSS',
          description: 'Test feed',
          siteUrl: 'https://example.com/',
        },
      ]

      expect(result).toEqual(expected)
    })
  })

  describe('headers method', () => {
    it('should discover feeds from Link response header', async () => {
      const rss = `
        <rss version="2.0">
          <channel>
            <title>Test RSS</title>
            <link>https://example.com</link>
            <description>Test feed</description>
          </channel>
        </rss>
      `
      const fetchFn: DiscoverFetchFn = async (url: string) => ({
        url,
        body: url === 'https://example.com/feed.xml' ? rss : '',
        headers:
          url === 'https://example.com'
            ? new Headers({
                link: '<https://example.com/feed.xml>; rel="alternate"; type="application/rss+xml"',
              })
            : new Headers(),
        status: 200,
        statusText: 'OK',
      })
      const result = await discoverFeeds('https://example.com', {
        methods: ['headers'],
        fetchFn,
      })
      const expected: Array<DiscoverResult<FeedResult>> = [
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

      expect(result).toEqual(expected)
    })
  })
})

describe('defaultPlatformOptions', () => {
  it('should contain handler that matches GitHub URLs', () => {
    const value = 'https://github.com/owner/repo'
    const hasGithubHandler = defaultPlatformOptions.handlers.some((handler) => handler.match(value))

    expect(hasGithubHandler).toBe(true)
  })

  it('should contain handler that matches Reddit URLs', () => {
    const value = 'https://reddit.com/r/programming'
    const hasRedditHandler = defaultPlatformOptions.handlers.some((handler) => handler.match(value))

    expect(hasRedditHandler).toBe(true)
  })

  it('should contain handler that matches YouTube URLs', () => {
    const value = 'https://youtube.com/@channel'
    const hasYoutubeHandler = defaultPlatformOptions.handlers.some((handler) =>
      handler.match(value),
    )

    expect(hasYoutubeHandler).toBe(true)
  })
})
