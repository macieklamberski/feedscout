import { describe, expect, it } from 'bun:test'
import { discoverFeedUrisFromHeaders } from './headers.js'

const linkMimeTypes = [
  'application/json',
  'application/rdf+xml',
  'application/rss+xml',
  'application/atom+xml',
  'application/xml',
  'text/rdf+xml',
  'text/rss+xml',
  'text/atom+xml',
  'text/xml',
]

const defaultOptions = { linkMimeTypes }

describe('discoverFeedUrisFromHeaders', () => {
  describe('should discover feeds from Link header', () => {
    it('should find single Link header with rel="alternate"', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })

    it('should find multiple Link headers (comma-separated)', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml", </atom.xml>; rel="alternate"; type="application/atom+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml', '/atom.xml'])
    })

    it('should find multiple separate Link header entries', () => {
      const headers = new Headers()
      headers.append('Link', '</feed.xml>; rel="alternate"; type="application/rss+xml"')
      headers.append('Link', '</atom.xml>; rel="alternate"; type="application/atom+xml"')
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml', '/atom.xml'])
    })

    it('should find Link with absolute URL', () => {
      const headers = new Headers({
        Link: '<https://example.com/feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['https://example.com/feed.xml'])
    })

    it('should handle Link header with additional parameters', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"; title="RSS Feed"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })
  })

  describe('should filter by MIME type', () => {
    it('should only return feeds with matching MIME types', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml", </other>; rel="alternate"; type="text/html"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })

    it('should be case-insensitive for MIME type matching', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="APPLICATION/RSS+XML"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })

    it('should trim whitespace from MIME types', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type=" application/rss+xml "',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })

    it('should handle MIME type with charset parameter', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml; charset=utf-8"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })

    it('should handle MIME type with multiple parameters', () => {
      const headers = new Headers({
        Link: '</atom.xml>; rel="alternate"; type="application/atom+xml; charset=utf-8; boundary=test"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/atom.xml'])
    })
  })

  describe('should handle missing or malformed headers', () => {
    it('should return empty array when Link header is missing', () => {
      const headers = new Headers()
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual([])
    })

    it('should skip malformed Link entries (no URL)', () => {
      const headers = new Headers({
        Link: 'rel="alternate"; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual([])
    })

    it('should skip Link entries without rel attribute', () => {
      const headers = new Headers({
        Link: '</feed.xml>; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual([])
    })

    it('should skip Link entries without type attribute', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual([])
    })

    it('should skip Link entries with non-alternate rel', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="canonical"; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual([])
    })

    it('should handle empty Link header value', () => {
      const headers = new Headers({
        Link: '',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual([])
    })

    it('should handle Link header with only whitespace', () => {
      const headers = new Headers({
        Link: '   ',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual([])
    })

    it('should skip malformed angle brackets (missing opening bracket)', () => {
      const headers = new Headers({
        Link: 'feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual([])
    })

    it('should skip malformed angle brackets (missing closing bracket)', () => {
      const headers = new Headers({
        Link: '<feed.xml; rel="alternate"; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual([])
    })
  })

  describe('should handle case sensitivity', () => {
    it('should match rel="alternate" case-insensitively', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="ALTERNATE"; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })

    it('should match rel="Alternate" case-insensitively', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="Alternate"; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })
  })

  describe('should return raw URIs', () => {
    it('should return relative URIs as-is', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })

    it('should return absolute URIs as-is', () => {
      const headers = new Headers({
        Link: '<https://example.com/feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['https://example.com/feed.xml'])
    })

    it('should return path-only URIs as-is', () => {
      const headers = new Headers({
        Link: '<feed.xml>; rel="alternate"; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['feed.xml'])
    })
  })

  describe('should deduplicate URIs', () => {
    it('should deduplicate identical URIs', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="application/rss+xml", </feed.xml>; rel="alternate"; type="application/atom+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })
  })

  describe('should handle various MIME types', () => {
    it('should find application/atom+xml feeds', () => {
      const headers = new Headers({
        Link: '</atom.xml>; rel="alternate"; type="application/atom+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/atom.xml'])
    })

    it('should find application/json feeds', () => {
      const headers = new Headers({
        Link: '</feed.json>; rel="alternate"; type="application/json"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.json'])
    })

    it('should find text/xml feeds', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type="text/xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })
  })

  describe('should handle quoted and unquoted attribute values', () => {
    it('should handle unquoted rel attribute', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel=alternate; type="application/rss+xml"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })

    it('should handle single-quoted attributes', () => {
      const headers = new Headers({
        Link: "</feed.xml>; rel='alternate'; type='application/rss+xml'",
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })

    it('should handle mixed quote styles', () => {
      const headers = new Headers({
        Link: '</feed.xml>; rel="alternate"; type=\'application/rss+xml\'',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })

    it('should handle parameters in different order', () => {
      const headers = new Headers({
        Link: '</feed.xml>; type="application/rss+xml"; rel="alternate"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/feed.xml'])
    })

    it('should handle parameters with title before type and rel', () => {
      const headers = new Headers({
        Link: '</atom.xml>; title="Atom Feed"; type="application/atom+xml"; rel="alternate"',
      })
      const result = discoverFeedUrisFromHeaders(headers, defaultOptions)
      expect(result).toEqual(['/atom.xml'])
    })
  })
})
