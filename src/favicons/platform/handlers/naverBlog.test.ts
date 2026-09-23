import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { naverBlogHandler } from './naverBlog.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

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

const desktopPage = `
  <html>
    <head>
      <title>Alice : 네이버 블로그</title>
    </head>
    <frameset rows="100%">
      <frame
        id="mainFrame"
        src="/PostList.naver?blogId=alice"
      />
    </frameset>
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

    it('should match desktop blog URLs', () => {
      expect(naverBlogHandler.match('https://blog.naver.com/alice')).toBe(true)
    })

    it('should match blog URLs with trailing slash', () => {
      expect(naverBlogHandler.match('https://blog.naver.com/alice/')).toBe(true)
    })

    it('should not match post URLs', () => {
      expect(naverBlogHandler.match('https://blog.naver.com/alice/223000000000')).toBe(false)
    })

    it('should not match paths with dots', () => {
      expect(naverBlogHandler.match('https://blog.naver.com/BlogList.naver')).toBe(false)
    })

    it('should not match root URL', () => {
      expect(naverBlogHandler.match('https://blog.naver.com/')).toBe(false)
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
      it('should return profile image from mobile page content', async () => {
        const result = await naverBlogHandler.resolve('https://m.blog.naver.com/alice', mobilePage)
        const expected: Array<DiscoverUriEntry> = [{ uri: profileImage }]

        expect(result).toEqual(expected)
      })

      it('should return profile image from fetched mobile page for desktop URL', async () => {
        const mockFetch = createMockFetch({ 'https://m.blog.naver.com/alice': mobilePage })
        const result = await naverBlogHandler.resolve(
          'https://blog.naver.com/alice',
          desktopPage,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [{ uri: profileImage }]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for a mobile page passed without its content', async () => {
        const mockFetch = createMockFetch({ 'https://m.blog.naver.com/alice': mobilePage })
        const result = await naverBlogHandler.resolve(
          'https://m.blog.naver.com/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for placeholder image', async () => {
        const result = await naverBlogHandler.resolve(
          'https://m.blog.naver.com/alice',
          placeholderPage,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when og:image is missing', async () => {
        const mockFetch = createMockFetch({ 'https://m.blog.naver.com/alice': desktopPage })
        const result = await naverBlogHandler.resolve(
          'https://blog.naver.com/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for desktop URL when fetchFn is not provided', async () => {
        const result = await naverBlogHandler.resolve('https://blog.naver.com/alice', desktopPage)

        expect(result).toEqual([])
      })

      it('should return empty array when fetch throws', async () => {
        const mockFetch: DiscoverFetchFn = () => {
          throw new Error('Network error')
        }
        const result = await naverBlogHandler.resolve(
          'https://blog.naver.com/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for post URLs', async () => {
        const result = await naverBlogHandler.resolve(
          'https://m.blog.naver.com/alice/223000000000',
          mobilePage,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', async () => {
        const result = await naverBlogHandler.resolve('not-a-url', mobilePage)

        expect(result).toEqual([])
      })
    })
  })
})
