import { describe, expect, it } from 'bun:test'
import { type HubspotUrl, hubspotHandler, isHubspotHtml, parseHubspotUrl } from './hubspot.js'

const hubspotHtml = '<meta name="generator" content="HubSpot">'
const otherHtml = '<meta name="generator" content="WordPress 6.4">'
const blogFeedLink = '<link rel="alternate" href="https://example.com/blog/rss.xml">'
const blogHtml = `${hubspotHtml}${blogFeedLink}`

describe('parseHubspotUrl', () => {
  it('should return the author for an author listing', () => {
    const expected: HubspotUrl = { kind: 'author', blog: 'blog', name: 'jane' }

    expect(parseHubspotUrl('https://example.com/blog/author/jane')).toEqual(expected)
  })

  it('should return the tag for a tag listing', () => {
    const expected: HubspotUrl = { kind: 'tag', blog: 'blog', route: 'tag', name: 'news' }

    expect(parseHubspotUrl('https://example.com/blog/tag/news')).toEqual(expected)
  })

  it('should return the tag for a topic listing with a capitalized route', () => {
    const expected: HubspotUrl = { kind: 'tag', blog: 'blog', route: 'topic', name: 'news' }

    expect(parseHubspotUrl('https://example.com/blog/Topic/news')).toEqual(expected)
  })

  it('should return the blog for a post', () => {
    const expected: HubspotUrl = { kind: 'blog', blog: 'blog' }

    expect(parseHubspotUrl('https://example.com/blog/some-post')).toEqual(expected)
  })

  it('should return undefined for a page the parser does not name', () => {
    expect(parseHubspotUrl('https://example.com/')).toBeUndefined()
  })
})

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
      expect(hubspotHandler.match('https://example.com/blog', blogHtml)).toBe(true)
    })

    it('should not match the host root', () => {
      expect(hubspotHandler.match('https://example.com/', hubspotHtml)).toBe(false)
    })

    it('should match a blog page by the hub id header', () => {
      const value = 'https://example.com/blog/some-post'
      const headers = new Headers({ 'x-hs-hub-id': '65360' })

      expect(hubspotHandler.match(value, blogFeedLink, headers)).toBe(true)
    })

    it('should not match a site page the worker marks as not a blog', () => {
      const value = 'https://example.com/topic/customer-service'
      const headers = new Headers({
        'x-hs-hub-id': '53',
        'x-hs-cfworker-meta': '{"contentType":"SITE_PAGE"}',
      })

      expect(hubspotHandler.match(value, hubspotHtml, headers)).toBe(false)
    })

    it('should match a blog listing the worker marks as a blog', () => {
      const value = 'https://example.com/marketing'
      const headers = new Headers({
        'x-hs-hub-id': '53',
        'x-hs-cfworker-meta': '{"contentType":"BLOG"}',
      })

      expect(hubspotHandler.match(value, hubspotHtml, headers)).toBe(true)
    })

    it('should match a blog at the host root by its feed link', () => {
      const content = `${hubspotHtml}<link rel="alternate" href="https://example.com/rss.xml">`

      expect(hubspotHandler.match('https://example.com/', content)).toBe(true)
    })

    it('should match a blog page whose worker header is not valid JSON', () => {
      const value = 'https://example.com/blog/some-post'
      const headers = new Headers({ 'x-hs-cfworker-meta': '{"contentType":' })

      expect(hubspotHandler.match(value, blogHtml, headers)).toBe(true)
    })

    it('should not match a site page that links no blog feed', () => {
      expect(hubspotHandler.match('https://www.example.com/pricing', hubspotHtml)).toBe(false)
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

    it('should build the feeds from the blog root the feed link names', () => {
      const value = 'https://example.com/en/blog/author/jane'
      const content = '<link rel="alternate" href="https://example.com/en/blog/rss.xml">'
      const expected = [
        {
          uri: 'https://example.com/en/blog/author/jane/rss.xml',
          hint: { key: 'hubspot:author', label: 'Author' },
        },
        {
          uri: 'https://example.com/en/blog/rss.xml',
          hint: { key: 'hubspot:blog', label: 'Blog' },
        },
      ]

      expect(hubspotHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the feed of a blog at the host root for one of its posts', () => {
      const value = 'https://blog.example.com/my-post-slug'
      const content = '<link rel="alternate" href="https://blog.example.com/rss.xml">'
      const expected = [
        {
          uri: 'https://blog.example.com/rss.xml',
          hint: { key: 'hubspot:blog', label: 'Blog' },
        },
      ]

      expect(hubspotHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
