import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type GoopeUrl, goopeHandler, isGoopeHtml, parseGoopeUrl } from './goope.js'

const qrCodeHtml = '<img src="//r.goope.jp/qr/example" width="100" height="100" />'

describe('isGoopeHtml', () => {
  it('should return true for the QR code image', () => {
    expect(isGoopeHtml(qrCodeHtml)).toBe(true)
  })

  it('should return true for a favicon on cdn.goope.jp', () => {
    const value = '<link rel="shortcut icon" href="//cdn.goope.jp/12345/5ff7f4b32d656.ico" />'

    expect(isGoopeHtml(value)).toBe(true)
  })

  it('should return false for an image from cdn.goope.jp', () => {
    expect(isGoopeHtml('<img src="//cdn.goope.jp/12345/240501132547qqrc_l.png" />')).toBe(false)
  })

  it('should return false for a QR code image on another host', () => {
    expect(isGoopeHtml('<img src="/qr/example" />')).toBe(false)
  })

  it('should return false for another image on r.goope.jp', () => {
    expect(isGoopeHtml('<img src="//r.goope.jp/img/icon/rss2.png" />')).toBe(false)
  })

  it('should return false for a stylesheet on another host', () => {
    expect(isGoopeHtml('<link rel="stylesheet" href="/style.css">')).toBe(false)
  })

  it('should return false for an image without a source', () => {
    expect(isGoopeHtml('<img alt="">')).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isGoopeHtml('')).toBe(false)
  })
})

describe('parseGoopeUrl', () => {
  it('should return the free site for a path on r.goope.jp', () => {
    const expected: GoopeUrl = { kind: 'freeSite', sitePath: '/example', isMemberPage: false }

    expect(parseGoopeUrl('https://r.goope.jp/example/info/1234567')).toEqual(expected)
  })

  it('should return the template path for a free site', () => {
    const expected: GoopeUrl = {
      kind: 'freeSite',
      sitePath: '/example/t_123456',
      isMemberPage: false,
    }

    expect(parseGoopeUrl('https://r.goope.jp/example/t_123456/menu')).toEqual(expected)
  })

  it('should return the member page of a free site', () => {
    const expected: GoopeUrl = { kind: 'freeSite', sitePath: '/example', isMemberPage: true }

    expect(parseGoopeUrl('https://r.goope.jp/example/shokokai/member/info/')).toEqual(expected)
  })

  it('should return the site for a custom domain', () => {
    const expected: GoopeUrl = { kind: 'site', sitePath: '', isMemberPage: false }

    expect(parseGoopeUrl('https://example.com/info/1234567')).toEqual(expected)
  })

  it('should return the template path for a custom domain', () => {
    const expected: GoopeUrl = { kind: 'site', sitePath: '/t_123456', isMemberPage: false }

    expect(parseGoopeUrl('https://example.com/t_123456')).toEqual(expected)
  })

  it('should return the member page of a custom domain', () => {
    const expected: GoopeUrl = { kind: 'site', sitePath: '', isMemberPage: true }

    expect(parseGoopeUrl('https://example.com/shokokai/member/2/')).toEqual(expected)
  })

  it('should return the site for a shokokai page outside the members', () => {
    const expected: GoopeUrl = { kind: 'site', sitePath: '', isMemberPage: false }

    expect(parseGoopeUrl('https://example.com/shokokai/')).toEqual(expected)
  })

  it('should return undefined for the root of r.goope.jp', () => {
    expect(parseGoopeUrl('https://r.goope.jp/')).toBeUndefined()
  })

  it('should return undefined for a Goope service host', () => {
    expect(parseGoopeUrl('https://admin.goope.jp/')).toBeUndefined()
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseGoopeUrl('not-a-url')).toBeUndefined()
  })
})

describe('goopeHandler', () => {
  describe('match', () => {
    it('should match a free site without content', () => {
      expect(goopeHandler.match('https://r.goope.jp/example')).toBe(true)
    })

    it('should match a custom domain with the marker', () => {
      expect(goopeHandler.match('https://example.com/', qrCodeHtml)).toBe(true)
    })

    it('should not match a custom domain without the marker', () => {
      expect(goopeHandler.match('https://example.com/', '<html></html>')).toBe(false)
    })

    it('should not match a Goope service host with the marker', () => {
      expect(goopeHandler.match('https://goope.jp/', qrCodeHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for the root of r.goope.jp', () => {
      expect(goopeHandler.resolve('https://r.goope.jp/')).toEqual([])
    })

    it('should return the news feed of a free site', () => {
      const value = 'https://r.goope.jp/example/info/1234567'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://r.goope.jp/example/feed.rss',
          hint: { key: 'goope:news', label: 'News', format: 'rdf' },
        },
      ]

      expect(goopeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the news feed under the template path', () => {
      const value = 'https://example.com/t_123456/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/t_123456/feed.rss',
          hint: { key: 'goope:news', label: 'News', format: 'rdf' },
        },
      ]

      expect(goopeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the member news and news feeds of a member page', () => {
      const value = 'https://r.goope.jp/example/shokokai/member/info/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://r.goope.jp/example/shokokai/member/feed.rss',
          hint: { key: 'goope:member-news', label: 'Member news', format: 'rdf' },
        },
        {
          uri: 'https://r.goope.jp/example/feed.rss',
          hint: { key: 'goope:news', label: 'News', format: 'rdf' },
        },
      ]

      expect(goopeHandler.resolve(value)).toEqual(expected)
    })
  })
})
