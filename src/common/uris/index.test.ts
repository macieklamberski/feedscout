import { describe, expect, it } from 'bun:test'
import { discoverUris } from './index.js'

describe('discoverUris', () => {
  it('should return empty object when no methods configured', () => {
    const value = discoverUris({})
    const expected = {}

    expect(value).toEqual(expected)
  })

  it('should discover URIs from HTML method', () => {
    const value = discoverUris({
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
    const expected = { html: ['/feed.xml'] }

    expect(value).toEqual(expected)
  })

  it('should discover URIs from Headers method', () => {
    const headers = new Headers({
      Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
    })
    const value = discoverUris({
      headers: {
        headers,
        options: {
          linkSelectors: [{ rel: 'alternate', types: ['application/rss+xml'] }],
        },
      },
    })
    const expected = { headers: ['/feed.xml'] }

    expect(value).toEqual(expected)
  })

  it('should discover URIs from Guess method', () => {
    const value = discoverUris({
      guess: {
        options: {
          baseUrl: 'https://example.com',
          uris: ['/feed.xml', '/rss.xml'],
        },
      },
    })
    const expected = { guess: ['https://example.com/feed.xml', 'https://example.com/rss.xml'] }

    expect(value).toEqual(expected)
  })

  it('should return URIs from all methods in separate properties', () => {
    const headers = new Headers({
      Link: '</rss.xml>; rel="alternate"; type="application/rss+xml"',
    })
    const value = discoverUris({
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
      html: ['/feed.xml'],
      headers: ['/rss.xml'],
      guess: ['https://example.com/atom.xml'],
    }

    expect(value).toEqual(expected)
  })

  it('should keep duplicate URIs across methods in separate properties', () => {
    const headers = new Headers({
      Link: '</feed.xml>; rel="alternate"; type="application/rss+xml", </rss.xml>; rel="alternate"; type="application/rss+xml"',
    })
    const value = discoverUris({
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
      html: ['/feed.xml', '/rss.xml'],
      headers: ['/feed.xml', '/rss.xml'],
    }

    expect(value).toEqual(expected)
  })

  it('should skip methods that return empty results', () => {
    const value = discoverUris({
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
    const expected = { guess: ['https://example.com/rss.xml'] }

    expect(value).toEqual(expected)
  })

  it('should pass through array entries from platform handler', () => {
    const value = discoverUris({
      platform: {
        html: '',
        options: {
          baseUrl: 'https://example.com',
          handlers: [
            {
              match: () => {
                return true
              },
              resolve: () => {
                return [
                  ['https://example.com/feed/', 'https://example.com/?feed=rss'],
                  'https://example.com/atom.xml',
                ]
              },
            },
          ],
        },
      },
    })
    const expected = {
      platform: [
        ['https://example.com/feed/', 'https://example.com/?feed=rss'],
        'https://example.com/atom.xml',
      ],
    }

    expect(value).toEqual(expected)
  })

  it('should handle mixed string and array entries across methods', () => {
    const value = discoverUris({
      platform: {
        html: '',
        options: {
          baseUrl: 'https://example.com',
          handlers: [
            {
              match: () => {
                return true
              },
              resolve: () => {
                return [['https://example.com/feed/', 'https://example.com/?feed=rss']]
              },
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
      platform: [['https://example.com/feed/', 'https://example.com/?feed=rss']],
      guess: ['https://example.com/atom.xml'],
    }

    expect(value).toEqual(expected)
  })
})
