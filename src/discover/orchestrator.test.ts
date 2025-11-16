import { describe, expect, it } from 'bun:test'
import { discoverFeedUris } from './orchestrator.js'

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
  describe('no options provided', () => {
    it('should return empty array when no options provided', () => {
      const html = '<meta name="generator" content="WordPress 6.4">'
      const expected: Array<string> = []

      expect(discoverFeedUris(html)).toEqual(expected)
    })

    it('should return empty array for headers without options', () => {
      const html = ''
      const headers = new Headers({ 'X-Powered-By': 'Next.js' })
      const expected: Array<string> = []

      expect(discoverFeedUris(html, headers)).toEqual(expected)
    })
  })

  describe('HTML discovery with options', () => {
    it('should discover feeds from HTML with provided options', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(html, undefined, { html: defaultHtmlOptions })).toEqual(expected)
    })

    it('should discover multiple feeds from HTML', () => {
      const html = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <link rel="alternate" type="application/atom+xml" href="/atom.xml">
      `
      const expected = ['/rss.xml', '/atom.xml']

      expect(discoverFeedUris(html, undefined, { html: defaultHtmlOptions })).toEqual(expected)
    })

    it('should deduplicate URIs discovered via HTML', () => {
      const html = `
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
        <link rel="alternate" type="application/atom+xml" href="/feed.xml">
      `
      const expected = ['/feed.xml']

      expect(discoverFeedUris(html, undefined, { html: defaultHtmlOptions })).toEqual(expected)
    })
  })

  describe('headers discovery with options', () => {
    it('should discover feeds from headers with provided options', () => {
      const html = ''
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const expected = ['/feed.xml']

      expect(discoverFeedUris(html, headers, { headers: defaultHeadersOptions })).toEqual(expected)
    })

    it('should discover multiple feeds from headers', () => {
      const html = ''
      const headers = new Headers({
        Link: '</rss.xml>; rel="alternate"; type="application/rss+xml", </atom.xml>; rel="alternate"; type="application/atom+xml"',
      })
      const expected = ['/rss.xml', '/atom.xml']

      expect(discoverFeedUris(html, headers, { headers: defaultHeadersOptions })).toEqual(expected)
    })
  })

  describe('all methods combined', () => {
    it('should discover feeds from HTML and headers', () => {
      const html = '<link rel="alternate" type="application/atom+xml" href="/atom.xml">'
      const headers = new Headers({
        Link: '</api/rss>; rel="alternate"; type="application/rss+xml"',
      })
      const expected = ['/atom.xml', '/api/rss']

      expect(
        discoverFeedUris(html, headers, {
          html: defaultHtmlOptions,
          headers: defaultHeadersOptions,
        }),
      ).toEqual(expected)
    })

    it('should deduplicate across both methods', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const expected = ['/feed.xml']

      expect(
        discoverFeedUris(html, headers, {
          html: defaultHtmlOptions,
          headers: defaultHeadersOptions,
        }),
      ).toEqual(expected)
    })
  })

  describe('method filtering via options', () => {
    it('should only run HTML method when specified', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/custom.xml">'
      const expected = ['/custom.xml']

      expect(
        discoverFeedUris(html, undefined, {
          methods: ['html'],
          html: defaultHtmlOptions,
        }),
      ).toEqual(expected)
    })

    it('should only run headers method when specified', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/custom.xml">'
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const expected = ['/feed.xml']

      expect(
        discoverFeedUris(html, headers, {
          methods: ['headers'],
          headers: defaultHeadersOptions,
        }),
      ).toEqual(expected)
    })

    it('should run both html and headers methods when specified', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/rss.xml">'
      const headers = new Headers({
        Link: '</atom.xml>; rel="alternate"; type="application/atom+xml"',
      })
      const expected = ['/rss.xml', '/atom.xml']

      expect(
        discoverFeedUris(html, headers, {
          methods: ['html', 'headers'],
          html: defaultHtmlOptions,
          headers: defaultHeadersOptions,
        }),
      ).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should handle empty HTML', () => {
      const html = ''
      const expected: Array<string> = []

      expect(discoverFeedUris(html)).toEqual(expected)
    })

    it('should handle empty HTML with options', () => {
      const html = ''
      const expected: Array<string> = []

      expect(discoverFeedUris(html, undefined, { html: defaultHtmlOptions })).toEqual(expected)
    })

    it('should handle empty headers', () => {
      const html = ''
      const headers = new Headers()
      const expected: Array<string> = []

      expect(discoverFeedUris(html, headers, { headers: defaultHeadersOptions })).toEqual(expected)
    })

    it('should handle HTML without feed links', () => {
      const html = '<html><body><p>Plain content</p></body></html>'
      const expected: Array<string> = []

      expect(discoverFeedUris(html, undefined, { html: defaultHtmlOptions })).toEqual(expected)
    })

    it('should handle headers without Link header', () => {
      const html = ''
      const headers = new Headers({ 'Content-Type': 'text/html' })
      const expected: Array<string> = []

      expect(discoverFeedUris(html, headers, { headers: defaultHeadersOptions })).toEqual(expected)
    })

    it('should handle empty methods array', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const expected: Array<string> = []

      expect(
        discoverFeedUris(html, undefined, {
          methods: [],
          html: defaultHtmlOptions,
        }),
      ).toEqual(expected)
    })
  })
})
