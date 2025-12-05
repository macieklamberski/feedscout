import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../common/types.js'
import { discoverHubs } from './index.js'
import type { HubResult } from './types.js'

const createMockFetch = (body: string, headers: Record<string, string> = {}): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body,
    headers: new Headers(headers),
    status: 200,
    statusText: 'OK',
  })
}

describe('discoverHubs', () => {
  describe('headers method', () => {
    it('should discover hub and self from Link headers', async () => {
      const mockFetch = createMockFetch('', {
        link: '<https://hub.example.com/>; rel="hub", <https://example.com/feed.xml>; rel="self"',
      })
      const value = await discoverHubs('https://example.com/feed.xml', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should use input URL as topic when self link is missing', async () => {
      const mockFetch = createMockFetch('', {
        link: '<https://hub.example.com/>; rel="hub"',
      })
      const value = await discoverHubs('https://example.com/feed.xml', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should handle multiple Link headers with other relations', async () => {
      const mockFetch = createMockFetch('', {
        link: '<https://example.com/>; rel="alternate", <https://hub.example.com/>; rel="hub", <https://example.com/feed.xml>; rel="self"',
      })
      const value = await discoverHubs('https://example.com/feed.xml', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should return empty array when no hub found', async () => {
      const mockFetch = createMockFetch('', {
        link: '<https://example.com/feed.xml>; rel="self"',
      })
      const value = await discoverHubs('https://example.com/feed.xml', { fetchFn: mockFetch })

      expect(value).toEqual([])
    })

    it('should return empty array when no Link header present', async () => {
      const mockFetch = createMockFetch('')
      const value = await discoverHubs('https://example.com/feed.xml', { fetchFn: mockFetch })

      expect(value).toEqual([])
    })

    it('should handle case-insensitive rel attribute', async () => {
      const mockFetch = createMockFetch('', {
        link: '<https://hub.example.com/>; rel="HUB", <https://example.com/feed.xml>; rel="SELF"',
      })
      const value = await discoverHubs('https://example.com/feed.xml', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should return all hubs when multiple hubs present', async () => {
      const mockFetch = createMockFetch('', {
        link: '<https://hub1.example.com/>; rel="hub", <https://hub2.example.com/>; rel="hub"',
      })
      const value = await discoverHubs('https://example.com/feed.xml', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub1.example.com/',
          topic: 'https://example.com/feed.xml',
        },
        {
          hub: 'https://hub2.example.com/',
          topic: 'https://example.com/feed.xml',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should handle malformed Link header gracefully', async () => {
      const mockFetch = createMockFetch('', {
        link: 'invalid-link-header',
      })
      const value = await discoverHubs('https://example.com/feed.xml', { fetchFn: mockFetch })

      expect(value).toEqual([])
    })

    it('should handle quoted rel values', async () => {
      const mockFetch = createMockFetch('', {
        link: '<https://hub.example.com/>; rel="hub"',
      })
      const value = await discoverHubs('https://example.com/feed.xml', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should handle unquoted rel values', async () => {
      const mockFetch = createMockFetch('', {
        link: '<https://hub.example.com/>; rel=hub',
      })
      const value = await discoverHubs('https://example.com/feed.xml', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
      ]

      expect(value).toEqual(expected)
    })
  })

  describe('html method', () => {
    it('should discover hub and self from link elements', async () => {
      const html = `
        <html>
          <head>
            <link rel="hub" href="https://hub.example.com/">
            <link rel="self" href="https://example.com/feed.xml">
          </head>
        </html>
      `
      const mockFetch = createMockFetch(html)
      const value = await discoverHubs('https://example.com/', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should use input URL as topic when self link is missing', async () => {
      const html = '<link rel="hub" href="https://hub.example.com/">'
      const mockFetch = createMockFetch(html)
      const value = await discoverHubs('https://example.com/', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should resolve relative URLs against base URL', async () => {
      const html = '<link rel="hub" href="/websub">'
      const mockFetch = createMockFetch(html)
      const value = await discoverHubs('https://example.com/page', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://example.com/websub',
          topic: 'https://example.com/page',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should handle case-insensitive rel attribute', async () => {
      const html = '<link rel="HUB" href="https://hub.example.com/">'
      const mockFetch = createMockFetch(html)
      const value = await discoverHubs('https://example.com/', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
    })
  })

  describe('combined results', () => {
    it('should return hubs from both headers and HTML', async () => {
      const html = '<link rel="hub" href="https://html-hub.example.com/">'
      const mockFetch = createMockFetch(html, {
        link: '<https://header-hub.example.com/>; rel="hub"',
      })
      const value = await discoverHubs('https://example.com/', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://header-hub.example.com/',
          topic: 'https://example.com/',
        },
        {
          hub: 'https://html-hub.example.com/',
          topic: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should return only HTML hub when headers have no hub', async () => {
      const html = '<link rel="hub" href="https://html-hub.example.com/">'
      const mockFetch = createMockFetch(html, {
        link: '<https://example.com/feed.xml>; rel="self"',
      })
      const value = await discoverHubs('https://example.com/', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://html-hub.example.com/',
          topic: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
    })
  })

  describe('methods options', () => {
    it('should skip headers method when disabled', async () => {
      const html = '<link rel="hub" href="https://html-hub.example.com/">'
      const mockFetch = createMockFetch(html, {
        link: '<https://header-hub.example.com/>; rel="hub"',
      })
      const value = await discoverHubs('https://example.com/', {
        fetchFn: mockFetch,
        methods: ['html'],
      })
      const expected: Array<HubResult> = [
        {
          hub: 'https://html-hub.example.com/',
          topic: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should skip HTML method when disabled', async () => {
      const html = '<link rel="hub" href="https://html-hub.example.com/">'
      const mockFetch = createMockFetch(html)
      const value = await discoverHubs('https://example.com/', {
        fetchFn: mockFetch,
        methods: ['headers'],
      })

      expect(value).toEqual([])
    })
  })

  describe('input normalization', () => {
    it('should work with input object containing headers', async () => {
      const value = await discoverHubs({
        url: 'https://example.com/feed.xml',
        headers: new Headers({
          link: '<https://hub.example.com/>; rel="hub", <https://example.com/feed.xml>; rel="self"',
        }),
      })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
      ]

      expect(value).toEqual(expected)
    })

    it('should work with input object containing content', async () => {
      const html = '<link rel="hub" href="https://hub.example.com/">'
      const value = await discoverHubs({
        url: 'https://example.com/',
        content: html,
      })
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/',
        },
      ]

      expect(value).toEqual(expected)
    })
  })
})
