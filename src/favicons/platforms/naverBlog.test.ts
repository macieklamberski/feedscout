import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { naverBlogEnricher, naverBlogHandler } from './naverBlog.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const ref: DiscoverRef = {
  platform: 'naverBlog',
  id: 'alice',
  url: 'https://blog.naver.com/alice',
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

describe('naverBlogHandler', () => {
  describe('match', () => {
    it('should match mobile blog URLs', () => {
      expect(naverBlogHandler.match('https://m.blog.naver.com/alice')).toBe(true)
    })

    it('should match mobile blog URLs with trailing slash', () => {
      expect(naverBlogHandler.match('https://m.blog.naver.com/alice/')).toBe(true)
    })

    it('should match desktop blog URLs', () => {
      expect(naverBlogHandler.match('https://blog.naver.com/alice')).toBe(true)
    })

    it('should match desktop blog URLs with trailing slash', () => {
      expect(naverBlogHandler.match('https://blog.naver.com/alice/')).toBe(true)
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

      it('should return ref for desktop blog URLs', () => {
        const result = naverBlogHandler.resolve('https://blog.naver.com/alice', desktopPage)
        const expected: Array<DiscoverRef> = [ref]

        expect(result).toEqual(expected)
      })

      it('should return ref for desktop blog URLs with trailing slash', () => {
        const result = naverBlogHandler.resolve('https://blog.naver.com/alice/')
        const expected: Array<DiscoverRef> = [
          {
            platform: 'naverBlog',
            id: 'alice',
            url: 'https://blog.naver.com/alice/',
          },
        ]

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

describe('naverBlogEnricher', () => {
  it('should return profile image from the mobile blog page', async () => {
    const context = createContext({ 'https://m.blog.naver.com/alice': mobilePage })

    expect(await naverBlogEnricher(ref, context)).toEqual([profileImage])
  })

  it('should return undefined for a ref of another platform', async () => {
    const otherRef: DiscoverRef = {
      platform: 'mastodon',
      id: 'alice',
      url: 'https://example.com/@alice',
    }

    expect(await naverBlogEnricher(otherRef, createContext({}))).toBeUndefined()
  })

  it('should return empty array for placeholder image', async () => {
    const context = createContext({ 'https://m.blog.naver.com/alice': placeholderPage })

    expect(await naverBlogEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when og:image is missing', async () => {
    const context = createContext({ 'https://m.blog.naver.com/alice': desktopPage })

    expect(await naverBlogEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when the response body is not a string', async () => {
    const fetchFn: FetchFn = async (url) => ({
      headers: new Headers(),
      body: new ReadableStream<Uint8Array>(),
      url,
      status: 200,
    })

    expect(await naverBlogEnricher(ref, { fetchFn })).toEqual([])
  })

  it('should return empty array when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    expect(await naverBlogEnricher(ref, { fetchFn })).toEqual([])
  })
})
