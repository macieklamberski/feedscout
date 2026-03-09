import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../common/types.js'
import type { FaviconResult } from '../discover/types.js'
import { discoverFaviconsFromManifest } from './index.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  })
}

describe('discoverFaviconsFromManifest', () => {
  it('should discover icons from manifest.json', async () => {
    const html = '<link rel="manifest" href="/manifest.json">'
    const manifest = JSON.stringify({
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    })
    const mockFetch = createMockFetch({
      'https://example.com/manifest.json': manifest,
    })
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/icon-192.png',
        method: 'manifest',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: 'https://example.com/icon-512.png',
        method: 'manifest',
        sizes: '512x512',
        type: 'image/png',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle manifest with .webmanifest extension', async () => {
    const html = '<link rel="manifest" href="/site.webmanifest">'
    const manifest = JSON.stringify({
      icons: [{ src: '/icon.png', sizes: '192x192', type: 'image/png' }],
    })
    const mockFetch = createMockFetch({
      'https://example.com/site.webmanifest': manifest,
    })
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/icon.png',
        method: 'manifest',
        sizes: '192x192',
        type: 'image/png',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should resolve icon src relative to manifest URL', async () => {
    const html = '<link rel="manifest" href="/assets/manifest.json">'
    const manifest = JSON.stringify({
      icons: [{ src: '../images/icon.png', sizes: '192x192' }],
    })
    const mockFetch = createMockFetch({
      'https://example.com/assets/manifest.json': manifest,
    })
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/images/icon.png',
        method: 'manifest',
        sizes: '192x192',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle icons without type', async () => {
    const html = '<link rel="manifest" href="/manifest.json">'
    const manifest = JSON.stringify({
      icons: [{ src: '/icon.png', sizes: '192x192' }],
    })
    const mockFetch = createMockFetch({
      'https://example.com/manifest.json': manifest,
    })
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/icon.png',
        method: 'manifest',
        sizes: '192x192',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle icons without sizes', async () => {
    const html = '<link rel="manifest" href="/manifest.json">'
    const manifest = JSON.stringify({
      icons: [{ src: '/icon.png', type: 'image/png' }],
    })
    const mockFetch = createMockFetch({
      'https://example.com/manifest.json': manifest,
    })
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/icon.png',
        method: 'manifest',
        type: 'image/png',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should skip icons without src', async () => {
    const html = '<link rel="manifest" href="/manifest.json">'
    const manifest = JSON.stringify({
      icons: [
        { sizes: '192x192', type: 'image/png' },
        { src: '/icon.png', sizes: '512x512' },
      ],
    })
    const mockFetch = createMockFetch({
      'https://example.com/manifest.json': manifest,
    })
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/icon.png',
        method: 'manifest',
        sizes: '512x512',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array when no manifest link found', async () => {
    const html = '<link rel="stylesheet" href="/styles.css">'
    const mockFetch = createMockFetch({})
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)

    expect(value).toEqual([])
  })

  it('should return empty array when manifest has no icons', async () => {
    const html = '<link rel="manifest" href="/manifest.json">'
    const manifest = JSON.stringify({ name: 'Test App' })
    const mockFetch = createMockFetch({
      'https://example.com/manifest.json': manifest,
    })
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)

    expect(value).toEqual([])
  })

  it('should return empty array when manifest is invalid JSON', async () => {
    const html = '<link rel="manifest" href="/manifest.json">'
    const mockFetch = createMockFetch({
      'https://example.com/manifest.json': 'not json',
    })
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)

    expect(value).toEqual([])
  })

  it('should return empty array when manifest fetch fails', async () => {
    const html = '<link rel="manifest" href="/manifest.json">'
    const mockFetch: DiscoverFetchFn = async () => {
      throw new Error('Network error')
    }
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)

    expect(value).toEqual([])
  })

  it('should return empty array for empty HTML', async () => {
    const mockFetch = createMockFetch({})
    const value = await discoverFaviconsFromManifest('', 'https://example.com/', mockFetch)

    expect(value).toEqual([])
  })

  it('should handle multiple icons with various types', async () => {
    const html = '<link rel="manifest" href="/manifest.json">'
    const manifest = JSON.stringify({
      icons: [
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.webp', sizes: '512x512', type: 'image/webp' },
      ],
    })
    const mockFetch = createMockFetch({
      'https://example.com/manifest.json': manifest,
    })
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/icon.svg',
        method: 'manifest',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        url: 'https://example.com/icon-192.png',
        method: 'manifest',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: 'https://example.com/icon-512.webp',
        method: 'manifest',
        sizes: '512x512',
        type: 'image/webp',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle case-insensitive rel attribute', async () => {
    const html = '<link rel="MANIFEST" href="/manifest.json">'
    const manifest = JSON.stringify({
      icons: [{ src: '/icon.png', sizes: '192x192' }],
    })
    const mockFetch = createMockFetch({
      'https://example.com/manifest.json': manifest,
    })
    const value = await discoverFaviconsFromManifest(html, 'https://example.com/', mockFetch)
    const expected: Array<FaviconResult> = [
      {
        url: 'https://example.com/icon.png',
        method: 'manifest',
        sizes: '192x192',
      },
    ]

    expect(value).toEqual(expected)
  })
})
