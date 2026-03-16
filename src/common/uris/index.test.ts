import { describe, expect, it } from 'bun:test'
import { omitEmpty } from '../utils.js'
import { discoverUris } from './index.js'

describe('discoverUris', () => {
  it('should return empty object when no methods configured', async () => {
    const value = await discoverUris({})
    const expected = {}

    expect(value).toEqual(expected)
  })

  it('should discover URIs from Feed method', async () => {
    const content = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Example',
      favicon: 'https://example.com/favicon.ico',
      items: [],
    })
    const value = await discoverUris({
      feed: {
        content,
        options: {
          extractUrls: ({ format, feed }) => {
            if (format === 'json') {
              return omitEmpty([feed.favicon])
            }
            return []
          },
        },
      },
    })
    const expected = { feed: [{ uri: 'https://example.com/favicon.ico' }] }

    expect(value).toEqual(expected)
  })

  it('should discover URIs from HTML method', async () => {
    const value = await discoverUris({
      html: {
        html: '<link rel="alternate" type="application/rss+xml" href="/feed.xml">',
        options: {
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
          anchorUris: [],
          anchorIgnoredUris: [],
          anchorLabels: [],
        },
      },
    })
    const expected = { html: [{ uri: '/feed.xml' }] }

    expect(value).toEqual(expected)
  })

  it('should discover URIs from Headers method', async () => {
    const headers = new Headers({
      Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
    })
    const value = await discoverUris({
      headers: {
        headers,
        options: {
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
        },
      },
    })
    const expected = { headers: [{ uri: '/feed.xml' }] }

    expect(value).toEqual(expected)
  })

  it('should discover URIs from Guess method', async () => {
    const value = await discoverUris({
      guess: {
        options: {
          baseUrl: 'https://example.com',
          uris: ['/feed.xml', '/rss.xml'],
        },
      },
    })
    const expected = {
      guess: [{ uri: 'https://example.com/feed.xml' }, { uri: 'https://example.com/rss.xml' }],
    }

    expect(value).toEqual(expected)
  })

  it('should return URIs from all methods in separate properties', async () => {
    const headers = new Headers({
      Link: '</rss.xml>; rel="alternate"; type="application/rss+xml"',
    })
    const value = await discoverUris({
      html: {
        html: '<link rel="alternate" type="application/rss+xml" href="/feed.xml">',
        options: {
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
          anchorUris: [],
          anchorIgnoredUris: [],
          anchorLabels: [],
        },
      },
      headers: {
        headers,
        options: {
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
        },
      },
      guess: {
        options: {
          baseUrl: 'https://example.com',
          uris: ['/atom.xml'],
        },
      },
    })
    const expected = {
      html: [{ uri: '/feed.xml' }],
      headers: [{ uri: '/rss.xml' }],
      guess: [{ uri: 'https://example.com/atom.xml' }],
    }

    expect(value).toEqual(expected)
  })

  it('should keep duplicate URIs across methods in separate properties', async () => {
    const headers = new Headers({
      Link: '</feed.xml>; rel="alternate"; type="application/rss+xml", </rss.xml>; rel="alternate"; type="application/rss+xml"',
    })
    const value = await discoverUris({
      html: {
        html: '<link rel="alternate" type="application/rss+xml" href="/feed.xml"><link rel="feed" href="/rss.xml">',
        options: {
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }, { rel: 'feed' }],
          anchorUris: [],
          anchorIgnoredUris: [],
          anchorLabels: [],
        },
      },
      headers: {
        headers,
        options: {
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
        },
      },
    })
    const expected = {
      html: [{ uri: '/feed.xml' }, { uri: '/rss.xml' }],
      headers: [{ uri: '/feed.xml' }, { uri: '/rss.xml' }],
    }

    expect(value).toEqual(expected)
  })

  it('should skip methods that return empty results', async () => {
    const value = await discoverUris({
      html: {
        html: '<div>No feeds here</div>',
        options: {
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
          anchorUris: [],
          anchorIgnoredUris: [],
          anchorLabels: [],
        },
      },
      guess: {
        options: {
          baseUrl: 'https://example.com',
          uris: ['/rss.xml'],
        },
      },
    })
    const expected = { guess: [{ uri: 'https://example.com/rss.xml' }] }

    expect(value).toEqual(expected)
  })

  it('should pass through array entries from platform handler', async () => {
    const value = await discoverUris({
      platform: {
        options: {
          baseUrl: 'https://example.com',
          handlers: [
            {
              match: () => true,
              resolve: () => [
                { uri: ['https://example.com/feed/', 'https://example.com/?feed=rss'] },
                { uri: 'https://example.com/atom.xml' },
              ],
            },
          ],
        },
      },
    })
    const expected = {
      platform: [
        { uri: ['https://example.com/feed/', 'https://example.com/?feed=rss'] },
        { uri: 'https://example.com/atom.xml' },
      ],
    }

    expect(value).toEqual(expected)
  })

  it('should handle mixed string and array entries across methods', async () => {
    const value = await discoverUris({
      platform: {
        options: {
          baseUrl: 'https://example.com',
          handlers: [
            {
              match: () => true,
              resolve: () => [
                { uri: ['https://example.com/feed/', 'https://example.com/?feed=rss'] },
              ],
            },
          ],
        },
      },
      guess: {
        options: {
          baseUrl: 'https://example.com',
          uris: ['/atom.xml'],
        },
      },
    })
    const expected = {
      platform: [{ uri: ['https://example.com/feed/', 'https://example.com/?feed=rss'] }],
      guess: [{ uri: 'https://example.com/atom.xml' }],
    }

    expect(value).toEqual(expected)
  })
})
