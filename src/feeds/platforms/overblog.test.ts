import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type OverblogUrl, overblogHandler, parseOverblogUrl } from './overblog.js'

describe('parseOverblogUrl', () => {
  const blogUrls: Array<string> = [
    'https://alice.over-blog.com/',
    'https://alice.over-blog.com/2014/02/meuble-cuisine.html',
    'https://alice.over-blog.ch/',
    'https://alice.over-blog.de/',
    'https://alice.over-blog.es/',
    'https://alice.over-blog.fr/',
    'https://alice.over-blog.info/',
    'https://alice.over-blog.it/',
    'https://alice.over-blog.net/',
    'https://alice.over-blog.org/',
    'https://alice.over.blog/',
    'https://alice.overblog.com/',
    'https://alice.overblog.fr/',
    'https://admin.over-blog.fr/',
  ]

  it.each(blogUrls)('should return the blog for %s', (url) => {
    const expected: OverblogUrl = { kind: 'blog' }

    expect(parseOverblogUrl(url)).toEqual(expected)
  })

  const otherUrls: Array<string> = [
    'https://over-blog.com/',
    'https://www.over-blog.com/',
    'https://www.over-blog.fr/',
    'https://www.alice.over-blog.com/',
    'https://alice.kazeo.com/',
    'https://alice.eklablog.com/',
    'https://example.com/',
  ]

  it.each(otherUrls)('should return undefined for %s', (url) => {
    expect(parseOverblogUrl(url)).toBeUndefined()
  })
})

describe('overblogHandler', () => {
  describe('match', () => {
    it('should return true for a blog', () => {
      expect(overblogHandler.match('https://alice.over-blog.com/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(overblogHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Overblog', () => {
      expect(overblogHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return posts feed for blog', () => {
      const value = 'https://alice.over-blog.com/2014/02/meuble-cuisine.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.over-blog.com/rss',
          hint: { key: 'overblog:posts', label: 'Posts' },
        },
      ]

      expect(overblogHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of the blog', () => {
      const value = 'http://alice.over-blog.fr/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.over-blog.fr/rss',
          hint: { key: 'overblog:posts', label: 'Posts' },
        },
      ]

      expect(overblogHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a feed on over.blog', () => {
      const value = 'https://alice.over.blog/rss'
      const expected: DiscoverUriHint = { key: 'overblog:posts', label: 'Posts' }

      expect(overblogHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return an http posts feed on a country domain as itself', async () => {
      const value = 'http://alice.over-blog.fr/rss'
      const options = {
        ...defaultPlatformOptions,
        handlers: [overblogHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: {
            key: 'overblog:posts',
            label: 'Posts',
          },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
