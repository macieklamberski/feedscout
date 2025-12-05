import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../common/types.js'
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

    it('should return hubs from headers, feed, and HTML', async () => {
      const feed = `
        <?xml version="1.0" encoding="UTF-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <link rel="hub" href="https://feed-hub.example.com/"/>
          <link rel="self" href="https://example.com/feed.xml"/>
        </feed>
      `
      const mockFetch = createMockFetch(feed, {
        link: '<https://header-hub.example.com/>; rel="hub"',
      })
      const value = await discoverHubs('https://example.com/feed.xml', { fetchFn: mockFetch })
      const expected: Array<HubResult> = [
        {
          hub: 'https://header-hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
        {
          hub: 'https://feed-hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
        {
          hub: 'https://feed-hub.example.com/',
          topic: 'https://example.com/feed.xml',
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

    it('should skip feed method when disabled', async () => {
      const jsonFeed = JSON.stringify({
        version: 'https://jsonfeed.org/version/1.1',
        title: 'Test',
        hubs: [{ type: 'WebSub', url: 'https://feed-hub.example.com/' }],
      })
      const mockFetch = createMockFetch(jsonFeed)
      const value = await discoverHubs('https://example.com/', {
        fetchFn: mockFetch,
        methods: ['headers', 'html'],
      })

      expect(value).toEqual([])
    })

    it('should use only feed method when specified', async () => {
      const feed = `
        <?xml version="1.0" encoding="UTF-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <link rel="hub" href="https://feed-hub.example.com/"/>
          <link rel="self" href="https://example.com/feed.xml"/>
        </feed>
      `
      const mockFetch = createMockFetch(feed, {
        link: '<https://header-hub.example.com/>; rel="hub"',
      })
      const value = await discoverHubs('https://example.com/', {
        fetchFn: mockFetch,
        methods: ['feed'],
      })
      const expected: Array<HubResult> = [
        {
          hub: 'https://feed-hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
      ]

      expect(value).toEqual(expected)
    })
  })

  describe('input normalization', () => {
    it('should work with input object containing headers', async () => {
      const headers = new Headers({
        link: '<https://hub.example.com/>; rel="hub", <https://example.com/feed.xml>; rel="self"',
      })
      const value = await discoverHubs({
        url: 'https://example.com/feed.xml',
        headers,
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

    it('should work with input object containing feed content', async () => {
      const feed = `
        <?xml version="1.0" encoding="UTF-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <link rel="hub" href="https://hub.example.com/"/>
          <link rel="self" href="https://example.com/feed.xml"/>
        </feed>
      `
      const value = await discoverHubs(
        { url: 'https://example.com/feed.xml', content: feed },
        { methods: ['feed'] },
      )
      const expected: Array<HubResult> = [
        {
          hub: 'https://hub.example.com/',
          topic: 'https://example.com/feed.xml',
        },
      ]

      expect(value).toEqual(expected)
    })
  })
})
