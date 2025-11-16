import { describe, expect, it } from 'bun:test'
import {
  detectCms,
  detectCmsFromHeaders,
  discoverFeedUrisFromCmsHeaders,
  discoverFeedUrisFromCmsHtml,
} from './cms.js'

describe('detectCms', () => {
  it('should detect WordPress from meta generator tag', () => {
    const value = '<meta name="generator" content="WordPress 6.4.2">'
    const expected = 'wordpress'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect WordPress from wp-content path', () => {
    const value = '<link href="/wp-content/themes/theme/style.css">'
    const expected = 'wordpress'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect WordPress from wp-includes path', () => {
    const value = '<script src="/wp-includes/js/jquery.js"></script>'
    const expected = 'wordpress'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect WordPress from wp-json path', () => {
    const value = '<link rel="https://api.w.org/" href="/wp-json/">'
    const expected = 'wordpress'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Ghost from meta generator tag', () => {
    const value = '<meta name="generator" content="Ghost 5.74">'
    const expected = 'ghost'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Ghost from ghost path', () => {
    const value = '<script src="/ghost/assets/js/main.js"></script>'
    const expected = 'ghost'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Hexo from meta generator tag', () => {
    const value = '<meta name="generator" content="Hexo 6.3.0">'
    const expected = 'hexo'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Jekyll from meta generator tag', () => {
    const value = '<meta name="generator" content="Jekyll v4.3.2">'
    const expected = 'jekyll'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Hugo from meta generator tag', () => {
    const value = '<meta name="generator" content="Hugo 0.120.4">'
    const expected = 'hugo'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Gatsby from meta generator tag', () => {
    const value = '<meta name="generator" content="Gatsby 5.12.11">'
    const expected = 'gatsby'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Drupal from meta generator tag', () => {
    const value = '<meta name="generator" content="Drupal 10 (https://www.drupal.org)">'
    const expected = 'drupal'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Drupal from sites path', () => {
    const value = '<img src="/sites/default/files/image.jpg">'
    const expected = 'drupal'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Joomla from meta generator tag', () => {
    const value = '<meta name="generator" content="Joomla! - Open Source Content Management">'
    const expected = 'joomla'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Joomla from component path', () => {
    const value = '<a href="index.php?option=com_content&view=article">Article</a>'
    const expected = 'joomla'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Medium from domain', () => {
    const value = '<link rel="canonical" href="https://medium.com/@user/post">'
    const expected = 'medium'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Blogger from meta generator tag', () => {
    const value = '<meta name="generator" content="Blogger">'
    const expected = 'blogger'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Blogger from domain', () => {
    const value = '<link rel="canonical" href="https://example.blogspot.com">'
    const expected = 'blogger'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Tumblr from domain', () => {
    const value = '<link rel="stylesheet" href="https://assets.tumblr.com/styles.css">'
    const expected = 'tumblr'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Wix from domain', () => {
    const value = '<script src="https://static.wix.com/script.js"></script>'
    const expected = 'wix'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Squarespace from domain', () => {
    const value = '<link href="https://static1.squarespace.com/style.css">'
    const expected = 'squarespace'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Webflow from meta generator tag', () => {
    const value = '<meta name="generator" content="Webflow">'
    const expected = 'webflow'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Webflow from domain', () => {
    const value = '<script src="https://assets.webflow.io/script.js"></script>'
    const expected = 'webflow'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Substack from domain', () => {
    const value = '<img src="https://substackcdn.com/image.jpg">'
    const expected = 'substack'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Bear blog from domain', () => {
    const value = '<link rel="canonical" href="https://user.bearblog.dev">'
    const expected = 'bear'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Eleventy from meta generator tag', () => {
    const value = '<meta name="generator" content="Eleventy v2.0.1">'
    const expected = 'eleventy'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Eleventy from 11ty in meta tag', () => {
    const value = '<meta name="generator" content="11ty v2.0.1">'
    const expected = 'eleventy'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Next.js from meta generator tag', () => {
    const value = '<meta name="generator" content="Next.js 14.0.4">'
    const expected = 'next'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Next.js from __next id', () => {
    const value = '<div id="__next"><p>Content</p></div>'
    const expected = 'next'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Next.js from _next path', () => {
    const value = '<script src="/_next/static/chunks/main.js"></script>'
    const expected = 'next'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Nuxt from meta generator tag', () => {
    const value = '<meta name="generator" content="Nuxt 3.9.0">'
    const expected = 'nuxt'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Nuxt from __nuxt id', () => {
    const value = '<div id="__nuxt"><p>Content</p></div>'
    const expected = 'nuxt'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect VuePress from meta generator tag', () => {
    const value = '<meta name="generator" content="VuePress 2.0.0-rc.0">'
    const expected = 'vuepress'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Docusaurus from meta generator tag', () => {
    const value = '<meta name="generator" content="Docusaurus v3.0.1">'
    const expected = 'docusaurus'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Nikola from meta generator tag', () => {
    const value = '<meta name="generator" content="Nikola (getnikola.com)">'
    const expected = 'nikola'

    expect(detectCms(value)).toBe(expected)
  })

  it('should detect Nikola from domain pattern', () => {
    const value = '<a href="https://getnikola.com">Nikola</a>'
    const expected = 'nikola'

    expect(detectCms(value)).toBe(expected)
  })

  it('should handle meta generator with different casing', () => {
    const value = '<meta name="generator" content="WORDPRESS 6.4">'
    const expected = 'wordpress'

    expect(detectCms(value)).toBe(expected)
  })

  it('should prioritize meta generator over path detection', () => {
    const value = `
      <meta name="generator" content="Ghost 5.0">
      <script src="/wp-content/themes/theme.js"></script>
    `
    const expected = 'ghost'

    expect(detectCms(value)).toBe(expected)
  })

  it('should return undefined for empty string', () => {
    const value = ''

    expect(detectCms(value)).toBeUndefined()
  })

  it('should return undefined for HTML without CMS markers', () => {
    const value = '<html><head><title>Test</title></head><body>Content</body></html>'

    expect(detectCms(value)).toBeUndefined()
  })

  it('should return undefined for non-object input', () => {
    // @ts-expect-error: This is for testing purposes.
    expect(detectCms(null)).toBeUndefined()
    // @ts-expect-error: This is for testing purposes.
    expect(detectCms(undefined)).toBeUndefined()
    // @ts-expect-error: This is for testing purposes.
    expect(detectCms(123)).toBeUndefined()
  })
})

