import { describe, expect, it } from 'bun:test'
import {
  discoverFeedUrisFromGuess,
  feedUrisBalanced,
  feedUrisComprehensive,
  feedUrisMinimal,
} from './index.js'

describe('discoverFeedUrisFromGuess', () => {
  it('should generate URIs from base URL and default feed URIs', () => {
    const value = discoverFeedUrisFromGuess({
      baseUrl: 'https://example.com',
      feedUris: ['/feed.xml', '/atom.xml'],
    })
    const expected = ['https://example.com/feed.xml', 'https://example.com/atom.xml']

    expect(value).toEqual(expected)
  })

  it('should use balanced feed URIs by default', () => {
    const value = discoverFeedUrisFromGuess({ baseUrl: 'https://example.com' })

    expect(value.length).toBe(feedUrisBalanced.length)
    expect(
      value.some((url) => {
        return url.includes('/feed')
      }),
    ).toBe(true)
  })

  it('should accept minimal feed URIs array', () => {
    const value = discoverFeedUrisFromGuess({
      baseUrl: 'https://example.com',
      feedUris: feedUrisMinimal,
    })

    expect(
      value.some((url) => {
        return url.includes('/feed')
      }),
    ).toBe(true)
    expect(
      value.some((url) => {
        return url.includes('/rss')
      }),
    ).toBe(true)
  })

  it('should accept balanced feed URIs array', () => {
    const value = discoverFeedUrisFromGuess({
      baseUrl: 'https://example.com',
      feedUris: feedUrisBalanced,
    })

    expect(
      value.some((url) => {
        return url.includes('/feed.json')
      }),
    ).toBe(true)
  })

  it('should accept comprehensive feed URIs array', () => {
    const value = discoverFeedUrisFromGuess({
      baseUrl: 'https://example.com',
      feedUris: feedUrisComprehensive,
    })

    expect(
      value.some((url) => {
        return url.includes('?feed=rss')
      }),
    ).toBe(true)
    expect(
      value.some((url) => {
        return url.includes('/feeds/posts/default')
      }),
    ).toBe(true)
  })

  it('should accept custom array of feed URIs', () => {
    const value = discoverFeedUrisFromGuess({
      baseUrl: 'https://example.com',
      feedUris: ['/custom-feed', '/my-rss.xml'],
    })
    const expected = ['https://example.com/custom-feed', 'https://example.com/my-rss.xml']

    expect(value).toEqual(expected)
  })

  it('should generate URLs for additional base URLs', () => {
    const value = discoverFeedUrisFromGuess({
      baseUrl: 'https://example.com',
      feedUris: ['/feed', '/rss'],
      additionalBaseUrls: ['https://www.example.com', 'https://blog.example.com'],
    })
    const expected = [
      'https://example.com/feed',
      'https://example.com/rss',
      'https://www.example.com/feed',
      'https://www.example.com/rss',
      'https://blog.example.com/feed',
      'https://blog.example.com/rss',
    ]

    expect(value).toEqual(expected)
  })

  it('should generate correct cartesian product with additionalBaseUrls', () => {
    const value = discoverFeedUrisFromGuess({
      baseUrl: 'https://example.com',
      feedUris: ['/feed.xml'],
      additionalBaseUrls: ['https://www.example.com'],
    })
    const expected = ['https://example.com/feed.xml', 'https://www.example.com/feed.xml']

    expect(value).toEqual(expected)
  })

  it('should handle empty feedUris array', () => {
    const value = discoverFeedUrisFromGuess({
      baseUrl: 'https://example.com',
      feedUris: [],
    })
    const expected: Array<string> = []

    expect(value).toEqual(expected)
  })

  it('should handle empty additionalBaseUrls array', () => {
    const value = discoverFeedUrisFromGuess({
      baseUrl: 'https://example.com',
      feedUris: ['/feed.xml'],
      additionalBaseUrls: [],
    })
    const expected = ['https://example.com/feed.xml']

    expect(value).toEqual(expected)
  })
})
