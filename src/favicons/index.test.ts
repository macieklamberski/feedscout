import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverResult } from '../common/types.js'
import { discoverFavicons } from './index.js'
import type { FaviconResult } from './types.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

describe('discoverFavicons', () => {
  it('should discover favicons from html link tags', async () => {
    const html = '<link rel="icon" href="/favicon.ico">'
    const mockFetch = createMockFetch({
      'https://example.com': html,
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: ['html'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicons from headers', async () => {
    const fetchFn: DiscoverFetchFn = async (url: string) => ({
      url,
      body: '',
      headers: new Headers({
        link: '</favicon.png>; rel="icon"',
      }),
      status: 200,
      statusText: 'OK',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: ['headers'],
      fetchFn,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.png', isValid: true, method: 'headers' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicons from guess paths', async () => {
    const mockFetch = createMockFetch({
      'https://example.com': '',
      'https://example.com/favicon.ico': 'binary',
      'https://example.com/favicon.png': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: ['guess'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'guess' },
      { url: 'https://example.com/favicon.png', isValid: true, method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should use all default methods', async () => {
    const html = '<link rel="apple-touch-icon" href="/apple-touch-icon.png">'
    const mockFetch = createMockFetch({
      'https://example.com': html,
      'https://example.com/apple-touch-icon.png': 'binary',
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com', { fetchFn: mockFetch })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/apple-touch-icon.png', isValid: true, method: 'html' },
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should deduplicate URLs across methods', async () => {
    const html = '<link rel="icon" href="/favicon.ico">'
    const mockFetch = createMockFetch({
      'https://example.com': html,
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: ['html', 'guess'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should filter out invalid URLs', async () => {
    const mockFetch = createMockFetch({
      'https://example.com': '',
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: { guess: { uris: ['/favicon.ico', '/nonexistent.png'] } },
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should return invalid results when includeInvalid is true', async () => {
    const mockFetch = createMockFetch({
      'https://example.com': '',
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: { guess: { uris: ['/favicon.ico', '/missing.png'] } },
      fetchFn: mockFetch,
      includeInvalid: true,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'guess' },
      { url: 'https://example.com/missing.png', isValid: false, method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should work with input object containing content', async () => {
    const html = '<link rel="icon" href="https://example.com/favicon.ico">'
    const mockFetch = createMockFetch({
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons(
      { url: 'https://example.com', content: html },
      { methods: ['html'], fetchFn: mockFetch },
    )
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array when no favicons found', async () => {
    const mockFetch = createMockFetch({
      'https://example.com': '<html></html>',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: ['html'],
      fetchFn: mockFetch,
    })

    expect(value).toEqual([])
  })

  it('should use custom guess paths', async () => {
    const mockFetch = createMockFetch({
      'https://example.com': '',
      'https://example.com/custom-icon.png': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: { guess: { uris: ['/custom-icon.png'] } },
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/custom-icon.png', isValid: true, method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicon from github platform handler', async () => {
    const mockFetch = createMockFetch({
      'https://github.com/octocat': '<html></html>',
      'https://github.com/octocat.png': 'binary',
    })
    const value = await discoverFavicons('https://github.com/octocat', {
      methods: ['platform'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://github.com/octocat.png', isValid: true, method: 'platform' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicon from mastodon platform handler', async () => {
    const avatarUrl = 'https://files.mastodon.social/accounts/avatars/000/123/original/avatar.png'
    const mockFetch = createMockFetch({
      'https://mastodon.social/@user':
        '<html><head><meta name="generator" content="Mastodon v4.2.0"></head></html>',
      'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({
        avatar: avatarUrl,
      }),
      [avatarUrl]: 'binary',
    })
    const value = await discoverFavicons('https://mastodon.social/@user', {
      methods: ['platform'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: avatarUrl, isValid: true, method: 'platform' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicon from bluesky platform handler', async () => {
    const avatarUrl = 'https://cdn.bsky.app/img/avatar/plain/did:plc:abc123/avatar.jpg'
    const mockFetch = createMockFetch({
      'https://bsky.app/profile/user.bsky.social': '<html></html>',
      'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=user.bsky.social':
        JSON.stringify({ avatar: avatarUrl }),
      [avatarUrl]: 'binary',
    })
    const value = await discoverFavicons('https://bsky.app/profile/user.bsky.social', {
      methods: ['platform'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: avatarUrl, isValid: true, method: 'platform' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicon from Atom feed content', async () => {
    const atomContent = `<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Example</title>
        <icon>https://example.com/icon.png</icon>
        <id>urn:uuid:1</id>
        <updated>2024-01-01T00:00:00Z</updated>
      </feed>`
    const mockFetch = createMockFetch({
      'https://example.com/icon.png': 'binary',
    })
    const value = await discoverFavicons(
      { url: 'https://example.com/feed.xml', content: atomContent },
      { methods: ['feed'], fetchFn: mockFetch },
    )
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/icon.png', isValid: true, method: 'feed' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicon from JSON Feed content', async () => {
    const jsonContent = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Example',
      favicon: 'https://example.com/favicon.ico',
      icon: 'https://example.com/icon.png',
      items: [],
    })
    const mockFetch = createMockFetch({
      'https://example.com/favicon.ico': 'binary',
      'https://example.com/icon.png': 'binary',
    })
    const value = await discoverFavicons(
      { url: 'https://example.com/feed.json', content: jsonContent },
      { methods: ['feed'], fetchFn: mockFetch },
    )
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'feed' },
      { url: 'https://example.com/icon.png', isValid: true, method: 'feed' },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array from feed method for RSS content', async () => {
    const rssContent = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Example</title>
          <link>https://example.com</link>
        </channel>
      </rss>`
    const mockFetch = createMockFetch({})
    const value = await discoverFavicons(
      { url: 'https://example.com/feed.xml', content: rssContent },
      { methods: ['feed'], fetchFn: mockFetch },
    )

    expect(value).toEqual([])
  })

  it('should return empty array for invalid URLs', async () => {
    const mockFetch = createMockFetch({})
    const value = await discoverFavicons('not-a-valid-url', {
      methods: ['html'],
      fetchFn: mockFetch,
    })

    expect(value).toEqual([])
  })

  it('should recognize direct favicon URL via image content-type', async () => {
    const fetchFn: DiscoverFetchFn = async (url: string) => ({
      url,
      body: 'binary',
      headers: new Headers({ 'content-type': 'image/png' }),
      status: 200,
      statusText: 'OK',
    })
    const value = await discoverFavicons('https://example.com/icon.png', { fetchFn })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/icon.png', isValid: true },
    ]

    expect(value).toEqual(expected)
  })

  it('should recognize direct SVG favicon via content', async () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
    const fetchFn: DiscoverFetchFn = async (url: string) => ({
      url,
      body: svgContent,
      headers: new Headers(),
      status: 200,
      statusText: 'OK',
    })
    const value = await discoverFavicons('https://example.com/icon.svg', { fetchFn })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/icon.svg', isValid: true },
    ]

    expect(value).toEqual(expected)
  })

  it('should recognize SVG favicon from object input without headers', async () => {
    const svgContent = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>'
    const mockFetch = createMockFetch({})
    const value = await discoverFavicons(
      { url: 'https://example.com/icon.svg', content: svgContent },
      { fetchFn: mockFetch },
    )
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/icon.svg', isValid: true },
    ]

    expect(value).toEqual(expected)
  })

  it('should not recognize HTML page with embedded SVG as direct favicon', async () => {
    const html =
      '<html><body><svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg></body></html>'
    const mockFetch = createMockFetch({})
    const value = await discoverFavicons(
      { url: 'https://example.com', content: html },
      { methods: ['guess'], fetchFn: mockFetch },
    )

    expect(value).toEqual([])
  })

  it('should discover favicons from site HTML when given RSS feed URL', async () => {
    const rssContent = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Example</title>
          <link>https://example.com</link>
        </channel>
      </rss>`
    const siteHtml = '<link rel="icon" href="/favicon.ico">'
    const mockFetch = createMockFetch({
      'https://example.com/feed.xml': rssContent,
      'https://example.com/': siteHtml,
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com/feed.xml', {
      methods: ['html'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicons from site HTML when given Atom feed URL', async () => {
    const atomContent = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Example</title>
        <link rel="alternate" href="https://example.com"/>
      </feed>`
    const siteHtml = '<link rel="icon" href="/icon.png">'
    const mockFetch = createMockFetch({
      'https://example.com/feed.xml': atomContent,
      'https://example.com/': siteHtml,
      'https://example.com/icon.png': 'binary',
    })
    const value = await discoverFavicons('https://example.com/feed.xml', {
      methods: ['html'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/icon.png', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicons from site HTML when given JSON Feed URL', async () => {
    const jsonContent = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Example',
      home_page_url: 'https://example.com',
      items: [],
    })
    const siteHtml = '<link rel="icon" href="/favicon.svg">'
    const mockFetch = createMockFetch({
      'https://example.com/feed.json': jsonContent,
      'https://example.com/': siteHtml,
      'https://example.com/favicon.svg': 'binary',
    })
    const value = await discoverFavicons('https://example.com/feed.json', {
      methods: ['html'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.svg', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should fall back to origin when feed has no site URL', async () => {
    const atomContent = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Example</title>
      </feed>`
    const siteHtml = '<link rel="icon" href="/favicon.ico">'
    const mockFetch = createMockFetch({
      'https://example.com/feed.xml': atomContent,
      'https://example.com': siteHtml,
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com/feed.xml', {
      methods: ['html'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should return results from both feed and html methods when given feed URL', async () => {
    const atomContent = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Example</title>
        <icon>https://example.com/feed-icon.png</icon>
        <link rel="alternate" href="https://example.com"/>
      </feed>`
    const siteHtml = '<link rel="icon" href="/site-icon.png">'
    const mockFetch = createMockFetch({
      'https://example.com/feed.xml': atomContent,
      'https://example.com/': siteHtml,
      'https://example.com/feed-icon.png': 'binary',
      'https://example.com/site-icon.png': 'binary',
    })
    const value = await discoverFavicons('https://example.com/feed.xml', {
      methods: ['feed', 'html'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/feed-icon.png', isValid: true, method: 'feed' },
      { url: 'https://example.com/site-icon.png', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should not trigger site resolution for non-feed input', async () => {
    const html = '<link rel="icon" href="/favicon.ico">'
    const mockFetch = createMockFetch({
      'https://example.com': html,
      'https://example.com/favicon.ico': 'binary',
    })
    const value = await discoverFavicons('https://example.com', {
      methods: ['html'],
      fetchFn: mockFetch,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'html' },
    ]

    expect(value).toEqual(expected)
  })

  it('should proceed gracefully when site URL fetch fails', async () => {
    const rssContent = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <link>https://dead-site.com</link>
        </channel>
      </rss>`
    const fetchFn: DiscoverFetchFn = (url: string) => {
      if (url === 'https://dead-site.com') {
        return Promise.reject(new Error('Connection refused'))
      }

      return Promise.resolve({
        url,
        body: url === 'https://example.com/feed.xml' ? rssContent : '',
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
      })
    }
    const value = await discoverFavicons('https://example.com/feed.xml', {
      methods: ['html'],
      fetchFn,
    })

    expect(value).toEqual([])
  })

  it('should fall back to guess method when initial URL fetch throws', async () => {
    const pngContent = '\x89PNG\r\n\x1a\n'
    const fetchFn: DiscoverFetchFn = (url: string) => {
      if (url === 'https://example.com/') {
        throw new Error('Connection refused')
      }

      return Promise.resolve({
        url,
        body: url === 'https://example.com/favicon.ico' ? pngContent : '',
        headers: new Headers(),
        status: url === 'https://example.com/favicon.ico' ? 200 : 404,
        statusText: url === 'https://example.com/favicon.ico' ? 'OK' : 'Not Found',
      })
    }
    const value = await discoverFavicons('https://example.com/', {
      methods: ['guess'],
      fetchFn,
    })
    const expected: Array<DiscoverResult<FaviconResult>> = [
      { url: 'https://example.com/favicon.ico', isValid: true, method: 'guess' },
    ]

    expect(value).toEqual(expected)
  })
})
