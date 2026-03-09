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

      const faviconIcoResults = value.filter((r) => r.url === 'https://example.com/favicon.ico')

      expect(faviconIcoResults).toEqual([
        { url: 'https://example.com/favicon.ico', method: 'html', rel: 'icon' },
      ])
    })

    it('should return only guess results when html has no icons', async () => {
      const html = '<html><head><title>Test</title></head></html>'
      const mockFetch = createMockFetch(html)
      const value = await discoverFavicons('https://example.com/', { fetchFn: mockFetch })

      expect(value.every((r) => r.method === 'guess')).toBe(true)
      expect(value.length).toBe(5)
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

      expect(value.every((r) => r.method === 'guess')).toBe(true)
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
