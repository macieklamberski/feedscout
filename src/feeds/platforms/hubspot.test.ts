import { describe, expect, it } from 'bun:test'
import { hubspotHandler, isHubspotHtml } from './hubspot.js'

const hubspotHtml = '<meta name="generator" content="HubSpot">'
const otherHtml = '<meta name="generator" content="WordPress 6.4">'

describe('isHubspotHtml', () => {
  it('should return true for the HubSpot generator meta tag', () => {
    expect(isHubspotHtml(hubspotHtml)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isHubspotHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isHubspotHtml('')).toBe(false)
  })
})

describe('hubspotHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(hubspotHandler.match('https://example.com/blog', hubspotHtml)).toBe(true)
    })

    it('should not match the host root', () => {
      expect(hubspotHandler.match('https://example.com/', hubspotHtml)).toBe(false)
    })

    it('should match a blog page by the hub id header', () => {
      const value = 'https://example.com/blog/some-post'
      const headers = new Headers({ 'x-hs-hub-id': '65360' })

      expect(hubspotHandler.match(value, '<html></html>', headers)).toBe(true)
    })

    it('should not match a site page the worker marks as not a blog', () => {
      const value = 'https://example.com/topic/customer-service'
      const headers = new Headers({
        'x-hs-hub-id': '53',
        'x-hs-cfworker-meta': '{"contentType":"SITE_PAGE"}',
      })

      expect(hubspotHandler.match(value, hubspotHtml, headers)).toBe(false)
    })

    it('should match a blog page whose worker header is not valid JSON', () => {
      const value = 'https://example.com/blog/some-post'
      const headers = new Headers({ 'x-hs-cfworker-meta': '{"contentType":' })

      expect(hubspotHandler.match(value, hubspotHtml, headers)).toBe(true)
    })

    it('should not match without content', () => {
      expect(hubspotHandler.match('https://example.com/blog')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(hubspotHandler.match('not-a-url', hubspotHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the blog feed', () => {
      const value = 'https://example.com/blog'
      const expected = [
        { uri: 'https://example.com/blog/rss.xml', hint: { key: 'hubspot:blog', label: 'Blog' } },
      ]

      expect(hubspotHandler.resolve(value)).toEqual(expected)
    })

    it('should use the first path segment of a post page', () => {
      const value = 'https://example.com/marketing/a-post'
      const expected = [
        {
          uri: 'https://example.com/marketing/rss.xml',
          hint: { key: 'hubspot:blog', label: 'Blog' },
        },
      ]

      expect(hubspotHandler.resolve(value)).toEqual(expected)
    })

    it('should return the author and blog feeds for an author page', () => {
      const value = 'https://example.com/blog/author/jane-doe'
      const expected = [
        {
          uri: 'https://example.com/blog/author/jane-doe/rss.xml',
          hint: { key: 'hubspot:author', label: 'Author' },
        },
        {
          uri: 'https://example.com/blog/rss.xml',
          hint: { key: 'hubspot:blog', label: 'Blog' },
        },
      ]

      expect(hubspotHandler.resolve(value)).toEqual(expected)
    })

    it('should return the author and blog feeds for an author page with a capitalized author segment', () => {
      const value = 'https://example.com/blog/Author/jane-doe'
      const expected = [
        {
          uri: 'https://example.com/blog/author/jane-doe/rss.xml',
          hint: { key: 'hubspot:author', label: 'Author' },
        },
        {
          uri: 'https://example.com/blog/rss.xml',
          hint: { key: 'hubspot:blog', label: 'Blog' },
        },
      ]

      expect(hubspotHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag and blog feeds for a topic page', () => {
      const value = 'https://example.com/blog/topic/inbound'
      const expected = [
        {
          uri: 'https://example.com/blog/topic/inbound/rss.xml',
          hint: { key: 'hubspot:tag', label: 'Tag' },
        },
        {
          uri: 'https://example.com/blog/rss.xml',
          hint: { key: 'hubspot:blog', label: 'Blog' },
        },
      ]

      expect(hubspotHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the host root', () => {
      expect(hubspotHandler.resolve('https://example.com/')).toEqual([])
    })
  })
})
