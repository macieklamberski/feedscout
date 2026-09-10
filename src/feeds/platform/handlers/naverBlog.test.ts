import { describe, expect, it } from 'bun:test'
import { naverBlogHandler } from './naverBlog.js'

describe('naverBlogHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://blog.naver.com/prologue', true],
      ['https://m.blog.naver.com/prologue', true],
      ['https://blog.naver.com', true],
      ['https://naver.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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
  })
})
