import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { exblogEnricher, exblogHandler } from './exblog.js'

const logoUrl = 'https://pds.exblog.jp/logo/1/201406/23/23/f035792320170411122334.png'

const blogPage = `
  <meta
    property="exblog:nickname"
    content="example"
  />
  <meta
    property="exblog:logo_url"
    content="${logoUrl}"
  />
`

const blogPageWithoutLogo = `
  <meta
    property="og:image"
    content="https://example.com/apple-touch-icon.png"
  />
  <meta
    property="exblog:nickname"
    content="example"
  />
`

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const createRef = (url: string): DiscoverRef => {
  return { platform: 'exblog', id: 'example', url }
}

describe('exblogHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(exblogHandler.match('https://example.exblog.jp/')).toBe(true)
    })

    it('should not match the portal', () => {
      expect(exblogHandler.match('https://www.exblog.jp/')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the logo from the blog page content', () => {
        const expected = [{ uri: logoUrl }]

        expect(exblogHandler.resolve('https://example.exblog.jp/', blogPage)).toEqual(expected)
      })

      it('should return a ref to the blog for a page passed without its content', () => {
        const value = 'https://example.exblog.jp/37927093'
        const expected = [{ platform: 'exblog', id: 'example', url: value }]

        expect(exblogHandler.resolve(value)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for a blog without a logo', () => {
        const value = 'https://example.exblog.jp/'

        expect(exblogHandler.resolve(value, blogPageWithoutLogo)).toEqual([])
      })

      it('should return empty array for the portal', () => {
        expect(exblogHandler.resolve('https://www.exblog.jp/', blogPage)).toEqual([])
      })
    })
  })
})

describe('exblogEnricher', () => {
  it('should return the logo from the blog page', async () => {
    const context = createContext({ 'https://example.exblog.jp/': blogPage })
    const ref = createRef('https://example.exblog.jp/37927093')

    expect(await exblogEnricher(ref, context)).toEqual([logoUrl])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'mastodon',
      id: 'example',
      url: 'https://example.com/@example',
    }

    expect(await exblogEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when the blog page has no logo', async () => {
    const context = createContext({ 'https://example.exblog.jp/': blogPageWithoutLogo })
    const ref = createRef('https://example.exblog.jp/37927093')

    expect(await exblogEnricher(ref, context)).toEqual([])
  })

  it('should reject when the body is a stream', async () => {
    const fetchFn: FetchFn = async (url) => ({
      headers: new Headers(),
      body: new ReadableStream(),
      url,
      status: 200,
    })
    const ref = createRef('https://example.exblog.jp/37927093')
    const throwing = () => exblogEnricher(ref, { fetchFn })

    await expect(throwing()).rejects.toThrow('Unexpected stream body')
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const ref = createRef('https://example.exblog.jp/37927093')
    const throwing = () => exblogEnricher(ref, { fetchFn })

    await expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', async () => {
    const ref = createRef('https://example.exblog.jp/37927093')
    const throwing = () => exblogEnricher(ref, createContext({}))
    const expected = 'Unexpected status 404 from https://example.exblog.jp/'

    await expect(throwing()).rejects.toThrow(expected)
  })
})