describe('discoverFeedUrisFromCmsHtml', () => {
  it('should return all WordPress feed URIs', () => {
    const value = '<meta name="generator" content="WordPress 6.4">'
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

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return all Ghost feed URIs', () => {
    const value = '<meta name="generator" content="Ghost 5.74">'
    const expected = [
      '/rss/',
      '/rss',
      '/feed/',
      '/feed',
      '/ghost/api/v3/content/posts/',
      '/ghost/api/content/posts/',
    ]

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Hexo feed URIs', () => {
    const value = '<meta name="generator" content="Hexo 6.3.0">'
    const expected = ['/atom.xml', '/rss2.xml', '/feed.xml']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Jekyll feed URIs', () => {
    const value = '<meta name="generator" content="Jekyll v4.3.2">'
    const expected = ['/feed.xml', '/atom.xml', '/rss.xml']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Hugo feed URIs', () => {
    const value = '<meta name="generator" content="Hugo 0.120.4">'
    const expected = ['/index.xml', '/feed.xml', '/rss.xml']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Gatsby feed URIs', () => {
    const value = '<meta name="generator" content="Gatsby 5.12.11">'
    const expected = ['/rss.xml', '/feed.xml']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Drupal feed URIs', () => {
    const value = '<meta name="generator" content="Drupal 10">'
    const expected = ['/rss.xml', '/feed', '/node/feed']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Joomla feed URIs', () => {
    const value = '<meta name="generator" content="Joomla!">'
    const expected = [
      '/index.php?format=feed&type=rss',
      '/index.php?format=feed&type=atom',
      '/?format=feed',
    ]

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Medium feed URIs', () => {
    const value = '<link rel="canonical" href="https://medium.com/@user/post">'
    const expected = ['/feed', '/feed/']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Blogger feed URIs', () => {
    const value = '<meta name="generator" content="Blogger">'
    const expected = ['/feeds/posts/default', '/feeds/posts/default?alt=rss', '/atom.xml']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Tumblr feed URIs', () => {
    const value = '<link rel="stylesheet" href="https://assets.tumblr.com/styles.css">'
    const expected = ['/rss', '/feed']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Wix feed URIs', () => {
    const value = '<script src="https://static.wix.com/script.js"></script>'
    const expected = ['/feed.xml', '/rss.xml', '/blog-feed.xml']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Squarespace feed URIs', () => {
    const value = '<link href="https://static1.squarespace.com/style.css">'
    const expected = ['/blog?format=rss', '/?format=rss', '/rss']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Webflow feed URIs', () => {
    const value = '<meta name="generator" content="Webflow">'
    const expected = ['/rss.xml', '/blog-rss.xml']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Substack feed URIs', () => {
    const value = '<img src="https://substackcdn.com/image.jpg">'
    const expected = ['/feed']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Bear blog feed URIs', () => {
    const value = '<link rel="canonical" href="https://user.bearblog.dev">'
    const expected = ['/feed/', '/feed']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Eleventy feed URIs', () => {
    const value = '<meta name="generator" content="Eleventy v2.0.1">'
    const expected = ['/feed.xml', '/feed/']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Next.js feed URIs', () => {
    const value = '<div id="__next"><p>Content</p></div>'
    const expected = ['/feed.xml', '/rss.xml', '/api/feed']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Nuxt feed URIs', () => {
    const value = '<meta name="generator" content="Nuxt 3.9.0">'
    const expected = ['/feed.xml', '/rss.xml']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return VuePress feed URIs', () => {
    const value = '<meta name="generator" content="VuePress 2.0.0">'
    const expected = ['/rss.xml', '/feed.xml']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Docusaurus feed URIs', () => {
    const value = '<meta name="generator" content="Docusaurus v3.0.1">'
    const expected = ['/blog/rss.xml', '/blog/atom.xml', '/blog/feed.json']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return Nikola feed URIs', () => {
    const value = '<meta name="generator" content="Nikola (getnikola.com)">'
    const expected = ['/rss.xml', '/atom.xml']

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return empty array when no CMS is detected', () => {
    const value = '<html><head><title>Test</title></head><body>Content</body></html>'
    const expected: Array<string> = []

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })

  it('should return empty array for empty string', () => {
    const value = ''
    const expected: Array<string> = []

    expect(discoverFeedUrisFromCmsHtml(value)).toEqual(expected)
  })
})

