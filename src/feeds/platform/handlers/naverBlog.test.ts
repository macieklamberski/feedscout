import { describe, expect, it } from 'bun:test'
import { naverBlogHandler } from './naverBlog.js'

describe('naverBlogHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://blog.naver.com/prologue'],
      [true, 'https://m.blog.naver.com/prologue'],
      [true, 'https://blog.naver.com'],
      [false, 'https://naver.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(naverBlogHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(naverBlogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://blog.naver.com/prologue'
      const expected = [
        {
          uri: 'https://rss.blog.naver.com/prologue.xml',
          hint: { key: 'naver-blog:blog', label: 'Blog' },
        },
      ]

      expect(naverBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for mobile domain', () => {
      const value = 'https://m.blog.naver.com/prologue'
      const expected = [
        {
          uri: 'https://rss.blog.naver.com/prologue.xml',
          hint: { key: 'naver-blog:blog', label: 'Blog' },
        },
      ]

      expect(naverBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://blog.naver.com/prologue/123'
      const expected = [
        {
          uri: 'https://rss.blog.naver.com/prologue.xml',
          hint: { key: 'naver-blog:blog', label: 'Blog' },
        },
      ]

      expect(naverBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://blog.naver.com/'

      expect(naverBlogHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for paths with dots', () => {
      const value = 'https://blog.naver.com/BlogList.naver'

      expect(naverBlogHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
