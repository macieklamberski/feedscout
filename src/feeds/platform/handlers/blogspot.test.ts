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
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for post page', () => {
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
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })

    it('should include label feed when on label page', () => {
      const value = 'https://blog.blogspot.com/search/label/technology'
      const expected = [
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default/-/technology',
          hint: { key: 'blogspot:label', label: 'Label' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default',
          hint: { key: 'blogspot:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://blog.blogspot.com/feeds/posts/default?alt=rss',
          hint: { key: 'blogspot:posts-rss', label: 'Posts (RSS)' },
        },
      ]

      expect(blogspotHandler.resolve(value)).toEqual(expected)
    })
  })
})
