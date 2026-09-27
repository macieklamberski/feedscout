import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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

  it('should return undefined for excluded paths', () => {
    expect(parseAmebloUrl('https://ameblo.jp/genre/')).toBeUndefined()
    expect(parseAmebloUrl('https://ameblo.jp/hashtag/')).toBeUndefined()
    expect(parseAmebloUrl('https://ameblo.jp/search')).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseAmebloUrl('https://ameblo.jp/Search')).toBeUndefined()
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
    it('should match any Ameblo URL', () => {
      expect(amebloHandler.match('https://ameblo.jp')).toBe(true)
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
          uri: 'https://ameblo.jp/shibuya/rss20.xml',
          hint: { key: 'ameblo:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://ameblo.jp/shibuya/atom.xml',
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
})
