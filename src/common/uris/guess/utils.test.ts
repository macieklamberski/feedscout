import { describe, expect, it } from 'bun:test'
import { generateUrlCombinations, getSubdomainVariants, getWwwCounterpart } from './utils.js'

describe('generateUrlCombinations', () => {
  it('should generate all URL combinations from multiple bases and URIs', () => {
    const baseUrls = ['https://example.com', 'https://blog.example.com']
    const feedUris = ['/feed.xml', '/rss.xml']
    const expected = [
      'https://example.com/feed.xml',
      'https://example.com/rss.xml',
      'https://blog.example.com/feed.xml',
      'https://blog.example.com/rss.xml',
    ]

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should generate combinations with single base and multiple URIs', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['/feed.xml', '/rss.xml', '/atom.xml']
    const expected = [
      'https://example.com/feed.xml',
      'https://example.com/rss.xml',
      'https://example.com/atom.xml',
    ]

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should generate combinations with multiple bases and single URI', () => {
    const baseUrls = ['https://example.com', 'https://www.example.com', 'https://blog.example.com']
    const feedUris = ['/feed.xml']
    const expected = [
      'https://example.com/feed.xml',
      'https://www.example.com/feed.xml',
      'https://blog.example.com/feed.xml',
    ]

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle relative URIs without leading slash', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['feed.xml', 'rss.xml']
    const expected = ['https://example.com/feed.xml', 'https://example.com/rss.xml']

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle base URLs with trailing slash', () => {
    const baseUrls = ['https://example.com/']
    const feedUris = ['/feed.xml', 'rss.xml']
    const expected = ['https://example.com/feed.xml', 'https://example.com/rss.xml']

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle base URLs with paths', () => {
    const baseUrls = ['https://example.com/blog/']
    const feedUris = ['/feed.xml', 'rss.xml']
    const expected = ['https://example.com/feed.xml', 'https://example.com/blog/rss.xml']

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle query parameters in URIs', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['/?feed=rss', '/?feed=atom']
    const expected = ['https://example.com/?feed=rss', 'https://example.com/?feed=atom']

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle absolute URIs', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['https://feeds.example.com/rss.xml']
    const expected = ['https://feeds.example.com/rss.xml']

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle mixed relative and absolute URIs', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['/feed.xml', 'https://feeds.example.com/rss.xml']
    const expected = ['https://example.com/feed.xml', 'https://feeds.example.com/rss.xml']

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should return empty array when baseUrls is empty', () => {
    const baseUrls: Array<string> = []
    const feedUris = ['/feed.xml', '/rss.xml']
    const expected: Array<string> = []

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should return empty URIs array', () => {
    const baseUrls = ['https://example.com']
    const feedUris: Array<string> = []
    const expected: Array<string> = []

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should return empty array when both arrays are empty', () => {
    const baseUrls: Array<string> = []
    const feedUris: Array<string> = []
    const expected: Array<string> = []

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle single base and single URI', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['/feed.xml']
    const expected = ['https://example.com/feed.xml']

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should preserve URL encoding in URIs', () => {
    const baseUrls = ['https://example.com']
    const feedUris = ['/feed%20name.xml', '/rss%2Batom.xml']
    const expected = ['https://example.com/feed%20name.xml', 'https://example.com/rss%2Batom.xml']

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle different protocols in base URLs', () => {
    const baseUrls = ['http://example.com', 'https://example.com']
    const feedUris = ['/feed.xml']
    const expected = ['http://example.com/feed.xml', 'https://example.com/feed.xml']

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })

  it('should handle ports in base URLs', () => {
    const baseUrls = ['https://example.com:8080']
    const feedUris = ['/feed.xml']
    const expected = ['https://example.com:8080/feed.xml']

    expect(generateUrlCombinations(baseUrls, feedUris)).toEqual(expected)
  })
})

describe('getWwwCounterpart', () => {
  it('should add www to non-www domain', () => {
    const value = 'https://example.com'
    const expected = 'https://www.example.com'

    expect(getWwwCounterpart(value)).toBe(expected)
  })

  it('should remove www from www domain', () => {
    const value = 'https://www.example.com'
    const expected = 'https://example.com'

    expect(getWwwCounterpart(value)).toBe(expected)
  })

  it('should handle http protocol', () => {
    const value = 'http://example.com'
    const expected = 'http://www.example.com'

    expect(getWwwCounterpart(value)).toBe(expected)
  })

  it('should preserve port numbers', () => {
    const value = 'https://example.com:8080'
    const expected = 'https://www.example.com:8080'

    expect(getWwwCounterpart(value)).toBe(expected)
  })

  it('should add www to domain with existing subdomain', () => {
    const value = 'https://blog.example.com'
    const expected = 'https://www.blog.example.com'

    expect(getWwwCounterpart(value)).toBe(expected)
  })

  it('should remove www from domain with other subdomain', () => {
    const value = 'https://www.blog.example.com'
    const expected = 'https://blog.example.com'

    expect(getWwwCounterpart(value)).toBe(expected)
  })

  it('should ignore paths and query params in origin', () => {
    const value = 'https://example.com/path?query=1'
    const expected = 'https://www.example.com'

    expect(getWwwCounterpart(value)).toBe(expected)
  })
})

describe('getSubdomainVariants', () => {
  it('should generate single subdomain variant', () => {
    const value = 'https://example.com'
    const expected = ['https://blog.example.com']

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })

  it('should generate multiple subdomain variants', () => {
    const value = 'https://example.com'
    const expected = [
      'https://blog.example.com',
      'https://feeds.example.com',
      'https://news.example.com',
    ]

    expect(getSubdomainVariants(value, ['blog', 'feeds', 'news'])).toEqual(expected)
  })

  it('should return root domain when prefix is empty string', () => {
    const value = 'https://www.example.com'
    const expected = ['https://example.com']

    expect(getSubdomainVariants(value, [''])).toEqual(expected)
  })

  it('should handle mix of empty and non-empty prefixes', () => {
    const value = 'https://www.example.com'
    const expected = ['https://example.com', 'https://blog.example.com']

    expect(getSubdomainVariants(value, ['', 'blog'])).toEqual(expected)
  })

  it('should preserve http protocol', () => {
    const value = 'http://example.com'
    const expected = ['http://blog.example.com']

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })

  it('should preserve port numbers', () => {
    const value = 'https://example.com:8080'
    const expected = ['https://blog.example.com:8080']

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })

  it('should strip existing subdomain and apply new ones', () => {
    const value = 'https://www.example.com'
    const expected = ['https://blog.example.com', 'https://feeds.example.com']

    expect(getSubdomainVariants(value, ['blog', 'feeds'])).toEqual(expected)
  })

  it('should handle multi-level existing subdomain', () => {
    const value = 'https://api.v2.example.com'
    const expected = ['https://blog.example.com']

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })

  it('should handle www in prefixes', () => {
    const value = 'https://example.com'
    const expected = ['https://www.example.com']

    expect(getSubdomainVariants(value, ['www'])).toEqual(expected)
  })

  it('should return empty array for empty prefix array', () => {
    const value = 'https://example.com'
    const expected: Array<string> = []

    expect(getSubdomainVariants(value, [])).toEqual(expected)
  })

  it('should return empty array for localhost', () => {
    const value = 'http://localhost'
    const expected: Array<string> = []

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })

  it('should return empty array for IP addresses', () => {
    const value = 'http://192.168.1.1'
    const expected: Array<string> = []

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })

  it('should return empty array for localhost with port', () => {
    const value = 'http://localhost:3000'
    const expected: Array<string> = []

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })
})
