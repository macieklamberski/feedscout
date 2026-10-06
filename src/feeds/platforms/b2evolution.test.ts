import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { b2evolutionHandler, isB2evolutionHeaders, isB2evolutionHtml } from './b2evolution.js'

const blogHtml = `
  <head>
    <meta
      name="generator"
      content="whc 6.7.8-stable"
    />
    <link
      rel="alternate"
      type="application/rss+xml"
      title="RSS 2.0"
      href="https://example.com/?tempskin=_rss2"
    />
    <link
      rel="alternate"
      type="application/atom+xml"
      title="Atom"
      href="https://example.com/?tempskin=_atom"
    />
    <link
      rel="EditURI"
      type="application/rsd+xml"
      title="RSD"
      href="https://example.com/xmlsrv/rsd.php?blog=9520"
    />
    <script src="/rsc/js/build/evo_frontoffice.bmin.js?v=6.7.8-stable-2016-10-30"></script>
  </head>
`
const subPathHtml = `
  <head>
    <link
      rel="alternate"
      type="application/rss+xml"
      title="RSS 2.0"
      href="https://example.com/blogs/index.php?blog=3&amp;tempskin=_rss2"
    />
    <script src="https://example.com/blogs/rsc/js/jquery.min.js?v=5.0.9-stable"></script>
  </head>
`
const feedWidgetHtml = `
  <head>
    <link
      rel="stylesheet"
      href="/rsc/build/bootstrap-b2evo_base-superbundle.bmin.css?v=7.2.5-stable-2022-08-06"
    />
  </head>
  <body>
    <a
      href="https://example.com/news/?tempskin=_rss2"
      class="rss bubble"
    >News</a>
    <ul>
      <li>
        RSS 2.0:
        <a href="https://example.com/?tempskin=_rss2">Posts</a>,
        <a href="https://example.com/?tempskin=_rss2&amp;disp=comments">Comments</a>
      </li>
    </ul>
  </body>
`
const postHtml = `
  <head>
    <link
      rel="alternate"
      type="application/rss+xml"
      title="RSS 2.0"
      href="https://example.com/?tempskin=_rss2"
    />
    <script src="/rsc/js/ajax.js?v=6.7.8-stable-2016-10-30"></script>
  </head>
  <body>
    <div id="item_1278"></div>
    <a href="https://example.com/a-post?tempskin=_rss2&amp;disp=comments&amp;p=1278">
      RSS feed for comments to this post
    </a>
  </body>
`
const noFeedHtml = `
  <head>
    <link
      rel="EditURI"
      type="application/rsd+xml"
      title="RSD"
      href="https://example.com/xmlsrv/rsd.php?blog=14"
    />
    <script src="/rsc/js/build/bootstrap-evo_frontoffice-superbundle.bmin.js"></script>
  </head>
`
const notFoundHtml = `
  <head>
    <link
      rel="alternate"
      type="application/rss+xml"
      title="RSS 2.0"
      href="https://example.com/blogs/index.php/a-blog/?tempskin=_rss2"
    />
    <script src="/blogs/rsc/js/build/evo_frontoffice.bmin.js?v=7.2.5-stable-2022-08-06"></script>
  </head>
  <body class="desktop_device coll_2 disp_404 detail_404-item-not-found"></body>
`
const legacyNotFoundHtml = `
  <head>
    <link
      rel="alternate"
      type="application/rss+xml"
      title="RSS 2.0"
      href="https://example.com/blogues/index.php/a-blog/?tempskin=_rss2"
    />
    <script src="https://example.com/blogues/rsc/js/jquery.min.js?v=5.0.9-stable"></script>
  </head>
  <body>
    <div class="widget error_404"></div>
  </body>
`
const wordpressHtml = `
  <head>
    <link
      rel="alternate"
      type="application/rss+xml"
      href="https://example.com/feed/"
    />
    <script src="/wp-includes/js/jquery/jquery.min.js"></script>
  </head>
`
const blogFeeds: Array<DiscoverUriEntry> = [
  {
    uri: 'https://example.com/?tempskin=_rss2',
    hint: { key: 'b2evolution:posts', label: 'Posts', format: 'rss' },
  },
  {
    uri: 'https://example.com/?tempskin=_atom',
    hint: { key: 'b2evolution:posts', label: 'Posts', format: 'atom' },
  },
  {
    uri: 'https://example.com/?tempskin=_rss2&disp=comments',
    hint: { key: 'b2evolution:comments', label: 'Comments', format: 'rss' },
  },
  {
    uri: 'https://example.com/?tempskin=_atom&disp=comments',
    hint: { key: 'b2evolution:comments', label: 'Comments', format: 'atom' },
  },
]

