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
  describe('CMS-only discovery (default when no options)', () => {
    it('should discover CMS feed URIs from HTML without options', () => {
      const html = '<meta name="generator" content="WordPress 6.4">'
      const expected = [
        '/feed/',
        '/feed',
        '/rss/',
        '/rss',
        '/comments/feed/',
        '/comments/feed',
        '/category/*/feed/',
        '/tag/*/feed/',
        '/wp-json/wp/v2/posts',
        '/?rest_route=/wp/v2/posts',
      ]

      expect(discoverFeedUris(html)).toEqual(expected)
    })

    it('should discover CMS feed URIs from headers without options', () => {
      const html = ''
      const headers = new Headers({ 'X-Powered-By': 'Next.js' })
      const expected = ['/feed.xml', '/rss.xml', '/api/feed']

      expect(discoverFeedUris(html, headers)).toEqual(expected)
    })

    it('should combine CMS discovery from both HTML and headers', () => {
      const html = '<meta name="generator" content="Hexo 6.3.0">'
      const headers = new Headers({ 'X-Powered-By': 'Next.js' })
      const expected = ['/atom.xml', '/rss2.xml', '/feed.xml', '/rss.xml', '/api/feed']

      expect(discoverFeedUris(html, headers)).toEqual(expected)
    })

    it('should return empty array when no CMS detected', () => {
      const html = '<html><body>No CMS</body></html>'
      const expected: Array<string> = []

      expect(discoverFeedUris(html)).toEqual(expected)
    })
  })

  describe('HTML discovery with options', () => {
    it('should discover feeds from HTML with provided options', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(html, undefined, { html: defaultHtmlOptions })).toEqual(expected)
    })

    it('should combine HTML and CMS discovery', () => {
      const html = `
        <meta name="generator" content="Jekyll v4.3.2">
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
      `
      const expected = ['/rss.xml', '/feed.xml', '/atom.xml']

      expect(discoverFeedUris(html, undefined, { html: defaultHtmlOptions })).toEqual(expected)
    })

    it('should deduplicate URIs discovered via both HTML and CMS methods', () => {
      const html = `
        <meta name="generator" content="Jekyll v4.3.2">
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
      `
      const expected = ['/feed.xml', '/atom.xml', '/rss.xml']

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

    it('should combine headers and CMS discovery', () => {
      const html = ''
      const headers = new Headers({
        Link: '</rss.xml>; rel="alternate"; type="application/rss+xml"',
        'X-Powered-By': 'Next.js',
      })
      const expected = ['/rss.xml', '/feed.xml', '/api/feed']

      expect(discoverFeedUris(html, headers, { headers: defaultHeadersOptions })).toEqual(expected)
    })
  })

  describe('all methods combined', () => {
    it('should discover feeds from HTML, headers, and CMS', () => {
      const html = `
        <meta name="generator" content="Hugo 0.120.4">
        <link rel="alternate" type="application/atom+xml" href="/atom.xml">
      `
      const headers = new Headers({
        Link: '</api/rss>; rel="alternate"; type="application/rss+xml"',
      })
      const expected = ['/atom.xml', '/api/rss', '/index.xml', '/feed.xml', '/rss.xml']

      expect(
        discoverFeedUris(html, headers, {
          html: defaultHtmlOptions,
          headers: defaultHeadersOptions,
        }),
      ).toEqual(expected)
    })

    it('should deduplicate across all three methods', () => {
      const html = `
        <meta name="generator" content="Jekyll v4.3.2">
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
      `
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const expected = ['/feed.xml', '/atom.xml', '/rss.xml']

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
      const html = `
        <meta name="generator" content="WordPress 6.4">
        <link rel="alternate" type="application/rss+xml" href="/custom.xml">
      `
      const expected = ['/custom.xml']

      expect(
        discoverFeedUris(html, undefined, {
          methods: ['html'],
          html: defaultHtmlOptions,
        }),
      ).toEqual(expected)
    })

    it('should only run CMS method when specified', () => {
      const html = `
        <meta name="generator" content="WordPress 6.4">
        <link rel="alternate" type="application/rss+xml" href="/custom.xml">
      `
      const expected = [
        '/feed/',
        '/feed',
        '/rss/',
        '/rss',
        '/comments/feed/',
        '/comments/feed',
        '/category/*/feed/',
        '/tag/*/feed/',
        '/wp-json/wp/v2/posts',
        '/?rest_route=/wp/v2/posts',
      ]

      expect(
        discoverFeedUris(html, undefined, {
          methods: ['cms'],
        }),
      ).toEqual(expected)
    })

    it('should only run headers method when specified', () => {
      const html = '<meta name="generator" content="WordPress 6.4">'
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

    it('should run html and cms methods when specified', () => {
      const html = `
        <meta name="generator" content="Hexo 6.3.0">
        <link rel="alternate" type="application/atom+xml" href="/atom.xml">
      `
      const expected = ['/atom.xml', '/rss2.xml', '/feed.xml']

      expect(
        discoverFeedUris(html, undefined, {
          methods: ['html', 'cms'],
          html: defaultHtmlOptions,
        }),
      ).toEqual(expected)
    })

    it('should exclude CMS method when not specified', () => {
      const html = `
        <meta name="generator" content="WordPress 6.4">
        <link rel="alternate" type="application/rss+xml" href="/custom.xml">
      `
      const headers = new Headers({
        Link: '</header.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const expected = ['/custom.xml', '/header.xml']

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

    it('should handle HTML without CMS or feed links', () => {
      const html = '<html><body><p>Plain content</p></body></html>'
      const expected: Array<string> = []

      expect(discoverFeedUris(html, undefined, { html: defaultHtmlOptions })).toEqual(expected)
    })

    it('should handle headers without Link header or CMS markers', () => {
      const html = ''
      const headers = new Headers({ 'Content-Type': 'text/html' })
      const expected: Array<string> = []

      expect(discoverFeedUris(html, headers, { headers: defaultHeadersOptions })).toEqual(expected)
    })

    it('should handle empty methods array', () => {
      const html = `
        <meta name="generator" content="WordPress 6.4">
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
      `
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