describe('detectCmsFromHeaders', () => {
  it('should detect Next.js from X-Powered-By header', () => {
    const headers = new Headers({ 'X-Powered-By': 'Next.js' })
    const expected = 'next'

    expect(detectCmsFromHeaders(headers)).toBe(expected)
  })

  it('should detect Next.js from lowercase header', () => {
    const headers = new Headers({ 'x-powered-by': 'next.js' })
    const expected = 'next'

    expect(detectCmsFromHeaders(headers)).toBe(expected)
  })

  it('should detect Nuxt from X-Powered-By header', () => {
    const headers = new Headers({ 'X-Powered-By': 'Nuxt' })
    const expected = 'nuxt'

    expect(detectCmsFromHeaders(headers)).toBe(expected)
  })

  it('should detect WordPress from X-Pingback header', () => {
    const headers = new Headers({ 'X-Pingback': 'https://example.com/xmlrpc.php' })
    const expected = 'wordpress'

    expect(detectCmsFromHeaders(headers)).toBe(expected)
  })

  it('should detect Drupal from X-Generator header', () => {
    const headers = new Headers({ 'X-Generator': 'Drupal 8 (https://www.drupal.org)' })
    const expected = 'drupal'

    expect(detectCmsFromHeaders(headers)).toBe(expected)
  })

  it('should return undefined when no CMS headers present', () => {
    const headers = new Headers({ 'Content-Type': 'text/html' })

    expect(detectCmsFromHeaders(headers)).toBeUndefined()
  })

  it('should return undefined for empty headers', () => {
    const headers = new Headers()

    expect(detectCmsFromHeaders(headers)).toBeUndefined()
  })

  it('should prioritize X-Powered-By over other headers', () => {
    const headers = new Headers({
      'X-Powered-By': 'Next.js',
      'X-Pingback': 'https://example.com/xmlrpc.php',
    })
    const expected = 'next'

    expect(detectCmsFromHeaders(headers)).toBe(expected)
  })
})

describe('discoverFeedUrisFromCmsHeaders', () => {
  it('should return Next.js feed URIs from headers', () => {
    const headers = new Headers({ 'X-Powered-By': 'Next.js' })
    const expected = ['/feed.xml', '/rss.xml', '/api/feed']

    expect(discoverFeedUrisFromCmsHeaders(headers)).toEqual(expected)
  })

  it('should return Nuxt feed URIs from headers', () => {
    const headers = new Headers({ 'X-Powered-By': 'Nuxt' })
    const expected = ['/feed.xml', '/rss.xml']

    expect(discoverFeedUrisFromCmsHeaders(headers)).toEqual(expected)
  })

  it('should return WordPress feed URIs from headers', () => {
    const headers = new Headers({ 'X-Pingback': 'https://example.com/xmlrpc.php' })
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

    expect(discoverFeedUrisFromCmsHeaders(headers)).toEqual(expected)
  })

  it('should return Drupal feed URIs from headers', () => {
    const headers = new Headers({ 'X-Generator': 'Drupal 8' })
    const expected = ['/rss.xml', '/feed', '/node/feed']

    expect(discoverFeedUrisFromCmsHeaders(headers)).toEqual(expected)
  })

  it('should return empty array when no CMS detected from headers', () => {
    const headers = new Headers({ 'Content-Type': 'text/html' })
    const expected: Array<string> = []

    expect(discoverFeedUrisFromCmsHeaders(headers)).toEqual(expected)
  })

  it('should return empty array for empty headers', () => {
    const headers = new Headers()
    const expected: Array<string> = []

    expect(discoverFeedUrisFromCmsHeaders(headers)).toEqual(expected)
  })
})
