import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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
    const value = 'https://r.goope.jp/example/info/1234567'
    const expected: GoopeUrl = { kind: 'freeSite', site: 'example', isMemberPage: false }

    expect(parseGoopeUrl(value)).toEqual(expected)
  })

  it('should return the template path for a free site', () => {
    const value = 'https://r.goope.jp/example/t_123456/menu'
    const expected: GoopeUrl = {
      kind: 'freeSite',
      site: 'example',
      templateId: '123456',
      isMemberPage: false,
    }

    expect(parseGoopeUrl(value)).toEqual(expected)
  })

  it('should return the member page of a free site', () => {
    const value = 'https://r.goope.jp/example/shokokai/member/info/'
    const expected: GoopeUrl = { kind: 'freeSite', site: 'example', isMemberPage: true }

    expect(parseGoopeUrl(value)).toEqual(expected)
  })

  it('should return the site for a custom domain', () => {
    const value = 'https://example.com/info/1234567'
    const expected: GoopeUrl = { kind: 'site', isMemberPage: false }

    expect(parseGoopeUrl(value)).toEqual(expected)
  })

  it('should return the template path for a custom domain', () => {
    const value = 'https://example.com/t_123456'
    const expected: GoopeUrl = { kind: 'site', templateId: '123456', isMemberPage: false }

    expect(parseGoopeUrl(value)).toEqual(expected)
  })

  it('should return the member page of a custom domain', () => {
    const value = 'https://example.com/shokokai/member/2/'
    const expected: GoopeUrl = { kind: 'site', isMemberPage: true }

    expect(parseGoopeUrl(value)).toEqual(expected)
  })

  it('should return the site for a shokokai page outside the members', () => {
    const value = 'https://example.com/shokokai/'
    const expected: GoopeUrl = { kind: 'site', isMemberPage: false }

    expect(parseGoopeUrl(value)).toEqual(expected)
  })

  it('should return undefined for the root of r.goope.jp', () => {
    expect(parseGoopeUrl('https://r.goope.jp/')).toBeUndefined()
  })

  it('should return undefined for another goope.jp host', () => {
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

    it('should not match the apex with the marker', () => {
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

    it('should return the https news feed of a free site opened over http', () => {
      const value = 'http://r.goope.jp/example/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://r.goope.jp/example/feed.rss',
          hint: { key: 'goope:news', label: 'News', format: 'rdf' },
        },
      ]

      expect(goopeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the news feed under the template path of a free site', () => {
      const value = 'https://r.goope.jp/example/t_123456/menu'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://r.goope.jp/example/t_123456/feed.rss',
          hint: { key: 'goope:news', label: 'News', format: 'rdf' },
        },
      ]

      expect(goopeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the news feed of a custom domain opened over http', () => {
      const value = 'http://example.com/info/1234567'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.com/feed.rss',
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

    it('should return the member news feed under the template path of a custom domain', () => {
      const value = 'https://example.com/t_123456/shokokai/member/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/t_123456/shokokai/member/feed.rss',
          hint: { key: 'goope:member-news', label: 'Member news', format: 'rdf' },
        },
        {
          uri: 'https://example.com/t_123456/feed.rss',
          hint: { key: 'goope:news', label: 'News', format: 'rdf' },
        },
      ]

      expect(goopeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the news key for the news feed of a free site', () => {
      const value = 'https://r.goope.jp/example/feed.rss'
      const expected: DiscoverUriHint = { key: 'goope:news', label: 'News', format: 'rdf' }

      expect(goopeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the news key for the news feed over http', () => {
      const value = 'http://r.goope.jp/example/feed.rss'
      const expected: DiscoverUriHint = { key: 'goope:news', label: 'News', format: 'rdf' }

      expect(goopeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the news key for the news feed under a template path', () => {
      const value = 'https://r.goope.jp/example/t_123456/feed.rss'
      const expected: DiscoverUriHint = { key: 'goope:news', label: 'News', format: 'rdf' }

      expect(goopeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the member news key for the member news feed', () => {
      const value = 'https://r.goope.jp/example/shokokai/member/feed.rss'
      const expected: DiscoverUriHint = {
        key: 'goope:member-news',
        label: 'Member news',
        format: 'rdf',
      }

      expect(goopeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the member news key for the member news feed under a template path', () => {
      const value = 'https://r.goope.jp/example/t_123456/shokokai/member/feed.rss'
      const expected: DiscoverUriHint = {
        key: 'goope:member-news',
        label: 'Member news',
        format: 'rdf',
      }

      expect(goopeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a page of a free site', () => {
      const value = 'https://r.goope.jp/example/info/1234567'

      expect(goopeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a member news path with no site in front', () => {
      const value = 'https://r.goope.jp/shokokai/member/feed.rss'

      expect(goopeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the news feed of a custom domain', () => {
      const value = 'https://example.com/feed.rss'

      expect(goopeHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const newsHint: DiscoverUriHint = { key: 'goope:news', label: 'News', format: 'rdf' }
    const memberNewsHint: DiscoverUriHint = {
      key: 'goope:member-news',
      label: 'Member news',
      format: 'rdf',
    }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://r.goope.jp/example/feed.rss/', newsHint],
      ['https://r.goope.jp/example/t_123456/feed.rss/', newsHint],
      ['https://r.goope.jp/example/shokokai/member/feed.rss', memberNewsHint],
      ['https://r.goope.jp/example/t_123456/shokokai/member/feed.rss', memberNewsHint],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [goopeHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
