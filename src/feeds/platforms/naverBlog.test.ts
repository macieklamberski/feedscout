import { describe, expect, it } from 'bun:test'
import type { NaverBlogUrl } from './naverBlog.js'
import { naverBlogHandler, parseNaverBlogUrl } from './naverBlog.js'

describe('parseNaverBlogUrl', () => {
  it('should return the blog for a desktop blog URL', () => {
    const expected: NaverBlogUrl = { kind: 'blog', blogId: 'prologue' }

    expect(parseNaverBlogUrl('https://blog.naver.com/prologue')).toEqual(expected)
  })

  it('should return the blog for a mobile blog URL', () => {
    const expected: NaverBlogUrl = { kind: 'blog', blogId: 'prologue' }

    expect(parseNaverBlogUrl('https://m.blog.naver.com/prologue')).toEqual(expected)
  })

  it('should return the blog for a post URL', () => {
    const value = 'https://m.blog.naver.com/prologue/223000000000'
    const expected: NaverBlogUrl = { kind: 'blog', blogId: 'prologue' }

    expect(parseNaverBlogUrl(value)).toEqual(expected)
  })

  it('should return undefined for paths with dots', () => {
    expect(parseNaverBlogUrl('https://blog.naver.com/BlogList.naver')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseNaverBlogUrl('https://blog.naver.com/')).toBeUndefined()
    expect(parseNaverBlogUrl('https://blog.naver.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseNaverBlogUrl('https://naver.com/prologue')).toBeUndefined()
    expect(parseNaverBlogUrl('https://example.com/prologue')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseNaverBlogUrl('not-a-url')).toBeUndefined()
  })
})

describe('naverBlogHandler', () => {
  describe('match', () => {
    it('should match a Naver Blog URL', () => {
      expect(naverBlogHandler.match('https://blog.naver.com/prologue')).toBe(true)
    })

    it('should not match another host', () => {
      expect(naverBlogHandler.match('https://naver.com')).toBe(false)
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

    it('should return empty array for the root', () => {
      expect(naverBlogHandler.resolve('https://blog.naver.com/')).toEqual([])
    })
  })
})
