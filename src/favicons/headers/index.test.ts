import { describe, expect, it } from 'bun:test'
import type { FaviconResult } from '../discover/types.js'
import { discoverFaviconsFromHeaders } from './index.js'

describe('discoverFaviconsFromHeaders', () => {
  it('should discover favicon from Link header with rel="icon"', () => {
    const headers = new Headers({
      link: '</favicon.png>; rel="icon"',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.png',
        method: 'headers',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should extract type attribute', () => {
    const headers = new Headers({
      link: '</favicon.png>; rel="icon"; type="image/png"',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.png',
        method: 'headers',
        rel: 'icon',
        type: 'image/png',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should extract sizes attribute', () => {
    const headers = new Headers({
      link: '</favicon.png>; rel="icon"; sizes="32x32"',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.png',
        method: 'headers',
        rel: 'icon',
        sizes: '32x32',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should extract all attributes together', () => {
    const headers = new Headers({
      link: '</favicon.png>; rel="icon"; type="image/png"; sizes="32x32"',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.png',
        method: 'headers',
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover apple-touch-icon from Link header', () => {
    const headers = new Headers({
      link: '</apple-touch-icon.png>; rel="apple-touch-icon"; sizes="180x180"',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/apple-touch-icon.png',
        method: 'headers',
        rel: 'apple-touch-icon',
        sizes: '180x180',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle multiple icon links', () => {
    const headers = new Headers({
      link: '</favicon-16.png>; rel="icon"; sizes="16x16", </favicon-32.png>; rel="icon"; sizes="32x32"',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon-16.png',
        method: 'headers',
        rel: 'icon',
        sizes: '16x16',
      },
      {
        url: 'https://example.com/favicon-32.png',
        method: 'headers',
        rel: 'icon',
        sizes: '32x32',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should ignore non-icon links', () => {
    const headers = new Headers({
      link: '</feed.xml>; rel="alternate"; type="application/rss+xml", </favicon.ico>; rel="icon"',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.ico',
        method: 'headers',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle case-insensitive rel attribute', () => {
    const headers = new Headers({
      link: '</favicon.ico>; rel="ICON"',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.ico',
        method: 'headers',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle unquoted rel values', () => {
    const headers = new Headers({
      link: '</favicon.ico>; rel=icon',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.ico',
        method: 'headers',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should resolve relative URLs against base URL', () => {
    const headers = new Headers({
      link: '</assets/favicon.ico>; rel="icon"',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/blog/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/assets/favicon.ico',
        method: 'headers',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle absolute URLs', () => {
    const headers = new Headers({
      link: '<https://cdn.example.com/favicon.ico>; rel="icon"',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://cdn.example.com/favicon.ico',
        method: 'headers',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array when no Link header present', () => {
    const headers = new Headers()
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')

    expect(value).toEqual([])
  })

  it('should return empty array when no icon links found', () => {
    const headers = new Headers({
      link: '</feed.xml>; rel="alternate"',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')

    expect(value).toEqual([])
  })

  it('should handle malformed Link header gracefully', () => {
    const headers = new Headers({
      link: 'invalid-link-header',
    })
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/')

    expect(value).toEqual([])
  })

  it('should use custom normalizeUrlFn', () => {
    const headers = new Headers({
      link: '</favicon.ico>; rel="icon"',
    })
    const customNormalizer = (url: string) => {
      return `https://custom.example.com${url}`
    }
    const value = discoverFaviconsFromHeaders(headers, 'https://example.com/', customNormalizer)
    const expected: Array<FaviconResult> = [
      {
        url: 'https://custom.example.com/favicon.ico',
        method: 'headers',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })
})
