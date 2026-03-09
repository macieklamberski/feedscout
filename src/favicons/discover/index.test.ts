import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverNormalizeUrlFn } from '../../common/types.js'
import { discoverFavicons } from './index.js'
import type { FaviconResult } from './types.js'

const createMockFetch = (body: string, headers: Record<string, string> = {}): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body,
    headers: new Headers(headers),
    status: 200,
    statusText: 'OK',
  })
}

describe('discoverFavicons', () => {
  describe('combined results', () => {
    it('should return favicons from both html and guess', async () => {
      const html = '<link rel="icon" href="/custom-icon.png">'
      const mockFetch = createMockFetch(html)
      const value = await discoverFavicons('https://example.com/', { fetchFn: mockFetch })
      const expected: Array<FaviconResult> = [
        { url: 'https://example.com/custom-icon.png', method: 'html', rel: 'icon' },
        { url: 'https://example.com/favicon.ico', method: 'guess' },
        { url: 'https://example.com/apple-touch-icon.png', method: 'guess' },
        { url: 'https://example.com/apple-touch-icon-precomposed.png', method: 'guess' },
        { url: 'https://example.com/favicon.png', method: 'guess' },
        { url: 'https://example.com/favicon.svg', method: 'guess' },
      ]

      expect(value).toEqual(expected)
    })

    it('should deduplicate URLs across methods', async () => {
      const html = '<link rel="icon" href="/favicon.ico">'
      const mockFetch = createMockFetch(html)
      const value = await discoverFavicons('https://example.com/', { fetchFn: mockFetch })
      const expected: Array<FaviconResult> = [
        { url: 'https://example.com/favicon.ico', method: 'html', rel: 'icon' },
        { url: 'https://example.com/apple-touch-icon.png', method: 'guess' },
        { url: 'https://example.com/apple-touch-icon-precomposed.png', method: 'guess' },
        { url: 'https://example.com/favicon.png', method: 'guess' },
        { url: 'https://example.com/favicon.svg', method: 'guess' },
      ]

      expect(value).toEqual(expected)
    })

    it('should return only guess results when html has no icons', async () => {
      const html = '<html><head><title>Test</title></head></html>'
      const mockFetch = createMockFetch(html)
      const value = await discoverFavicons('https://example.com/', { fetchFn: mockFetch })
      const expected: Array<FaviconResult> = [
        { url: 'https://example.com/favicon.ico', method: 'guess' },
        { url: 'https://example.com/apple-touch-icon.png', method: 'guess' },
        { url: 'https://example.com/apple-touch-icon-precomposed.png', method: 'guess' },
        { url: 'https://example.com/favicon.png', method: 'guess' },
        { url: 'https://example.com/favicon.svg', method: 'guess' },
      ]

      expect(value).toEqual(expected)
    })

    it('should include headers results when headers are present', async () => {
      const html = '<link rel="icon" href="/from-html.png">'
      const mockFetch = createMockFetch(html, {
        link: '</from-headers.png>; rel="icon"',
      })
      const value = await discoverFavicons('https://example.com/', {
        fetchFn: mockFetch,
        methods: ['html', 'headers'],
      })
      const expected: Array<FaviconResult> = [
        { url: 'https://example.com/from-html.png', method: 'html', rel: 'icon' },
        { url: 'https://example.com/from-headers.png', method: 'headers', rel: 'icon' },
      ]

      expect(value).toEqual(expected)
    })

    it('should include manifest results', async () => {
      const html = '<link rel="manifest" href="/manifest.json">'
      const manifestFetch: DiscoverFetchFn = async (url: string) => {
        if (url === 'https://example.com/manifest.json') {
          return {
            url,
            body: JSON.stringify({
              icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
            }),
            headers: new Headers(),
            status: 200,
            statusText: 'OK',
          }
        }

        return {
          url,
          body: html,
          headers: new Headers(),
          status: 200,
          statusText: 'OK',
        }
      }
      const value = await discoverFavicons('https://example.com/', {
        fetchFn: manifestFetch,
        methods: ['manifest'],
      })
      const expected: Array<FaviconResult> = [
        {
          url: 'https://example.com/icon-192.png',
          method: 'manifest',
          sizes: '192x192',
          type: 'image/png',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should include api results when api method is enabled', async () => {
      const html = '<html></html>'
      const mockFetch = createMockFetch(html)
      const value = await discoverFavicons('https://example.com/', {
        fetchFn: mockFetch,
        methods: ['api'],
      })
      const expected: Array<FaviconResult> = [
        { url: 'https://www.google.com/s2/favicons?domain=example.com&sz=64', method: 'api' },
        { url: 'https://icons.duckduckgo.com/ip3/example.com.ico', method: 'api' },
      ]

      expect(value).toEqual(expected)
    })

    it('should not include api results by default', async () => {
      const html = '<html></html>'
      const mockFetch = createMockFetch(html)
      const value = await discoverFavicons('https://example.com/', { fetchFn: mockFetch })

      expect(value.some((r) => r.method === 'api')).toBe(false)
    })
  })

  describe('methods options', () => {
    it('should skip guess method when disabled', async () => {
      const html = '<link rel="icon" href="/favicon.ico">'
      const mockFetch = createMockFetch(html)
      const value = await discoverFavicons('https://example.com/', {
        fetchFn: mockFetch,
        methods: ['html'],
      })
      const expected: Array<FaviconResult> = [
        { url: 'https://example.com/favicon.ico', method: 'html', rel: 'icon' },
      ]

      expect(value).toEqual(expected)
    })

    it('should skip html method when disabled', async () => {
      const html = '<link rel="icon" href="/custom-icon.png">'
      const mockFetch = createMockFetch(html)
      const value = await discoverFavicons('https://example.com/', {
        fetchFn: mockFetch,
        methods: ['guess'],
      })
      const expected: Array<FaviconResult> = [
        { url: 'https://example.com/favicon.ico', method: 'guess' },
        { url: 'https://example.com/apple-touch-icon.png', method: 'guess' },
        { url: 'https://example.com/apple-touch-icon-precomposed.png', method: 'guess' },
        { url: 'https://example.com/favicon.png', method: 'guess' },
        { url: 'https://example.com/favicon.svg', method: 'guess' },
      ]

      expect(value).toEqual(expected)
    })
  })

  describe('normalizeUrlFn option', () => {
    it('should use custom normalizeUrlFn for html results', async () => {
      const html = '<link rel="icon" href="/favicon.ico">'
      const customNormalizer: DiscoverNormalizeUrlFn = (url) => {
        return `https://custom.example.com${url}`
      }
      const value = await discoverFavicons(
        { url: 'https://example.com/', content: html },
        {
          methods: ['html'],
          normalizeUrlFn: customNormalizer,
        },
      )
      const expected: Array<FaviconResult> = [
        { url: 'https://custom.example.com/favicon.ico', method: 'html', rel: 'icon' },
      ]

      expect(value).toEqual(expected)
    })
  })

  describe('input normalization', () => {
    it('should work with input object containing content', async () => {
      const html = '<link rel="icon" href="https://example.com/favicon.ico">'
      const value = await discoverFavicons(
        { url: 'https://example.com/', content: html },
        { methods: ['html'] },
      )
      const expected: Array<FaviconResult> = [
        { url: 'https://example.com/favicon.ico', method: 'html', rel: 'icon' },
      ]

      expect(value).toEqual(expected)
    })

    it('should work with string URL input', async () => {
      const html = '<link rel="icon" href="/favicon.ico">'
      const mockFetch = createMockFetch(html)
      const value = await discoverFavicons('https://example.com/', {
        fetchFn: mockFetch,
        methods: ['html'],
      })
      const expected: Array<FaviconResult> = [
        { url: 'https://example.com/favicon.ico', method: 'html', rel: 'icon' },
      ]

      expect(value).toEqual(expected)
    })
  })
})
