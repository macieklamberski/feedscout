import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  type BlogspotPage,
  type BlogspotUrl,
  blogspotHandler,
  getBlogspotPage,
  parseBlogspotUrl,
} from './blogspot.js'

describe('parseBlogspotUrl', () => {
  it('should return the label for a label page', () => {
    const expected: BlogspotUrl = { kind: 'label', label: 'News' }

    expect(parseBlogspotUrl('https://example.blogspot.com/search/label/News')).toEqual(expected)
  })

  it('should return the post for a post page', () => {
    const expected: BlogspotUrl = { kind: 'post' }

    expect(parseBlogspotUrl('https://example.blogspot.com/2024/01/hello.html')).toEqual(expected)
  })

  it('should return the blog for any other page', () => {
    const expected: BlogspotUrl = { kind: 'blog' }

    expect(parseBlogspotUrl('https://example.blogspot.co.uk/')).toEqual(expected)
  })

  it('should return the label for a label page on a custom domain', () => {
    const expected: BlogspotUrl = { kind: 'label', label: 'News' }

    expect(parseBlogspotUrl('https://example.com/search/label/News')).toEqual(expected)
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseBlogspotUrl('not-a-url')).toBeUndefined()
  })
})

describe('getBlogspotPage', () => {
  const value = 'https://example.blogspot.com/2024/01/some-post.html'

  it('should return the post id the comments feed link carries', () => {
    const content = '<link href="https://example.blogspot.com/feeds/1234567890/comments/default">'
    const expected: BlogspotPage = { kind: 'post', postId: '1234567890' }

    expect(getBlogspotPage(value, content)).toEqual(expected)
  })

  it('should return the post without an id when the page links no comments feed', () => {
    const expected: BlogspotPage = { kind: 'post' }

    expect(getBlogspotPage(value, '<html></html>')).toEqual(expected)
  })

  it('should return the post without an id without content', () => {
    const expected: BlogspotPage = { kind: 'post' }

    expect(getBlogspotPage(value, undefined)).toEqual(expected)
  })

  it('should leave the comments feed link out of a label page', () => {
    const value = 'https://example.blogspot.com/search/label/News'
    const content = '<link href="https://example.blogspot.com/feeds/1234567890/comments/default">'
    const expected: BlogspotPage = { kind: 'label', label: 'News' }

    expect(getBlogspotPage(value, content)).toEqual(expected)
  })
})

