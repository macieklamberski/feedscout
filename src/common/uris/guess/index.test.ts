import { describe, expect, it } from 'bun:test'
import { discoverUrisFromGuess } from './index.js'

describe('discoverUrisFromGuess', () => {
  it('should generate URIs from base URL and URIs', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: ['/feed.xml', '/atom.xml'],
    })
    const expected = ['https://example.com/feed.xml', 'https://example.com/atom.xml']

    expect(value).toEqual(expected)
  })

  it('should accept minimal URIs array', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: ['/feed', '/rss', '/atom.xml'],
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

  it('should accept balanced URIs array', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: ['/feed', '/feed/', '/feed.json'],
    })

    expect(
      value.some((url) => {
        return url.includes('/feed.json')
      }),
    ).toBe(true)
  })

  it('should accept comprehensive URIs array', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: ['/?feed=rss', '/feeds/posts/default'],
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

  it('should accept custom array of URIs', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: ['/custom-feed', '/my-rss.xml'],
    })
    const expected = ['https://example.com/custom-feed', 'https://example.com/my-rss.xml']

    expect(value).toEqual(expected)
  })

  it('should generate URLs for additional base URLs', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: ['/feed', '/rss'],
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
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: ['/feed.xml'],
      additionalBaseUrls: ['https://www.example.com'],
    })
    const expected = ['https://example.com/feed.xml', 'https://www.example.com/feed.xml']

    expect(value).toEqual(expected)
  })

  it('should handle empty uris array', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: [],
    })
    const expected: Array<string> = []

    expect(value).toEqual(expected)
  })

  it('should handle empty additionalBaseUrls array', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: ['/feed.xml'],
      additionalBaseUrls: [],
    })
    const expected = ['https://example.com/feed.xml']

    expect(value).toEqual(expected)
  })
})
