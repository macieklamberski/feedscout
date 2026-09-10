import { describe, expect, it } from 'bun:test'
import { blogspotHandler } from './blogspot.js'

describe('blogspotHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://example.blogspot.com', true],
      ['https://blog.example.blogspot.com', true],
      ['https://example.blogspot.co.uk', true],
      ['https://example.blogspot.de', true],
      ['https://example.blogspot.fr', true],
      ['https://example.blogspot.in', true],
      ['https://example.blogspot.jp', true],
      ['https://example.blogspot.com.br', true],
      ['https://blogspot.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(blogspotHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(blogspotHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URLs for blog', () => {
      const value = 'https://example.blogspot.com'
      const expected = [
        {
          uri: 'https://example.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary-atom', label: 'Posts summary (Atom)' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary-rss', label: 'Posts summary (RSS)' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: 'https://example.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments-rss', label: 'Comments (RSS)' },
        },
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for post page without content', () => {
      const value = 'https://blog.blogspot.com/2024/01/some-post.html'
      const expected = [
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary-atom', label: 'Posts summary (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary-rss', label: 'Posts summary (RSS)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments-rss', label: 'Comments (RSS)' },
        },
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })

    it('should include per-post comments feeds when postId found in content', () => {
      const value = 'https://blog.blogspot.com/2024/01/some-post.html'
      const content = `
        <html><head>
        <link rel="alternate" type="application/atom+xml" title="Post Comments"
          href="https://blog.blogspot.com/feeds/1234567890/comments/default" />
        </head></html>
      `
      const expected = [
        {
          uri: 'https://blog.blogspot.com/feeds/1234567890/comments/default',
          hint: { key: 'blogspot:post-comments-atom', label: 'Post comments (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/1234567890/comments/default?alt=rss',
          hint: { key: 'blogspot:post-comments-rss', label: 'Post comments (RSS)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary-atom', label: 'Posts summary (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary-rss', label: 'Posts summary (RSS)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments-rss', label: 'Comments (RSS)' },
        },
      ]

      expect(blogspotHandler.resolve(value, content)).toEqual(expected)
    })

    it('should not emit per-post feeds for non-post URLs even with content', () => {
      const value = 'https://blog.blogspot.com/'
      const content = '<link href="https://blog.blogspot.com/feeds/1234567890/comments/default" />'
      const result = blogspotHandler.resolve(value, content) as Array<{ hint?: { key: string } }>

      for (const entry of result) {
        expect(entry.hint?.key?.startsWith('blogspot:post-comments')).toBe(false)
      }
    })

    it('should include label feeds when on label page', () => {
      const value = 'https://blog.blogspot.com/search/label/technology'
      const expected = [
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default/-/technology',
          hint: { key: 'blogspot:label-atom', label: 'Label (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default/-/technology?alt=rss',
          hint: { key: 'blogspot:label-rss', label: 'Label (RSS)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary-atom', label: 'Posts summary (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary-rss', label: 'Posts summary (RSS)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments-atom', label: 'Comments (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments-rss', label: 'Comments (RSS)' },
        },
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })
  })
})
