import { describe, expect, it } from 'bun:test'
import { discoverFeedUris } from './index.js'

const baseUrl = 'https://example.com'

const defaultHtmlOptions = {
  linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
  anchorUris: ['/feed', '/rss', '/atom.xml'],
  anchorIgnoredUris: ['wp-json/oembed/'],
  anchorLabels: ['rss', 'feed', 'subscribe'],
}

const defaultHeadersOptions = {
  linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
}

describe('discoverFeedUris', () => {
  describe('no config provided', () => {
    it('should return empty array when no config provided', async () => {
      const expected: Array<string> = []

      expect(await discoverFeedUris({})).toEqual(expected)
    })
  })

  describe('HTML discovery', () => {
    it('should discover feeds from HTML with provided options', async () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: defaultHtmlOptions,
          },
        }),
      ).toEqual(expected)
    })

    it('should discover multiple feeds from HTML', async () => {
      const html = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <link rel="alternate" type="application/atom+xml" href="/atom.xml">
      `
      const expected = ['/rss.xml', '/atom.xml']

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: defaultHtmlOptions,
          },
        }),
      ).toEqual(expected)
    })

    it('should deduplicate URIs discovered via HTML', async () => {
      const html = `
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
        <link rel="alternate" type="application/atom+xml" href="/feed.xml">
      `
      const expected = ['/feed.xml']

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: defaultHtmlOptions,
          },
        }),
      ).toEqual(expected)
    })
  })

  describe('headers discovery', () => {
    it('should discover feeds from headers with provided options', async () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const expected = ['/feed.xml']

      expect(
        await discoverFeedUris({
          headers: {
            headers: headers,
            options: defaultHeadersOptions,
          },
        }),
      ).toEqual(expected)
    })

    it('should discover multiple feeds from headers', async () => {
      const headers = new Headers({
        Link: '</rss.xml>; rel="alternate"; type="application/rss+xml", </atom.xml>; rel="alternate"; type="application/atom+xml"',
      })
      const expected = ['/rss.xml', '/atom.xml']

      expect(
        await discoverFeedUris({
          headers: {
            headers: headers,
            options: defaultHeadersOptions,
          },
        }),
      ).toEqual(expected)
    })
  })

  describe('guess discovery', () => {
    it('should discover feeds from guess method', async () => {
      const mockFetchFn = async () => {
        return {
          headers: new Headers({ 'content-type': 'application/rss+xml' }),
          body: '<?xml version="1.0"?><rss version="2.0"></rss>',
          url: 'https://example.com/feed.xml',
          status: 200,
          statusText: 'OK',
        }
      }
      const expected = ['https://example.com/feed.xml']

      expect(
        await discoverFeedUris({
          guess: {
            baseUrl: baseUrl,
            options: {
              fetchFn: mockFetchFn,
              feedUris: ['/feed.xml'],
              stopOnFirst: true,
            },
          },
        }),
      ).toEqual(expected)
    })

    it('should return empty array when guess finds no valid feeds', async () => {
      const mockFetchFn = async () => {
        return {
          headers: new Headers({ 'content-type': 'text/html' }),
          body: '<html></html>',
          url: 'https://example.com/feed.xml',
          status: 200,
          statusText: 'OK',
        }
      }
      const expected: Array<string> = []

      expect(
        await discoverFeedUris({
          guess: {
            baseUrl: baseUrl,
            options: {
              fetchFn: mockFetchFn,
              feedUris: ['/feed.xml'],
            },
          },
        }),
      ).toEqual(expected)
    })

    it('should deduplicate URIs across html, headers, and guess methods', async () => {
      const html =
        '<link rel="alternate" type="application/rss+xml" href="https://example.com/feed.xml">'
      const headers = new Headers({
        Link: '<https://example.com/feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const mockFetchFn = async () => {
        return {
          headers: new Headers({ 'content-type': 'application/rss+xml' }),
          body: '<?xml version="1.0"?><rss version="2.0"></rss>',
          url: 'https://example.com/feed.xml',
          status: 200,
          statusText: 'OK',
        }
      }
      const expected = ['https://example.com/feed.xml']

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: defaultHtmlOptions,
          },
          headers: {
            headers: headers,
            options: defaultHeadersOptions,
          },
          guess: {
            baseUrl: baseUrl,
            options: {
              fetchFn: mockFetchFn,
              feedUris: ['/feed.xml'],
              stopOnFirst: true,
            },
          },
        }),
      ).toEqual(expected)
    })

    it('should combine unique feeds from all three methods', async () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/rss.xml">'
      const headers = new Headers({
        Link: '</atom.xml>; rel="alternate"; type="application/atom+xml"',
      })
      const mockFetchFn = async () => {
        return {
          headers: new Headers({ 'content-type': 'application/rss+xml' }),
          body: '<?xml version="1.0"?><rss version="2.0"></rss>',
          url: 'https://example.com/feed.xml',
          status: 200,
          statusText: 'OK',
        }
      }
      const expected = ['/rss.xml', '/atom.xml', 'https://example.com/feed.xml']

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: defaultHtmlOptions,
          },
          headers: {
            headers: headers,
            options: defaultHeadersOptions,
          },
          guess: {
            baseUrl: baseUrl,
            options: {
              fetchFn: mockFetchFn,
              feedUris: ['/feed.xml'],
              stopOnFirst: true,
            },
          },
        }),
      ).toEqual(expected)
    })

    it('should only include valid results from guess method', async () => {
      let callCount = 0
      const mockFetchFn = async (url: string) => {
        callCount++
        return {
          headers: new Headers({
            'content-type': callCount === 1 ? 'application/rss+xml' : 'text/html',
          }),
          body:
            callCount === 1 ? '<?xml version="1.0"?><rss version="2.0"></rss>' : '<html></html>',
          url: url,
          status: 200,
          statusText: 'OK',
        }
      }
      const expected = ['https://example.com/feed.xml']

      expect(
        await discoverFeedUris({
          guess: {
            baseUrl: baseUrl,
            options: {
              fetchFn: mockFetchFn,
              feedUris: ['/feed.xml', '/rss.xml'],
            },
          },
        }),
      ).toEqual(expected)
    })
  })

  describe('all methods combined', () => {
    it('should discover feeds from HTML and headers', async () => {
      const html = '<link rel="alternate" type="application/atom+xml" href="/atom.xml">'
      const headers = new Headers({
        Link: '</api/rss>; rel="alternate"; type="application/rss+xml"',
      })
      const expected = ['/atom.xml', '/api/rss']

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: defaultHtmlOptions,
          },
          headers: {
            headers: headers,
            options: defaultHeadersOptions,
          },
        }),
      ).toEqual(expected)
    })

    it('should deduplicate across HTML and headers', async () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const expected = ['/feed.xml']

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: defaultHtmlOptions,
          },
          headers: {
            headers: headers,
            options: defaultHeadersOptions,
          },
        }),
      ).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should handle empty HTML', async () => {
      const html = ''
      const expected: Array<string> = []

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: defaultHtmlOptions,
          },
        }),
      ).toEqual(expected)
    })

    it('should handle empty headers', async () => {
      const headers = new Headers()
      const expected: Array<string> = []

      expect(
        await discoverFeedUris({
          headers: {
            headers: headers,
            options: defaultHeadersOptions,
          },
        }),
      ).toEqual(expected)
    })

    it('should handle HTML without feed links', async () => {
      const html = '<html><body><p>Plain content</p></body></html>'
      const expected: Array<string> = []

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: defaultHtmlOptions,
          },
        }),
      ).toEqual(expected)
    })

    it('should handle headers without Link header', async () => {
      const headers = new Headers({ 'Content-Type': 'text/html' })
      const expected: Array<string> = []

      expect(
        await discoverFeedUris({
          headers: {
            headers: headers,
            options: defaultHeadersOptions,
          },
        }),
      ).toEqual(expected)
    })

    it('should handle very large HTML input', async () => {
      const feedLink = '<link rel="feed" href="/feed.xml">'
      const largeHtml = feedLink + '<p>content</p>'.repeat(100000)
      const expected = ['/feed.xml']

      expect(
        await discoverFeedUris({
          html: {
            html: largeHtml,
            options: defaultHtmlOptions,
          },
        }),
      ).toEqual(expected)
    })

    it('should handle HTML and headers both empty', async () => {
      const html = ''
      const headers = new Headers()
      const expected: Array<string> = []

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: defaultHtmlOptions,
          },
          headers: {
            headers: headers,
            options: defaultHeadersOptions,
          },
        }),
      ).toEqual(expected)
    })
  })

  describe('error handling', () => {
    it('should handle guess method throwing error and return other results', async () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const headers = new Headers({
        link: '</atom.xml>; rel="alternate"; type="application/atom+xml"',
      })
      const mockFetchFn = async () => {
        throw new Error('Network error')
      }
      const expected = ['/feed.xml', '/atom.xml']

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: {
              linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
              anchorUris: [],
              anchorIgnoredUris: [],
              anchorLabels: [],
            },
          },
          headers: {
            headers: headers,
            options: {
              linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
            },
          },
          guess: {
            baseUrl: 'https://example.com',
            options: {
              fetchFn: mockFetchFn,
              feedUris: ['/feed.xml'],
              includeInvalid: false,
            },
          },
        }),
      ).toEqual(expected)
    })

    it('should handle partial failure when HTML succeeds and guess fails', async () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const mockFetchFn = async () => {
        throw new Error('Network error')
      }
      const expected = ['/feed.xml']

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: {
              linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
              anchorUris: [],
              anchorIgnoredUris: [],
              anchorLabels: [],
            },
          },
          guess: {
            baseUrl: 'https://example.com',
            options: {
              fetchFn: mockFetchFn,
              feedUris: ['/rss.xml'],
              includeInvalid: false,
            },
          },
        }),
      ).toEqual(expected)
    })

    it('should return empty array when all methods fail', async () => {
      const mockFetchFn = async () => {
        throw new Error('Network error')
      }
      const expected: Array<string> = []

      expect(
        await discoverFeedUris({
          guess: {
            baseUrl: 'https://example.com',
            options: {
              fetchFn: mockFetchFn,
              feedUris: ['/feed.xml'],
              includeInvalid: false,
            },
          },
        }),
      ).toEqual(expected)
    })

    it('should handle guess returning no results without error', async () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const mockFetchFn = async () => {
        return {
          headers: new Headers({ 'content-type': 'text/html' }),
          body: '<html></html>',
          url: 'https://example.com/feed.xml',
          status: 404,
          statusText: 'Not Found',
        }
      }
      const expected = ['/feed.xml']

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: {
              linkMimeTypes: ['application/rss+xml', 'application/atom+xml'],
              anchorUris: [],
              anchorIgnoredUris: [],
              anchorLabels: [],
            },
          },
          guess: {
            baseUrl: 'https://example.com',
            options: {
              fetchFn: mockFetchFn,
              feedUris: ['/feed.xml'],
            },
          },
        }),
      ).toEqual(expected)
    })

    it('should handle empty HTML and empty headers gracefully', async () => {
      const mockFetchFn = async () => {
        return {
          headers: new Headers({ 'content-type': 'application/rss+xml' }),
          body: '<?xml version="1.0"?><rss version="2.0"></rss>',
          url: 'https://example.com/feed.xml',
          status: 200,
          statusText: 'OK',
        }
      }
      const expected = ['https://example.com/feed.xml']

      expect(
        await discoverFeedUris({
          html: {
            html: '',
            options: {
              linkMimeTypes: ['application/rss+xml'],
              anchorUris: [],
              anchorIgnoredUris: [],
              anchorLabels: [],
            },
          },
          headers: {
            headers: new Headers(),
            options: {
              linkMimeTypes: ['application/rss+xml'],
            },
          },
          guess: {
            baseUrl: 'https://example.com',
            options: {
              fetchFn: mockFetchFn,
              feedUris: ['/feed.xml'],
            },
          },
        }),
      ).toEqual(expected)
    })

    it('should handle very large result sets', async () => {
      const links = Array.from({ length: 100 }).map((_, index) => {
        return `<link rel="alternate" type="application/rss+xml" href="/feed${index}.xml">`
      })
      const html = links.join('')
      const expected = Array.from({ length: 100 }).map((_, index) => {
        return `/feed${index}.xml`
      })

      expect(
        await discoverFeedUris({
          html: {
            html: html,
            options: {
              linkMimeTypes: ['application/rss+xml'],
              anchorUris: [],
              anchorIgnoredUris: [],
              anchorLabels: [],
            },
          },
        }),
      ).toEqual(expected)
    })
  })
})
