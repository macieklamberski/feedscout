import { describe, expect, it } from 'bun:test'
import { discoverFeedUrisFromHtml } from './index.js'

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

describe('discoverFeedUrisFromHtml', () => {
  describe('link elements with rel="alternate"', () => {
    it('should find RSS feed link', () => {
      const value = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find Atom feed link', () => {
      const value = '<link rel="alternate" type="application/atom+xml" href="/atom.xml">'
      const expected = ['/atom.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find JSON feed link', () => {
      const value = '<link rel="alternate" type="application/json" href="/feed.json">'
      const expected = ['/feed.json']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find multiple link elements', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <link rel="alternate" type="application/atom+xml" href="/atom.xml">
      `
      const expected = ['/rss.xml', '/atom.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore link without rel="alternate"', () => {
      const value = '<link type="application/rss+xml" href="/feed.xml">'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore link without feed type', () => {
      const value = '<link rel="alternate" type="text/html" href="/page.html">'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle MIME type with charset parameter', () => {
      const value =
        '<link rel="alternate" type="application/rss+xml; charset=utf-8" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle MIME type with multiple parameters', () => {
      const value =
        '<link rel="alternate" type="application/atom+xml; charset=utf-8; boundary=test" href="/atom.xml">'
      const expected = ['/atom.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('link elements with rel="feed" (HTML5)', () => {
    it('should find feed link without MIME type', () => {
      const value = '<link rel="feed" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find feed link with RSS MIME type', () => {
      const value = '<link rel="feed" type="application/rss+xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find feed link with hAtom (text/html) MIME type', () => {
      const value = '<link rel="feed" type="text/html" href="/hatom.html">'
      const expected = ['/hatom.html']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find feed alternate link', () => {
      const value = '<link rel="feed alternate" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase rel="FEED"', () => {
      const value = '<link rel="FEED" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore alternate stylesheet', () => {
      const value = '<link rel="alternate stylesheet" href="/feed.xml">'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore feed stylesheet', () => {
      const value = '<link rel="feed stylesheet" href="/feed.xml">'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find multiple feed links with different rel values', () => {
      const value = `
        <link rel="feed" href="/feed1.xml">
        <link rel="feed alternate" href="/feed2.xml">
        <link rel="alternate" type="application/rss+xml" href="/feed3.xml">
      `
      const expected = ['/feed1.xml', '/feed2.xml', '/feed3.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle self-closing link tags', () => {
      const value = '<link rel="feed" href="/feed.xml" />'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle self-closing link tags with type attribute', () => {
      const value = '<link rel="alternate" type="application/rss+xml" href="/feed.xml" />'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('anchor elements by href suffix', () => {
    it('should find anchor with /feed URI', () => {
      const value = '<a href="/feed">RSS Feed</a>'
      const expected = ['/feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with /rss.xml URI', () => {
      const value = '<a href="/rss.xml">RSS</a>'
      const expected = ['/rss.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with /atom.xml URI', () => {
      const value = '<a href="/atom.xml">Atom</a>'
      const expected = ['/atom.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with /.rss URI (Reddit-style)', () => {
      const value = '<a href="/.rss">Reddit RSS</a>'
      const expected = ['/.rss']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with query parameter feed', () => {
      const value = '<a href="/?feed=rss">WordPress RSS</a>'
      const expected = ['/?feed=rss']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should match anchor by href suffix', () => {
      const value = '<a href="/blog/feed">Blog Feed</a>'
      const expected = ['/blog/feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should not match anchor if URI not at end', () => {
      const value = '<a href="/feed/comments">Comments</a>'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore wp-json/oembed/ URI', () => {
      const value = '<a href="/wp-json/oembed/1.0/embed">Embed</a>'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore wp-json/wp/ URI', () => {
      const value = '<a href="/wp-json/wp/v2/posts">Posts</a>'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('anchor elements by text content', () => {
    it('should find anchor with "RSS" text', () => {
      const value = '<a href="/my-feed">RSS</a>'
      const expected = ['/my-feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with "feed" text', () => {
      const value = '<a href="/custom-url">Subscribe to our feed</a>'
      const expected = ['/custom-url']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with "Atom" text', () => {
      const value = '<a href="/articles.xml">Atom Feed</a>'
      const expected = ['/articles.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with "subscribe" text', () => {
      const value = '<a href="/updates">Subscribe</a>'
      const expected = ['/updates']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with "syndicate" text', () => {
      const value = '<a href="/content.xml">Syndicate this content</a>'
      const expected = ['/content.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle case-insensitive matching', () => {
      const value = '<a href="/news.xml">RSS NEWS</a>'
      const expected = ['/news.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should find anchor with partial text match', () => {
      const value = '<a href="/blog.xml">Check out our RSS feeds here</a>'
      const expected = ['/blog.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should not match anchor without feed-related text', () => {
      const value = '<a href="/about">About Us</a>'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle anchor with nested elements', () => {
      const value = '<a href="/feed.xml"><span>RSS</span> <strong>Feed</strong></a>'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
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

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should deduplicate identical URLs', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
        <a href="/feed.xml">RSS</a>
      `
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should deduplicate URI discovered via all three methods', () => {
      const value = `
        <link rel="feed" href="/feed">
        <a href="/feed">Subscribe</a>
        <a href="/feed">RSS Feed</a>
      `
      const expected = ['/feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should deduplicate mixed discovery methods', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <a href="/rss.xml">Link</a>
        <a href="/custom">RSS</a>
        <link rel="feed" href="/custom">
      `
      const expected = ['/rss.xml', '/custom']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
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

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('custom options', () => {
    it('should use custom linkMimeTypes', () => {
      const value = '<link rel="alternate" type="custom/feed" href="/custom.xml">'
      const expected = ['/custom.xml']

      expect(
        discoverFeedUrisFromHtml(value, {
          ...defaultOptions,
          linkMimeTypes: ['custom/feed'],
        }),
      ).toEqual(expected)
    })

    it('should use custom anchorUris', () => {
      const value = '<a href="/custom-feed">Feed</a>'
      const expected = ['/custom-feed']

      expect(
        discoverFeedUrisFromHtml(value, {
          ...defaultOptions,
          anchorUris: ['/custom-feed'],
        }),
      ).toEqual(expected)
    })

    it('should use custom anchorLabels', () => {
      const value = '<a href="/news.xml">Get Updates</a>'
      const expected = ['/news.xml']

      expect(
        discoverFeedUrisFromHtml(value, {
          ...defaultOptions,
          anchorLabels: ['updates'],
        }),
      ).toEqual(expected)
    })

    it('should use custom anchorIgnoredUris', () => {
      const value = '<a href="/custom-ignore/feed">Feed</a>'
      const expected: Array<string> = []

      expect(
        discoverFeedUrisFromHtml(value, {
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

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle HTML with no feeds', () => {
      const value = '<html><body><p>No feeds here</p></body></html>'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle absolute URLs', () => {
      const value = '<link rel="feed" href="https://example.com/feed.xml">'
      const expected = ['https://example.com/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle protocol-relative URLs', () => {
      const value = '<link rel="feed" href="//feeds.example.com/rss.xml">'
      const expected = ['//feeds.example.com/rss.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore link without href attribute', () => {
      const value = '<link rel="alternate" type="application/rss+xml">'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore link with empty href attribute', () => {
      const value = '<link rel="alternate" type="application/rss+xml" href="">'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore anchor without href attribute', () => {
      const value = '<a>RSS Feed</a>'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore anchor with empty href attribute', () => {
      const value = '<a href="">RSS Feed</a>'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle HTML entities in href', () => {
      const value = '<a href="/feed?foo=1&amp;bar=2">RSS</a>'
      const expected = ['/feed?foo=1&bar=2']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle unicode characters in URIs', () => {
      const value = '<link rel="feed" href="/フィード.xml">'
      const expected = ['/フィード.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle unicode characters in anchor href', () => {
      const value = '<a href="/مدونة/feed">RSS</a>'
      const expected = ['/مدونة/feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle very large HTML document', () => {
      const feedLink = '<link rel="feed" href="/feed.xml">'
      const fillerContent = '<p>filler content</p>'.repeat(10000)
      const value = feedLink + fillerContent
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle document with many potential feed elements', () => {
      const links = Array.from({ length: 100 }, (_, i) => `<a href="/page${i}">Page ${i}</a>`).join(
        '\n',
      )
      const actualFeed = '<link rel="feed" href="/feed.xml">'
      const value = actualFeed + links
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })
  })

  // TODO: These edge cases should be handled during URL resolution phase.
  // Currently, raw URIs are returned without validation. Invalid protocols
  // and fragment-only URIs should be filtered when resolving to absolute URLs.
  describe('unsupported edge cases', () => {
    it('should return hash-only href when matched by text', () => {
      const value = '<a href="#">RSS Feed</a>'
      const expected = ['#']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should return javascript protocol when matched by text', () => {
      const value = '<a href="javascript:void(0)">RSS Feed</a>'
      const expected = ['javascript:void(0)']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should return mailto protocol when matched by text', () => {
      const value = '<a href="mailto:feed@example.com">Subscribe via email</a>'
      const expected = ['mailto:feed@example.com']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should return tel protocol when matched by text', () => {
      const value = '<a href="tel:+1234567890">RSS Hotline</a>'
      const expected = ['tel:+1234567890']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should return data protocol when matched by text', () => {
      const value = '<a href="data:text/plain,feed">RSS Feed</a>'
      const expected = ['data:text/plain,feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should return href matched by suffix even with whitespace-only text', () => {
      const value = '<a href="/feed">   </a>'
      const expected = ['/feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('case-sensitivity (leniency)', () => {
    it('should handle uppercase rel="ALTERNATE"', () => {
      const value = '<link rel="ALTERNATE" type="application/rss+xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle mixed case rel="Feed Alternate"', () => {
      const value = '<link rel="Feed Alternate" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase content type', () => {
      const value = '<link rel="alternate" type="APPLICATION/RSS+XML" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle mixed case content type', () => {
      const value = '<link rel="alternate" type="Application/Atom+Xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase anchor href /FEED (by href only)', () => {
      const value = '<a href="/FEED">Link</a>'
      const expected = ['/FEED']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle mixed case anchor href /Feed (by href only)', () => {
      const value = '<a href="/Feed">Link</a>'
      const expected = ['/Feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase anchor href /RSS.XML (by href only)', () => {
      const value = '<a href="/RSS.XML">Link</a>'
      const expected = ['/RSS.XML']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle mixed case anchor href /Atom.Xml (by href only)', () => {
      const value = '<a href="/Atom.Xml">Link</a>'
      const expected = ['/Atom.Xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase query param /?FEED=RSS (by href only)', () => {
      const value = '<a href="/?FEED=RSS">Link</a>'
      const expected = ['/?FEED=RSS']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore mixed case wp-json/oembed URI with feed suffix', () => {
      const value = '<a href="/WP-JSON/OEMBED/feed">Link</a>'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should ignore mixed case Wp-Json/Wp URI with feed suffix', () => {
      const value = '<a href="/Wp-Json/Wp/feed">Link</a>'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle uppercase anchor text "RSS"', () => {
      const value = '<a href="/my-feed">RSS</a>'
      const expected = ['/my-feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle lowercase anchor text "rss"', () => {
      const value = '<a href="/my-feed">rss</a>'
      const expected = ['/my-feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle mixed case anchor text "Subscribe"', () => {
      const value = '<a href="/updates">Subscribe</a>'
      const expected = ['/updates']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })
  })

  describe('exotic edge cases', () => {
    it('should handle very long feed URLs', () => {
      const longUrl = `/feed/${'a'.repeat(1000)}.xml`
      const value = `<link rel="feed" href="${longUrl}">`
      const expected = [longUrl]

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle URL-encoded characters in href', () => {
      const value = '<link rel="feed" href="/feed%20rss.xml">'
      const expected = ['/feed%20rss.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle multiple spaces in attributes', () => {
      const value = '<link    rel="alternate"    type="application/rss+xml"    href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle tabs in attributes', () => {
      const value = '<link\trel="alternate"\ttype="application/rss+xml"\thref="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle newlines in attributes', () => {
      const value = '<link\nrel="alternate"\ntype="application/rss+xml"\nhref="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle anchor with title attribute', () => {
      const value = '<a href="/feed" title="Subscribe">RSS Feed</a>'
      const expected = ['/feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle anchor with class attribute', () => {
      const value = '<a href="/custom" class="feed-link">RSS</a>'
      const expected = ['/custom']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle malformed HTML with unclosed tags', () => {
      const value = '<link rel="feed" href="/feed.xml"><div>content'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle link elements in HTML comments', () => {
      const value = '<!-- <link rel="feed" href="/commented.xml"> -->'
      const expected: Array<string> = []

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle mixed quote styles in attributes', () => {
      const value = '<link rel=\'alternate\' type="application/rss+xml" href="/feed.xml">'
      const expected = ['/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle attributes without quotes', () => {
      const value = '<a href=/feed>RSS</a>'
      const expected = ['/feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle anchor with multiple nested elements', () => {
      const value = '<a href="/feed"><div><span>RSS</span><strong>Feed</strong></div></a>'
      const expected = ['/feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle international domain names in href', () => {
      const value = '<link rel="feed" href="https://例え.jp/feed.xml">'
      const expected = ['https://例え.jp/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle punycode domains in href', () => {
      const value = '<link rel="feed" href="https://xn--r8jz45g.jp/feed.xml">'
      const expected = ['https://xn--r8jz45g.jp/feed.xml']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle feed URL with fragment identifier', () => {
      const value = '<link rel="feed" href="/feed.xml#latest">'
      const expected = ['/feed.xml#latest']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle feed URL with complex query parameters', () => {
      const value = '<a href="/feed?category=tech&sort=date&limit=10">RSS</a>'
      const expected = ['/feed?category=tech&sort=date&limit=10']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle anchor with onclick attribute', () => {
      const value = '<a href="/feed" onclick="trackClick()">RSS</a>'
      const expected = ['/feed']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })

    it('should handle zero-width spaces in anchor text', () => {
      const value = '<a href="/custom">RSS\u200B</a>'
      const expected = ['/custom']

      expect(discoverFeedUrisFromHtml(value, defaultOptions)).toEqual(expected)
    })
  })
})
