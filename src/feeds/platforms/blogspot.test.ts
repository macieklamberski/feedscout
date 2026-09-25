import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { blogspotHandler } from './blogspot.js'

describe('blogspotHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.blogspot.com'],
      [true, 'https://blog.example.blogspot.com'],
      [true, 'https://example.blogspot.co.uk'],
      [true, 'https://example.blogspot.de'],
      [true, 'https://example.blogspot.fr'],
      [true, 'https://example.blogspot.in'],
      [true, 'https://example.blogspot.jp'],
      [true, 'https://example.blogspot.com.br'],
      [false, 'https://blogspot.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(blogspotHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(blogspotHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
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

    it('should return feed URLs for post page without content', () => {
      const value = 'https://blog.blogspot.com/2024/01/some-post.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
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
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.blogspot.com/feeds/1234567890/comments/default',
          hint: { key: 'blogspot:post-comments', label: 'Post comments', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/1234567890/comments/default?alt=rss',
          hint: { key: 'blogspot:post-comments', label: 'Post comments', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value, content)).toEqual(expected)
    })

    it('should include per-post comments feeds when the link href is single-quoted', () => {
      const value = 'https://blog.blogspot.com/2024/01/some-post.html'
      const content = `
        <link
          rel='alternate'
          href='https://blog.blogspot.com/feeds/1234567890/comments/default'
        />
      `
      const expected: DiscoverUriEntry = {
        uri: 'https://blog.blogspot.com/feeds/1234567890/comments/default',
        hint: { key: 'blogspot:post-comments', label: 'Post comments', format: 'atom' },
      }

      expect(blogspotHandler.resolve(value, content)).toContainEqual(expected)
    })

    it('should not emit per-post feeds for non-post URLs even with content', () => {
      const value = 'https://blog.blogspot.com/'
      const content = '<link href="https://blog.blogspot.com/feeds/1234567890/comments/default" />'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value, content)).toEqual(expected)
    })

    it('should not emit per-post feeds for post URL when content has no comments feed link', () => {
      const value = 'https://blog.blogspot.com/2024/01/some-post.html'
      const content = '<html><head><title>Some post</title></head></html>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value, content)).toEqual(expected)
    })

    it('should include label feeds when on label page', () => {
      const value = 'https://blog.blogspot.com/search/label/technology'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default/-/technology',
          hint: { key: 'blogspot:label', label: 'Label', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default/-/technology?alt=rss',
          hint: { key: 'blogspot:label', label: 'Label', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/summary?alt=rss',
          hint: { key: 'blogspot:posts-summary', label: 'Posts summary', format: 'rss' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'atom' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/comments/default?alt=rss',
          hint: { key: 'blogspot:comments', label: 'Comments', format: 'rss' },
        },
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })
  })
})
