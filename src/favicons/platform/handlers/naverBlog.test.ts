import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { naverBlogHandler } from './naverBlog.js'

const profileImage =
  'https://blogpfthumb-phinf.pstatic.net/MjAyMjAxMTlfMzUg/MDAxNjQyNTUzNzgzNDYw.PNG.alice/Profile.png?type=f204_204'

const mobilePage = `
  <html>
    <head>
      <meta
        property="og:title"
        content="Alice : 네이버 블로그"
      />
      <meta
        property="og:image"
        content="${profileImage}"
      />
    </head>
  </html>
`

const placeholderPage = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://ssl.pstatic.net/static/blog/icon/og_270x270.png"
      />
    </head>
  </html>
`

describe('naverBlogHandler', () => {
  describe('match', () => {
    it('should match mobile blog URLs', () => {
      expect(naverBlogHandler.match('https://m.blog.naver.com/alice')).toBe(true)
    })

    it('should match mobile blog URLs with trailing slash', () => {
      expect(naverBlogHandler.match('https://m.blog.naver.com/alice/')).toBe(true)
    })

    it('should not match desktop blog URLs', () => {
      expect(naverBlogHandler.match('https://blog.naver.com/alice')).toBe(false)
    })

    it('should not match post URLs', () => {
      expect(naverBlogHandler.match('https://m.blog.naver.com/alice/223000000000')).toBe(false)
    })

    it('should not match paths with dots', () => {
      expect(naverBlogHandler.match('https://m.blog.naver.com/BlogList.naver')).toBe(false)
    })

    it('should not match root URL', () => {
      expect(naverBlogHandler.match('https://m.blog.naver.com/')).toBe(false)
    })

    it('should not match non-Naver Blog URLs', () => {
      expect(naverBlogHandler.match('https://naver.com/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(naverBlogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return profile image from mobile page content', () => {
        const result = naverBlogHandler.resolve('https://m.blog.naver.com/alice', mobilePage)
        const expected: Array<DiscoverUriEntry> = [{ uri: profileImage }]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array when content is missing', () => {
        const result = naverBlogHandler.resolve('https://m.blog.naver.com/alice')

        expect(result).toEqual([])
      })

      it('should return empty array when og:image is missing', () => {
        const result = naverBlogHandler.resolve('https://m.blog.naver.com/alice', '<html></html>')

        expect(result).toEqual([])
      })

      it('should return empty array for placeholder image', () => {
        const result = naverBlogHandler.resolve('https://m.blog.naver.com/alice', placeholderPage)

        expect(result).toEqual([])
      })

      it('should return empty array for desktop blog URLs', () => {
        const result = naverBlogHandler.resolve('https://blog.naver.com/alice', mobilePage)

        expect(result).toEqual([])
      })

      it('should return empty array for post URLs', () => {
        const result = naverBlogHandler.resolve(
          'https://m.blog.naver.com/alice/223000000000',
          mobilePage,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', () => {
        const result = naverBlogHandler.resolve('not-a-url', mobilePage)

        expect(result).toEqual([])
      })
    })
  })
})