describe('blogspotHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.blogspot.com'],
      [false, 'https://blog.example.blogspot.com'],
      [false, 'https://www.blogspot.com'],
      [true, 'https://example.blogspot.co.uk'],
      [true, 'https://example.blogspot.de'],
      [true, 'https://example.blogspot.fr'],
      [true, 'https://example.blogspot.in'],
      [true, 'https://example.blogspot.jp'],
      [true, 'https://example.blogspot.com.br'],
      [true, 'https://example.blogspot.zz'],
      [false, 'https://blogspot.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(blogspotHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(blogspotHandler.match('not-a-url')).toBe(false)
    })

    it('should return true for a custom domain loading the Blogger widgets', () => {
      const value =
        '<script type="text/javascript" src="https://www.blogger.com/static/v1/widgets/851759228-widgets.js"></script>'

      expect(blogspotHandler.match('https://example.com/', value)).toBe(true)
    })

    it('should return false for a custom domain without the Blogger widgets', () => {
      const value =
        '<script src="https://example.com/static/v1/widgets/851759228-widgets.js"></script>'

      expect(blogspotHandler.match('https://example.com/', value)).toBe(false)
    })

    it('should return false for a page quoting the Blogger widgets url', () => {
      const value =
        '<pre><code>&lt;script src="https://www.blogger.com/static/v1/widgets/851759228-widgets.js"&gt;</code></pre>'

      expect(blogspotHandler.match('https://github.com/user/repo', value)).toBe(false)
    })

    it('should return false for an archived copy of a Blogger page', () => {
      const url = 'https://web.archive.org/web/2023/https://example.com/'
      const value =
        '<script src="https://web.archive.org/web/2023js_/https://www.blogger.com/static/v1/widgets/851759228-widgets.js"></script>'

      expect(blogspotHandler.match(url, value)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for an unparsable URL', () => {
      expect(blogspotHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the label feed for a label page on a custom domain', () => {
      const value = 'https://example.com/search/label/Chris%20Rossini'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/feeds/posts/default/-/Chris%20Rossini',
          hint: { key: 'blogspot:label', label: 'Label', format: 'atom' },
        },
        {
          uri: 'https://example.com/feeds/posts/default/-/Chris%20Rossini?alt=rss',
          hint: { key: 'blogspot:label', label: 'Label', format: 'rss' },
        },
        {
          uri: 'https://example.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://example.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://example.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://example.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })

    it('should return the label feed for a capitalized search segment', () => {
      const value = 'https://example.blogspot.com/Search/label/technology'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blogspot.com/feeds/posts/default/-/technology',
          hint: { key: 'blogspot:label', label: 'Label', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default/-/technology?alt=rss',
          hint: { key: 'blogspot:label', label: 'Label', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for blog', () => {
      const value = 'https://example.blogspot.com'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for a blog on an unlisted country domain', () => {
      const value = 'https://example.blogspot.zz'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blogspot.zz/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.zz/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.zz/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.zz/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.zz/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.zz/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for post page without content', () => {
      const value = 'https://example.blogspot.com/2024/01/some-post.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })

    it('should include per-post comments feeds when postId found in content', () => {
      const value = 'https://example.blogspot.com/2024/01/some-post.html'
      const content = `
        <html><head>
        <link rel="alternate" type="application/atom+xml" title="Post Comments"
          href="https://example.blogspot.com/feeds/1234567890/comments/default" />
        </head></html>
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blogspot.com/feeds/1234567890/comments/default',
          hint: { key: 'blogspot:post-comments', label: 'Post comments', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/1234567890/comments/default?alt=rss',
          hint: { key: 'blogspot:post-comments', label: 'Post comments', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value, content)).toEqual(expected)
    })

    it('should include per-post comments feeds for a post URL with a capitalized html extension', () => {
      const value = 'https://example.blogspot.com/2024/01/some-post.HTML'
      const content = `
        <html><head>
        <link rel="alternate" type="application/atom+xml" title="Post Comments"
          href="https://example.blogspot.com/feeds/1234567890/comments/default" />
        </head></html>
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blogspot.com/feeds/1234567890/comments/default',
          hint: { key: 'blogspot:post-comments', label: 'Post comments', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/1234567890/comments/default?alt=rss',
          hint: { key: 'blogspot:post-comments', label: 'Post comments', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value, content)).toEqual(expected)
    })

    it('should include per-post comments feeds when the link href is single-quoted', () => {
      const value = 'https://example.blogspot.com/2024/01/some-post.html'
      const content = `
        <link
          rel='alternate'
          href='https://example.blogspot.com/feeds/1234567890/comments/default'
        />
      `
      const expected: DiscoverUriEntry = {
        uri: 'https://example.blogspot.com/feeds/1234567890/comments/default',
        hint: { key: 'blogspot:post-comments', label: 'Post comments', format: 'atom' },
      }

      expect(blogspotHandler.resolve(value, content)).toContainEqual(expected)
    })

    it('should not emit per-post feeds for non-post URLs even with content', () => {
      const value = 'https://example.blogspot.com/'
      const content =
        '<link href="https://example.blogspot.com/feeds/1234567890/comments/default" />'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value, content)).toEqual(expected)
    })

    it('should not emit per-post feeds for post URL when content has no comments feed link', () => {
      const value = 'https://example.blogspot.com/2024/01/some-post.html'
      const content = '<html><head><title>Some post</title></head></html>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value, content)).toEqual(expected)
    })

    it('should include label feeds when on label page', () => {
      const value = 'https://example.blogspot.com/search/label/technology'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blogspot.com/feeds/posts/default/-/technology',
          hint: { key: 'blogspot:label', label: 'Label', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default/-/technology?alt=rss',
          hint: { key: 'blogspot:label', label: 'Label', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for an Atom posts feed', () => {
      const value = 'https://frikadel.blogspot.com/feeds/posts/default'
      const expected = 'blogspot:posts'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an RSS posts feed', () => {
      const value = 'https://911summary.blogspot.com/feeds/posts/default?alt=rss'
      const expected = 'blogspot:posts'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an Atom full posts feed', () => {
      const value = 'https://day-to-day-stuff.blogspot.com/feeds/posts/full'
      const expected = 'blogspot:posts'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an RSS full posts feed', () => {
      const value = 'https://delian.blogspot.com/feeds/posts/full?alt=rss'
      const expected = 'blogspot:posts'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an atom.xml feed', () => {
      const value = 'https://ayahsafa.blogspot.com/atom.xml'
      const expected = 'blogspot:posts'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a feed on a country domain', () => {
      const value = 'https://frikadel.blogspot.co.uk/feeds/posts/default'
      const expected = 'blogspot:posts'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an http feed', () => {
      const value = 'http://frikadel.blogspot.com/feeds/posts/default'
      const expected = 'blogspot:posts'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts summary key for an Atom summary feed', () => {
      const value = 'https://bitacoradelgaleon.blogspot.com/feeds/posts/summary'
      const expected = 'blogspot:posts-summary'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts summary key for an RSS summary feed', () => {
      const value = 'https://bitacoradelgaleon.blogspot.com/feeds/posts/summary?alt=rss'
      const expected = 'blogspot:posts-summary'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the comments key for an Atom comments feed', () => {
      const value = 'https://frikadel.blogspot.com/feeds/comments/default'
      const expected = 'blogspot:comments'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the comments key for an RSS comments feed', () => {
      const value = 'https://frikadel.blogspot.com/feeds/comments/default?alt=rss'
      const expected = 'blogspot:comments'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the comments key for an Atom full comments feed', () => {
      const value = 'https://cathychou55.blogspot.com/feeds/comments/full'
      const expected = 'blogspot:comments'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the label key for a percent-encoded Atom label feed', () => {
      const value = 'https://jenniemeid.blogspot.com/feeds/posts/default/-/Call%20of%20Cthulhu'
      const expected = 'blogspot:label'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the label key for an RSS label feed', () => {
      const value = 'https://jliu396.blogspot.com/feeds/posts/default/-/Open%20Source?alt=rss'
      const expected = 'blogspot:label'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the post comments key for an Atom post comments feed', () => {
      const value =
        'https://angka-jitu-hoki88.blogspot.com/feeds/53245391660122082/comments/default'
      const expected = 'blogspot:post-comments'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the post comments key for an RSS post comments feed', () => {
      const value =
        'https://angka-jitu-hoki88.blogspot.com/feeds/53245391660122082/comments/default?alt=rss'
      const expected = 'blogspot:post-comments'

      expect(blogspotHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a label page', () => {
      const value = 'https://example.blogspot.com/search/label/News'

      expect(blogspotHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://blogspot.com/feeds/posts/default'

      expect(blogspotHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www.blogspot.com', () => {
      const value = 'https://www.blogspot.com/feeds/posts/default'

      expect(blogspotHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.blogspot.com/feeds/posts/default'

      expect(blogspotHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://example.com/feeds/posts/default'

      expect(blogspotHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://frikadel.blogspot.com/feeds/posts/default',
        { key: 'blogspot:posts', label: 'Posts' },
      ],
      [
        'https://911summary.blogspot.com/feeds/posts/default?alt=rss',
        { key: 'blogspot:posts', label: 'Posts' },
      ],
      [
        'https://day-to-day-stuff.blogspot.com/feeds/posts/full',
        { key: 'blogspot:posts', label: 'Posts' },
      ],
      ['https://ayahsafa.blogspot.com/atom.xml', { key: 'blogspot:posts', label: 'Posts' }],
      [
        'https://bitacoradelgaleon.blogspot.com/feeds/posts/summary',
        { key: 'blogspot:posts-summary', label: 'Posts summary' },
      ],
      [
        'https://frikadel.blogspot.com/feeds/comments/default?alt=rss',
        { key: 'blogspot:comments', label: 'Comments' },
      ],
      [
        'https://cathychou55.blogspot.com/feeds/comments/full',
        { key: 'blogspot:comments', label: 'Comments' },
      ],
      [
        'https://jenniemeid.blogspot.com/feeds/posts/default/-/Call%20of%20Cthulhu',
        { key: 'blogspot:label', label: 'Label' },
      ],
      [
        'https://angka-jitu-hoki88.blogspot.com/feeds/53245391660122082/comments/default',
        { key: 'blogspot:post-comments', label: 'Post comments' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [blogspotHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
