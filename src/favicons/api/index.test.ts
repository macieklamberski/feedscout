import { describe, expect, it } from 'bun:test'
import type { FaviconResult } from '../types.js'
import { discoverFaviconsFromApi, duckDuckGo, type FaviconApiProvider, googleS2 } from './index.js'

describe('discoverFaviconsFromApi', () => {
  it('should return URLs from default providers', () => {
    const value = discoverFaviconsFromApi('https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://www.google.com/s2/favicons?domain=example.com&sz=64',
        method: 'api',
      },
      {
        url: 'https://icons.duckduckgo.com/ip3/example.com.ico',
        method: 'api',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should use custom providers', () => {
    const customProvider: FaviconApiProvider = (domain) => {
      return `https://custom.example.com/favicon/${domain}`
    }
    const value = discoverFaviconsFromApi('https://example.com/', {
      providers: [customProvider],
    })
    const expected: Array<FaviconResult> = [
      {
        url: 'https://custom.example.com/favicon/example.com',
        method: 'api',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should extract domain from URL with path', () => {
    const value = discoverFaviconsFromApi('https://example.com/blog/post/123')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://www.google.com/s2/favicons?domain=example.com&sz=64',
        method: 'api',
      },
      {
        url: 'https://icons.duckduckgo.com/ip3/example.com.ico',
        method: 'api',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle subdomain', () => {
    const value = discoverFaviconsFromApi('https://blog.example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://www.google.com/s2/favicons?domain=blog.example.com&sz=64',
        method: 'api',
      },
      {
        url: 'https://icons.duckduckgo.com/ip3/blog.example.com.ico',
        method: 'api',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array for invalid URL', () => {
    const value = discoverFaviconsFromApi('not-a-url')

    expect(value).toEqual([])
  })

  it('should return empty array for empty providers', () => {
    const value = discoverFaviconsFromApi('https://example.com/', { providers: [] })

    expect(value).toEqual([])
  })
})

describe('googleS2', () => {
  it('should use default size of 64', () => {
    const provider = googleS2()
    const value = provider('example.com')

    expect(value).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=64')
  })

  it('should accept custom size', () => {
    const provider = googleS2(128)
    const value = provider('example.com')

    expect(value).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=128')
  })
})

describe('duckDuckGo', () => {
  it('should generate correct URL', () => {
    const provider = duckDuckGo()
    const value = provider('example.com')

    expect(value).toBe('https://icons.duckduckgo.com/ip3/example.com.ico')
  })
})