describe('isB2evolutionHtml', () => {
  it('should return true for a script from the rsc directory', () => {
    expect(isB2evolutionHtml(blogHtml)).toBe(true)
  })

  it('should return true for a stylesheet from the rsc build directory', () => {
    expect(isB2evolutionHtml(feedWidgetHtml)).toBe(true)
  })

  it('should return true for a stylesheet from the rsc css directory', () => {
    const value = '<link rel="stylesheet" href="/rsc/css/ie9.css?v=6.7.8-stable">'

    expect(isB2evolutionHtml(value)).toBe(true)
  })

  it('should return true for the generator of an install without rsc assets', () => {
    const value = `
      <meta
        name="generator"
        content="b2evolution 3.3.3"
      />
      <link rel="stylesheet" href="style.css">
    `

    expect(isB2evolutionHtml(value)).toBe(true)
  })

  it('should return false for WordPress', () => {
    expect(isB2evolutionHtml(wordpressHtml)).toBe(false)
  })
})

describe('isB2evolutionHeaders', () => {
  it('should return true for the session cookie', () => {
    const value = new Headers({ 'set-cookie': 'session_b2evo=1562423095_Jt2km7gz; path=/' })

    expect(isB2evolutionHeaders(value)).toBe(true)
  })

  it('should return true for the session cookie named per site', () => {
    const value = new Headers({ 'set-cookie': 'session_b2evo__example_com=40000823_8OqY' })

    expect(isB2evolutionHeaders(value)).toBe(true)
  })

  it('should return false for another session cookie', () => {
    const value = new Headers({ 'set-cookie': 'PHPSESSID=abc; path=/' })

    expect(isB2evolutionHeaders(value)).toBe(false)
  })
})

describe('b2evolutionHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(b2evolutionHandler.match('https://example.com/', blogHtml)).toBe(true)
    })

    it('should match a blog page by the session cookie', () => {
      const value = '<link rel="alternate" href="https://example.com/?tempskin=_rss2">'
      const headers = new Headers({ 'set-cookie': 'session_b2evo=1562423095_Jt2km7gz' })

      expect(b2evolutionHandler.match('https://example.com/', value, headers)).toBe(true)
    })

    it('should not match a page that links no blog feed', () => {
      expect(b2evolutionHandler.match('https://example.com/', noFeedHtml)).toBe(false)
    })

    it('should not match the 404 page of an unknown blog path', () => {
      const value = 'https://example.com/blogs/index.php/no-such-blog/'

      expect(b2evolutionHandler.match(value, notFoundHtml)).toBe(false)
    })

    it('should not match the 404 page of an install older than 6.0', () => {
      const value = 'https://example.com/blogues/index.php/no-such-blog/'

      expect(b2evolutionHandler.match(value, legacyNotFoundHtml)).toBe(false)
    })

    it('should not match WordPress', () => {
      expect(b2evolutionHandler.match('https://example.com/', wordpressHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts and comments feeds of a blog', () => {
      expect(b2evolutionHandler.resolve('https://example.com/', blogHtml)).toEqual(blogFeeds)
    })

    it('should return the feeds of a blog named in the query', () => {
      const value = 'https://example.com/blogs/index.php?blog=3'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/blogs/index.php?blog=3&tempskin=_rss2',
          hint: { key: 'b2evolution:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.com/blogs/index.php?blog=3&tempskin=_atom',
          hint: { key: 'b2evolution:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.com/blogs/index.php?blog=3&tempskin=_rss2&disp=comments',
          hint: { key: 'b2evolution:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: 'https://example.com/blogs/index.php?blog=3&tempskin=_atom&disp=comments',
          hint: { key: 'b2evolution:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(b2evolutionHandler.resolve(value, subPathHtml)).toEqual(expected)
    })

    it('should return the blog feeds named by the feed widget without alternate links', () => {
      expect(b2evolutionHandler.resolve('https://example.com/', feedWidgetHtml)).toEqual(blogFeeds)
    })

    it('should return the post comments feed the post page links', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/a-post?tempskin=_rss2&disp=comments&p=1278',
          hint: { key: 'b2evolution:post-comments', label: 'Post comments' },
        },
        ...blogFeeds,
      ]

      expect(b2evolutionHandler.resolve('https://example.com/a-post', postHtml)).toEqual(expected)
    })

    it('should return empty array for the 404 page of an unknown blog path', () => {
      const value = 'https://example.com/blogs/index.php/no-such-blog/'

      expect(b2evolutionHandler.resolve(value, notFoundHtml)).toEqual([])
    })

    it('should return empty array for a page that links no blog feed', () => {
      expect(b2evolutionHandler.resolve('https://example.com/', noFeedHtml)).toEqual([])
    })
  })
})
