import { describe, expect, it } from 'bun:test'
import type { FaviconResult } from '../discover/types.js'
import { discoverFaviconsFromHtml } from './index.js'

describe('discoverFaviconsFromHtml', () => {
  it('should discover favicon from link rel="icon"', () => {
    const html = '<link rel="icon" href="/favicon.ico">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.ico',
        method: 'html',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicon from link rel="shortcut icon"', () => {
    const html = '<link rel="shortcut icon" href="/favicon.ico">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.ico',
        method: 'html',
        rel: 'shortcut icon',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicon from link rel="apple-touch-icon"', () => {
    const html = '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/apple-touch-icon.png',
        method: 'html',
        rel: 'apple-touch-icon',
        sizes: '180x180',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover favicon from link rel="apple-touch-icon-precomposed"', () => {
    const html = '<link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/apple-touch-icon.png',
        method: 'html',
        rel: 'apple-touch-icon-precomposed',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should extract type attribute', () => {
    const html = '<link rel="icon" type="image/png" href="/favicon.png">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.png',
        method: 'html',
        rel: 'icon',
        type: 'image/png',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should extract sizes attribute', () => {
    const html = '<link rel="icon" sizes="32x32" href="/favicon-32x32.png">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon-32x32.png',
        method: 'html',
        rel: 'icon',
        sizes: '32x32',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should extract all attributes together', () => {
    const html = '<link rel="icon" type="image/svg+xml" sizes="any" href="/icon.svg">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/icon.svg',
        method: 'html',
        rel: 'icon',
        type: 'image/svg+xml',
        sizes: 'any',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover multiple favicons', () => {
    const html = `
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    `
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon-32x32.png',
        method: 'html',
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: 'https://example.com/favicon-16x16.png',
        method: 'html',
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
      },
      {
        url: 'https://example.com/apple-touch-icon.png',
        method: 'html',
        rel: 'apple-touch-icon',
        sizes: '180x180',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle case-insensitive rel attribute', () => {
    const html = '<link rel="ICON" href="/favicon.ico">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.ico',
        method: 'html',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should resolve relative URLs against base URL', () => {
    const html = '<link rel="icon" href="../assets/favicon.ico">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/blog/post')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/assets/favicon.ico',
        method: 'html',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle absolute URLs', () => {
    const html = '<link rel="icon" href="https://cdn.example.com/favicon.ico">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://cdn.example.com/favicon.ico',
        method: 'html',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover msapplication-TileImage meta tag', () => {
    const html = '<meta name="msapplication-TileImage" content="/mstile-144x144.png">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/mstile-144x144.png',
        method: 'html',
        sizes: '144x144',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle case-insensitive msapplication-TileImage', () => {
    const html = '<meta name="MSAPPLICATION-TILEIMAGE" content="/mstile.png">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/mstile.png',
        method: 'html',
        sizes: '144x144',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should discover both link and meta favicons', () => {
    const html = `
      <link rel="icon" href="/favicon.ico">
      <meta name="msapplication-TileImage" content="/mstile.png">
    `
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/favicon.ico',
        method: 'html',
        rel: 'icon',
      },
      {
        url: 'https://example.com/mstile.png',
        method: 'html',
        sizes: '144x144',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should ignore link tags without href', () => {
    const html = '<link rel="icon">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')

    expect(value).toEqual([])
  })

  it('should ignore link tags without rel', () => {
    const html = '<link href="/favicon.ico">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')

    expect(value).toEqual([])
  })

  it('should ignore non-icon link tags', () => {
    const html = '<link rel="stylesheet" href="/styles.css">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')

    expect(value).toEqual([])
  })

  it('should ignore meta tags without content', () => {
    const html = '<meta name="msapplication-TileImage">'
    const value = discoverFaviconsFromHtml(html, 'https://example.com/')

    expect(value).toEqual([])
  })

  it('should return empty array for empty content', () => {
    const value = discoverFaviconsFromHtml('', 'https://example.com/')

    expect(value).toEqual([])
  })

  it('should use custom normalizeUrlFn', () => {
    const html = '<link rel="icon" href="/favicon.ico">'
    const customNormalizer = (url: string) => {
      return `https://custom.example.com${url}`
    }
    const value = discoverFaviconsFromHtml(html, 'https://example.com/', customNormalizer)
    const expected: Array<FaviconResult> = [
      {
        url: 'https://custom.example.com/favicon.ico',
        method: 'html',
        rel: 'icon',
      },
    ]

    expect(value).toEqual(expected)
  })
})
