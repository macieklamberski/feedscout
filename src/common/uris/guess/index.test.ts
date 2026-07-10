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
    const expected = [
      'https://example.com/feed',
      'https://example.com/rss',
      'https://example.com/atom.xml',
    ]

    expect(value).toEqual(expected)
  })

  it('should accept balanced URIs array', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: ['/feed', '/feed/', '/feed.json'],
    })
    const expected = [
      'https://example.com/feed',
      'https://example.com/feed/',
      'https://example.com/feed.json',
    ]

    expect(value).toEqual(expected)
  })

  it('should accept comprehensive URIs array', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: ['/?feed=rss', '/feeds/posts/default'],
    })
    const expected = ['https://example.com/?feed=rss', 'https://example.com/feeds/posts/default']

    expect(value).toEqual(expected)
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

  it('should throw for invalid base URL', () => {
    const throwing = () => discoverUrisFromGuess({ baseUrl: 'not-a-url', uris: ['/feed'] })

    expect(throwing).toThrow(TypeError)
  })

  it('should not probe ancestor paths by default', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com/blog/post-slug/',
      uris: ['/feed.xml'],
    })
    const expected = ['https://example.com/feed.xml']

    expect(value).toEqual(expected)
  })

  it('should probe ancestor paths after origin URIs when maxAncestorDepth is set', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com/blog/post-slug/',
      uris: ['/feed.xml', '/rss'],
      maxAncestorDepth: 2,
    })
    const expected = [
      'https://example.com/feed.xml',
      'https://example.com/rss',
      'https://example.com/blog/feed.xml',
      'https://example.com/blog/rss',
      'https://example.com/blog/post-slug/feed.xml',
      'https://example.com/blog/post-slug/rss',
    ]

    expect(value).toEqual(expected)
  })

  it('should apply query URIs and array alternatives to ancestor paths', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com/blog/post-slug/',
      uris: ['/feed.xml', '?format=rss', ['/feed/atom/', '?feed=atom']],
      maxAncestorDepth: 1,
    })
    const expected = [
      'https://example.com/feed.xml',
      'https://example.com/blog/post-slug/?format=rss',
      ['https://example.com/feed/atom/', 'https://example.com/blog/post-slug/?feed=atom'],
      'https://example.com/blog/feed.xml',
      'https://example.com/blog/?format=rss',
      ['https://example.com/blog/feed/atom/', 'https://example.com/blog/?feed=atom'],
    ]

    expect(value).toEqual(expected)
  })

  it('should not generate ancestor URIs for root base URLs', () => {
    const value = discoverUrisFromGuess({
      baseUrl: 'https://example.com',
      uris: ['/feed.xml'],
      maxAncestorDepth: 2,
    })
    const expected = ['https://example.com/feed.xml']

    expect(value).toEqual(expected)
  })
})
