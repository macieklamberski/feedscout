import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { AmebloUrl } from './ameblo.js'
import { amebloHandler, parseAmebloUrl } from './ameblo.js'

describe('parseAmebloUrl', () => {
  it('should return the username for a blog home page', () => {
    const expected: AmebloUrl = { kind: 'blog', username: 'shibuya' }

    expect(parseAmebloUrl('https://ameblo.jp/shibuya')).toEqual(expected)
  })

  it('should return the username for a blog entry page', () => {
    const expected: AmebloUrl = { kind: 'blog', username: 'shibuya' }

    expect(parseAmebloUrl('https://ameblo.jp/shibuya/entry-12345678901.html')).toEqual(expected)
  })

  it('should return the username for the www host', () => {
    const expected: AmebloUrl = { kind: 'blog', username: 'shibuya' }

    expect(parseAmebloUrl('https://www.ameblo.jp/shibuya')).toEqual(expected)
  })

  it('should keep the username case', () => {
    const expected: AmebloUrl = { kind: 'blog', username: 'Shibuya' }

    expect(parseAmebloUrl('https://ameblo.jp/Shibuya')).toEqual(expected)
  })

  it('should return undefined for the homepage', () => {
    expect(parseAmebloUrl('https://ameblo.jp')).toBeUndefined()
    expect(parseAmebloUrl('https://ameblo.jp/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseAmebloUrl('https://example.com/shibuya/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseAmebloUrl('not-a-url')).toBeUndefined()
  })
})

describe('amebloHandler', () => {
  describe('match', () => {
    it('should match a blog URL', () => {
      expect(amebloHandler.match('https://ameblo.jp/shibuya')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(amebloHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS 2.0, Atom, and RDF feeds for blog', () => {
      const value = 'https://ameblo.jp/shibuya'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://rssblog.ameba.jp/shibuya/rss20.xml',
          hint: { key: 'ameblo:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://rssblog.ameba.jp/shibuya/atom.xml',
          hint: { key: 'ameblo:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://rssblog.ameba.jp/shibuya/rss.html',
          hint: { key: 'ameblo:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(amebloHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array when the URL names no blog', () => {
      expect(amebloHandler.resolve('https://ameblo.jp/')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for an RSS 2.0 feed', () => {
      const value = 'https://ameblo.jp/6262sm/rss20.xml'
      const expected = 'ameblo:posts'

      expect(amebloHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an Atom feed', () => {
      const value = 'https://ameblo.jp/a-retro/atom.xml'
      const expected = 'ameblo:posts'

      expect(amebloHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an RDF feed on rssblog.ameba.jp', () => {
      const value = 'https://rssblog.ameba.jp/6262sm/rss.html'
      const expected = 'ameblo:posts'

      expect(amebloHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an RDF feed over http', () => {
      const value = 'http://rssblog.ameba.jp/a-retro/rss.html'
      const expected = 'ameblo:posts'

      expect(amebloHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an RSS 2.0 feed on rssblog.ameba.jp', () => {
      const value = 'https://rssblog.ameba.jp/6262sm/rss20.xml'
      const expected = 'ameblo:posts'

      expect(amebloHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an Atom feed on rssblog.ameba.jp', () => {
      const value = 'https://rssblog.ameba.jp/6262sm/atom.xml'
      const expected = 'ameblo:posts'

      expect(amebloHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a feed on the www host', () => {
      const value = 'https://www.ameblo.jp/6262sm/rss20.xml'
      const expected = 'ameblo:posts'

      expect(amebloHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://ameblo.jp/6262sm/entry-12345678901.html'

      expect(amebloHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a page on rssblog.ameba.jp', () => {
      const value = 'https://rssblog.ameba.jp/6262sm/'

      expect(amebloHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/6262sm/rss.html'

      expect(amebloHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://ameblo.jp/6262sm/rss20.xml', { key: 'ameblo:posts', label: 'Posts' }],
      ['https://ameblo.jp/a-retro/atom.xml', { key: 'ameblo:posts', label: 'Posts' }],
      ['https://rssblog.ameba.jp/6262sm/rss.html', { key: 'ameblo:posts', label: 'Posts' }],
      ['https://rssblog.ameba.jp/a-retro/rss.html', { key: 'ameblo:posts', label: 'Posts' }],
      ['https://rssblog.ameba.jp/6262sm/rss20.xml', { key: 'ameblo:posts', label: 'Posts' }],
      ['https://rssblog.ameba.jp/6262sm/atom.xml', { key: 'ameblo:posts', label: 'Posts' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [amebloHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
