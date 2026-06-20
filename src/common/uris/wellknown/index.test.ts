import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../types.js'
import { discoverUrisFromWellknown } from './index.js'

const createMockFetchFn = (responses: Record<string, string>): DiscoverFetchFn => {
  return (url: string) => {
    const body = responses[url]

    if (body === undefined) {
      throw new Error(`Not found: ${url}`)
    }

    return {
      url,
      body,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
    }
  }
}

describe('discoverUrisFromWellknown', () => {
  it('should extract feed URLs from valid JRD with matching links', () => {
    const fetchFn = createMockFetchFn({
      'https://example.com/.well-known/host-meta.json': JSON.stringify({
        links: [
          {
            rel: 'alternate',
            type: 'application/rss+xml',
            href: 'https://example.com/feed.xml',
          },
        ],
      }),
    })
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    return expect(
      discoverUrisFromWellknown(
        {
          baseUrl: 'https://example.com',
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
        },
        fetchFn,
      ),
    ).resolves.toEqual(expected)
  })

  it('should return empty for JRD with no matching rel/type', () => {
    const fetchFn = createMockFetchFn({
      'https://example.com/.well-known/host-meta.json': JSON.stringify({
        links: [
          {
            rel: 'unrelated',
            type: 'text/html',
            href: 'https://example.com/page',
          },
        ],
      }),
    })
    const expected: Array<DiscoverUriEntry> = []

    return expect(
      discoverUrisFromWellknown(
        {
          baseUrl: 'https://example.com',
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
        },
        fetchFn,
      ),
    ).resolves.toEqual(expected)
  })

  it('should return empty when links is not an array', () => {
    const fetchFn = createMockFetchFn({
      'https://example.com/.well-known/host-meta.json': JSON.stringify({
        links: 'not-an-array',
      }),
    })
    const expected: Array<DiscoverUriEntry> = []

    return expect(
      discoverUrisFromWellknown(
        {
          baseUrl: 'https://example.com',
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
        },
        fetchFn,
      ),
    ).resolves.toEqual(expected)
  })

  it('should return empty when response is not valid JSON', () => {
    const fetchFn = createMockFetchFn({
      'https://example.com/.well-known/host-meta.json': 'not valid json {{{',
    })
    const expected: Array<DiscoverUriEntry> = []

    return expect(
      discoverUrisFromWellknown(
        {
          baseUrl: 'https://example.com',
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
        },
        fetchFn,
      ),
    ).resolves.toEqual(expected)
  })

  it('should return empty when fetch fails', () => {
    const fetchFn = createMockFetchFn({})
    const expected: Array<DiscoverUriEntry> = []

    return expect(
      discoverUrisFromWellknown(
        {
          baseUrl: 'https://example.com',
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
        },
        fetchFn,
      ),
    ).resolves.toEqual(expected)
  })

  it('should handle multiple matching links', () => {
    const fetchFn = createMockFetchFn({
      'https://example.com/.well-known/host-meta.json': JSON.stringify({
        links: [
          {
            rel: 'alternate',
            type: 'application/rss+xml',
            href: 'https://example.com/feed.xml',
          },
          {
            rel: 'alternate',
            type: 'application/atom+xml',
            href: 'https://example.com/atom.xml',
          },
        ],
      }),
    })
    const expected = [
      { uri: 'https://example.com/feed.xml' },
      { uri: 'https://example.com/atom.xml' },
    ]

    return expect(
      discoverUrisFromWellknown(
        {
          baseUrl: 'https://example.com',
          linkSelectors: [
            { rel: 'alternate', types: ['application/rss+xml', 'application/atom+xml'] },
          ],
        },
        fetchFn,
      ),
    ).resolves.toEqual(expected)
  })

  it('should construct correct well-known URL from baseUrl with path', () => {
    const fetchFn = createMockFetchFn({
      'https://example.com/.well-known/host-meta.json': JSON.stringify({
        links: [
          {
            rel: 'alternate',
            type: 'application/rss+xml',
            href: 'https://example.com/feed.xml',
          },
        ],
      }),
    })
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    return expect(
      discoverUrisFromWellknown(
        {
          baseUrl: 'https://example.com/blog/post',
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
        },
        fetchFn,
      ),
    ).resolves.toEqual(expected)
  })

  it('should filter using linkSelectors (only matching rel and type pass)', () => {
    const fetchFn = createMockFetchFn({
      'https://example.com/.well-known/host-meta.json': JSON.stringify({
        links: [
          {
            rel: 'alternate',
            type: 'application/rss+xml',
            href: 'https://example.com/feed.xml',
          },
          {
            rel: 'stylesheet',
            type: 'text/css',
            href: 'https://example.com/style.css',
          },
          {
            rel: 'blogroll',
            href: 'https://example.com/blogroll.opml',
          },
        ],
      }),
    })
    const expected = [
      { uri: 'https://example.com/feed.xml' },
      { uri: 'https://example.com/blogroll.opml' },
    ]

    return expect(
      discoverUrisFromWellknown(
        {
          baseUrl: 'https://example.com',
          linkSelectors: [
            { rel: 'alternate', types: ['application/rss+xml'] },
            { rel: 'blogroll' },
          ],
        },
        fetchFn,
      ),
    ).resolves.toEqual(expected)
  })

  it('should handle links without type property', () => {
    const fetchFn = createMockFetchFn({
      'https://example.com/.well-known/host-meta.json': JSON.stringify({
        links: [
          {
            rel: 'feed',
            href: 'https://example.com/feed.xml',
          },
        ],
      }),
    })
    const expected = [{ uri: 'https://example.com/feed.xml' }]

    return expect(
      discoverUrisFromWellknown(
        {
          baseUrl: 'https://example.com',
          linkSelectors: [{ rel: 'feed' }],
        },
        fetchFn,
      ),
    ).resolves.toEqual(expected)
  })

  it('should handle links with missing href', () => {
    const fetchFn = createMockFetchFn({
      'https://example.com/.well-known/host-meta.json': JSON.stringify({
        links: [
          {
            rel: 'alternate',
            type: 'application/rss+xml',
          },
        ],
      }),
    })
    const expected: Array<DiscoverUriEntry> = []

    return expect(
      discoverUrisFromWellknown(
        {
          baseUrl: 'https://example.com',
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
        },
        fetchFn,
      ),
    ).resolves.toEqual(expected)
  })
})
