import { describe, expect, it } from 'bun:test'
import { discoverUris } from './index.js'

describe('discoverUris', () => {
  it('should return empty array when no methods configured', () => {
    const value = discoverUris({})
    const expected: Array<string> = []

    expect(value).toEqual(expected)
  })

  it('should discover URIs from HTML method', () => {
    const value = discoverUris({
      html: {
        html: '<link rel="alternate" type="application/rss+xml" href="/feed.xml">',
        options: {
          linkRels: ['alternate'],
          linkMimeTypes: ['application/rss+xml'],
          anchorUris: [],
          anchorIgnoredUris: [],
          anchorLabels: [],
        },
      },
    })
    const expected = ['/feed.xml']

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
          linkRels: ['alternate'],
          linkMimeTypes: ['application/rss+xml'],
        },
      },
    })
    const expected = ['/feed.xml']

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
    const expected = ['https://example.com/feed.xml', 'https://example.com/rss.xml']

    expect(value).toEqual(expected)
  })

  it('should deduplicate URIs across methods', () => {
    const headers = new Headers({
      Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
    })
    const value = discoverUris({
      html: {
        html: '<link rel="alternate" type="application/rss+xml" href="/feed.xml">',
        options: {
          linkRels: ['alternate'],
          linkMimeTypes: ['application/rss+xml'],
          anchorUris: [],
          anchorIgnoredUris: [],
          anchorLabels: [],
        },
      },
      headers: {
        headers,
        options: {
          linkRels: ['alternate'],
          linkMimeTypes: ['application/rss+xml'],
        },
      },
    })
    const expected = ['/feed.xml']

    expect(value).toEqual(expected)
  })

  it('should combine URIs from all methods', () => {
    const headers = new Headers({
      Link: '</rss.xml>; rel="alternate"; type="application/rss+xml"',
    })
    const value = discoverUris({
      html: {
        html: '<link rel="alternate" type="application/rss+xml" href="/feed.xml">',
        options: {
          linkRels: ['alternate'],
          linkMimeTypes: ['application/rss+xml'],
          anchorUris: [],
          anchorIgnoredUris: [],
          anchorLabels: [],
        },
      },
      headers: {
        headers,
        options: {
          linkRels: ['alternate'],
          linkMimeTypes: ['application/rss+xml'],
        },
      },
      guess: {
        options: {
          baseUrl: 'https://example.com',
          uris: ['/atom.xml'],
        },
      },
    })
    const expected = ['/feed.xml', '/rss.xml', 'https://example.com/atom.xml']

    expect(value).toEqual(expected)
  })

  it('should handle duplicate URIs from different methods', () => {
    const headers = new Headers({
      Link: '</feed.xml>; rel="alternate"; type="application/rss+xml", </rss.xml>; rel="alternate"; type="application/rss+xml"',
    })
    const value = discoverUris({
      html: {
        html: '<link rel="alternate" type="application/rss+xml" href="/feed.xml"><link rel="feed" href="/rss.xml">',
        options: {
          linkRels: ['alternate', 'feed'],
          linkMimeTypes: ['application/rss+xml'],
          anchorUris: [],
          anchorIgnoredUris: [],
          anchorLabels: [],
        },
      },
      headers: {
        headers,
        options: {
          linkRels: ['alternate'],
          linkMimeTypes: ['application/rss+xml'],
        },
      },
    })
    const expected = ['/feed.xml', '/rss.xml']

    expect(value).toEqual(expected)
  })
})
