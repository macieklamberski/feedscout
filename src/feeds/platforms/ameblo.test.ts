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

  it('should return the blog of a reblog card', () => {
    const value = 'https://ameblo.jp/s/embed/reblog-card/alice/entry-12345678901.html'
    const expected: AmebloUrl = { kind: 'blog', username: 'alice' }

    expect(parseAmebloUrl(value)).toEqual(expected)
  })

  it('should return the blog of an image page', () => {
    const value = 'https://ameblo.jp/p/embed/alice/image-12345678901-12345678901.html'
    const expected: AmebloUrl = { kind: 'blog', username: 'alice' }

    expect(parseAmebloUrl(value)).toEqual(expected)
  })

  it('should return the blog of an image page with an uppercase route', () => {
    const value = 'https://ameblo.jp/P/Embed/alice/Image-12345678901-12345678901.html'
    const expected: AmebloUrl = { kind: 'blog', username: 'alice' }

    expect(parseAmebloUrl(value)).toEqual(expected)
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

    it('should return the feeds of the blog a reblog card names', () => {
      const value = 'https://ameblo.jp/s/embed/reblog-card/alice/entry-12345678901.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://rssblog.ameba.jp/alice/rss20.xml',
          hint: { key: 'ameblo:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://rssblog.ameba.jp/alice/atom.xml',
          hint: { key: 'ameblo:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://rssblog.ameba.jp/alice/rss.html',
          hint: { key: 'ameblo:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(amebloHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds for an http blog page', () => {
      const value = 'http://ameblo.jp/shibuya'
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

  describe('getFeedHint', () => {
    it('should return the posts hint for an RSS 2.0 feed', () => {
      const value = 'https://ameblo.jp/bob6262/rss20.xml'
      const expected: DiscoverUriHint = { key: 'ameblo:posts', label: 'Posts', format: 'rss' }

      expect(amebloHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return an RSS 2.0 feed on ameblo.jp as itself', async () => {
      const value = 'https://ameblo.jp/bob6262/rss20.xml'
      const options = {
        ...defaultPlatformOptions,
        handlers: [amebloHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'ameblo:posts', label: 'Posts', format: 'rss' } },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
