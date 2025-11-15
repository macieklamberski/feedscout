import { describe, expect, it } from 'bun:test'
import { discoverFeedUris } from './index.js'

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

const anchorUris = [
  '/feed',
  '/rss',
  '/atom',
  '/rss.xml',
  '/atom.xml',
  '/feed.xml',
  '/feed.rss',
  '/feed.atom',
  '/feed.rss.xml',
  '/feed.atom.xml',
  '/index.xml',
  '/index.rss',
  '/index.atom',
  '/index.rss.xml',
  '/index.atom.xml',
  '/?format=rss',
  '/?format=atom',
  '/?rss=1',
  '/?atom=1',
  '/?feed=rss',
  '/?feed=rss2',
  '/?feed=atom',
  '/.rss',
  '/f.json',
  '/f.rss',
  '/feed.json',
  '/json',
  '/.feed',
  '/comments/feed',
]

const anchorIgnoredUris = ['wp-json/oembed/', 'wp-json/wp/']

const anchorLabels = ['rss', 'feed', 'atom', 'subscribe', 'syndicate', 'json feed']

const defaultOptions = {
  linkMimeTypes,
  anchorUris,
  anchorIgnoredUris,
  anchorLabels,
}

describe('discoverFeedUris', () => {
  describe('link elements with rel="alternate"', () => {
    it('should find RSS feed link', () => {
      const value = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find Atom feed link', () => {
      const value = '<link rel="alternate" type="application/atom+xml" href="/atom.xml">'
      const expected = ['/atom.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find JSON feed link', () => {
      const value = '<link rel="alternate" type="application/json" href="/feed.json">'
      const expected = ['/feed.json']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find multiple link elements', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <link rel="alternate" type="application/atom+xml" href="/atom.xml">
      `
      const expected = ['/rss.xml', '/atom.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore link without rel="alternate"', () => {
      const value = '<link type="application/rss+xml" href="/feed.xml">'
      const expected: Array<string> = []

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore link without feed type', () => {
      const value = '<link rel="alternate" type="text/html" href="/page.html">'
      const expected: Array<string> = []

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('link elements with rel="feed" (HTML5)', () => {
    it('should find feed link without MIME type', () => {
      const value = '<link rel="feed" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find feed link with RSS MIME type', () => {
      const value = '<link rel="feed" type="application/rss+xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find feed link with hAtom (text/html) MIME type', () => {
      const value = '<link rel="feed" type="text/html" href="/hatom.html">'
      const expected = ['/hatom.html']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find feed alternate link', () => {
      const value = '<link rel="feed alternate" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase rel="FEED"', () => {
      const value = '<link rel="FEED" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore alternate stylesheet', () => {
      const value = '<link rel="alternate stylesheet" href="/feed.xml">'
      const expected: Array<string> = []

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find multiple feed links with different rel values', () => {
      const value = `
        <link rel="feed" href="/feed1.xml">
        <link rel="feed alternate" href="/feed2.xml">
        <link rel="alternate" type="application/rss+xml" href="/feed3.xml">
      `
      const expected = ['/feed1.xml', '/feed2.xml', '/feed3.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('anchor elements by href suffix', () => {
    it('should find anchor with /feed URI', () => {
      const value = '<a href="/feed">RSS Feed</a>'
      const expected = ['/feed']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with /rss.xml URI', () => {
      const value = '<a href="/rss.xml">RSS</a>'
      const expected = ['/rss.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with /atom.xml URI', () => {
      const value = '<a href="/atom.xml">Atom</a>'
      const expected = ['/atom.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with /.rss URI (Reddit-style)', () => {
      const value = '<a href="/.rss">Reddit RSS</a>'
      const expected = ['/.rss']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with query parameter feed', () => {
      const value = '<a href="/?feed=rss">WordPress RSS</a>'
      const expected = ['/?feed=rss']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should match anchor by href suffix', () => {
      const value = '<a href="/blog/feed">Blog Feed</a>'
      const expected = ['/blog/feed']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should not match anchor if URI not at end', () => {
      const value = '<a href="/feed/comments">Comments</a>'
      const expected: Array<string> = []

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore wp-json/oembed/ URI', () => {
      const value = '<a href="/wp-json/oembed/1.0/embed">Embed</a>'
      const expected: Array<string> = []

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore wp-json/wp/ URI', () => {
      const value = '<a href="/wp-json/wp/v2/posts">Posts</a>'
      const expected: Array<string> = []

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('anchor elements by text content', () => {
    it('should find anchor with "RSS" text', () => {
      const value = '<a href="/my-feed">RSS</a>'
      const expected = ['/my-feed']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with "feed" text', () => {
      const value = '<a href="/custom-url">Subscribe to our feed</a>'
      const expected = ['/custom-url']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with "Atom" text', () => {
      const value = '<a href="/articles.xml">Atom Feed</a>'
      const expected = ['/articles.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with "subscribe" text', () => {
      const value = '<a href="/updates">Subscribe</a>'
      const expected = ['/updates']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with "syndicate" text', () => {
      const value = '<a href="/content.xml">Syndicate this content</a>'
      const expected = ['/content.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle case-insensitive matching', () => {
      const value = '<a href="/news.xml">RSS NEWS</a>'
      const expected = ['/news.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with partial text match', () => {
      const value = '<a href="/blog.xml">Check out our RSS feeds here</a>'
      const expected = ['/blog.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should not match anchor without feed-related text', () => {
      const value = '<a href="/about">About Us</a>'
      const expected: Array<string> = []

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle anchor with nested elements', () => {
      const value = '<a href="/feed.xml"><span>RSS</span> <strong>Feed</strong></a>'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('combined scenarios', () => {
    it('should find both link and anchor elements', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <a href="/feed">Feed</a>
        <a href="/custom">Subscribe via RSS</a>
      `
      const expected = ['/rss.xml', '/feed', '/custom']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should deduplicate identical URLs', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
        <a href="/feed.xml">RSS</a>
      `
      const expected = ['/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle complex HTML document', () => {
      const value = `
        <!DOCTYPE html>
        <html>
          <head>
            <link rel="feed" href="/feed.xml">
          </head>
          <body>
            <a href="/rss.xml">RSS</a>
            <a href="/custom">Subscribe to our feed</a>
          </body>
        </html>
      `
      const expected = ['/feed.xml', '/rss.xml', '/custom']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('custom options', () => {
    it('should use custom linkMimeTypes', () => {
      const value = '<link rel="alternate" type="custom/feed" href="/custom.xml">'
      const expected = ['/custom.xml']

      expect(
        discoverFeedUris(value, {
          ...defaultOptions,
          linkMimeTypes: ['custom/feed'],
        }),
      ).toEqual(expected)
    })

    it('should use custom anchorUris', () => {
      const value = '<a href="/custom-feed">Feed</a>'
      const expected = ['/custom-feed']

      expect(
        discoverFeedUris(value, {
          ...defaultOptions,
          anchorUris: ['/custom-feed'],
        }),
      ).toEqual(expected)
    })

    it('should use custom anchorLabels', () => {
      const value = '<a href="/news.xml">Get Updates</a>'
      const expected = ['/news.xml']

      expect(
        discoverFeedUris(value, {
          ...defaultOptions,
          anchorLabels: ['updates'],
        }),
      ).toEqual(expected)
    })

    it('should use custom anchorIgnoredUris', () => {
      const value = '<a href="/custom-ignore/feed">Feed</a>'
      const expected: Array<string> = []

      expect(
        discoverFeedUris(value, {
          ...defaultOptions,
          anchorIgnoredUris: ['custom-ignore'],
        }),
      ).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should handle empty HTML', () => {
      const value = ''
      const expected: Array<string> = []

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle HTML with no feeds', () => {
      const value = '<html><body><p>No feeds here</p></body></html>'
      const expected: Array<string> = []

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle absolute URLs', () => {
      const value = '<link rel="feed" href="https://example.com/feed.xml">'
      const expected = ['https://example.com/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle protocol-relative URLs', () => {
      const value = '<link rel="feed" href="//feeds.example.com/rss.xml">'
      const expected = ['//feeds.example.com/rss.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('case-sensitivity (leniency)', () => {
    it('should handle uppercase rel="ALTERNATE"', () => {
      const value = '<link rel="ALTERNATE" type="application/rss+xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle mixed case rel="Feed Alternate"', () => {
      const value = '<link rel="Feed Alternate" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase content type', () => {
      const value = '<link rel="alternate" type="APPLICATION/RSS+XML" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle mixed case content type', () => {
      const value = '<link rel="alternate" type="Application/Atom+Xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase anchor href /FEED (by href only)', () => {
      const value = '<a href="/FEED">Link</a>'
      const expected = ['/FEED']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle mixed case anchor href /Feed (by href only)', () => {
      const value = '<a href="/Feed">Link</a>'
      const expected = ['/Feed']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase anchor href /RSS.XML (by href only)', () => {
      const value = '<a href="/RSS.XML">Link</a>'
      const expected = ['/RSS.XML']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle mixed case anchor href /Atom.Xml (by href only)', () => {
      const value = '<a href="/Atom.Xml">Link</a>'
      const expected = ['/Atom.Xml']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase query param /?FEED=RSS (by href only)', () => {
      const value = '<a href="/?FEED=RSS">Link</a>'
      const expected = ['/?FEED=RSS']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore mixed case wp-json/oembed URI with feed suffix', () => {
      const value = '<a href="/WP-JSON/OEMBED/feed">Link</a>'
      const expected: Array<string> = []

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore mixed case Wp-Json/Wp URI with feed suffix', () => {
      const value = '<a href="/Wp-Json/Wp/feed">Link</a>'
      const expected: Array<string> = []

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase anchor text "RSS"', () => {
      const value = '<a href="/my-feed">RSS</a>'
      const expected = ['/my-feed']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle lowercase anchor text "rss"', () => {
      const value = '<a href="/my-feed">rss</a>'
      const expected = ['/my-feed']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })

    it('should handle mixed case anchor text "Subscribe"', () => {
      const value = '<a href="/updates">Subscribe</a>'
      const expected = ['/updates']

      expect(discoverFeedUris(value, defaultOptions)).toEqual(expected)
    })
  })
})
