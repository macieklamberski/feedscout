import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseSmeBlogUrl, type SmeBlogUrl, smeBlogHandler } from './smeBlog.js'

describe('parseSmeBlogUrl', () => {
  it('should return the blog for a profile without a trailing slash', () => {
    const expected: SmeBlogUrl = { kind: 'blog', username: 'tomasvanco' }

    expect(parseSmeBlogUrl('https://blog.sme.sk/tomasvanco')).toEqual(expected)
  })

  it('should return the blog for a profile with a trailing slash', () => {
    const expected: SmeBlogUrl = { kind: 'blog', username: 'hreno' }

    expect(parseSmeBlogUrl('https://blog.sme.sk/hreno/')).toEqual(expected)
  })

  it('should return the blog for a post', () => {
    const value =
      'https://blog.sme.sk/tomasvanco/cestovanie/nove-zazitky-mestskeho-chlapca-z-rakuskeho-gazdovstva-4-4'
    const expected: SmeBlogUrl = { kind: 'blog', username: 'tomasvanco' }

    expect(parseSmeBlogUrl(value)).toEqual(expected)
  })

  it('should return home for the root', () => {
    const expected: SmeBlogUrl = { kind: 'home' }

    expect(parseSmeBlogUrl('https://blog.sme.sk/')).toEqual(expected)
  })

  it('should return undefined for the newspaper host', () => {
    expect(parseSmeBlogUrl('https://www.sme.sk/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSmeBlogUrl('https://example.com/tomasvanco')).toBeUndefined()
  })
})

describe('smeBlogHandler', () => {
  describe('match', () => {
    it('should return true for a profile', () => {
      expect(smeBlogHandler.match('https://blog.sme.sk/tomasvanco')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(smeBlogHandler.match('https://example.com/tomasvanco')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside SME Blog', () => {
      expect(smeBlogHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the posts feed for a blog', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.sme.sk/tomasvanco/rss',
          hint: { key: 'sme-blog:posts', label: 'Posts' },
        },
      ]

      expect(smeBlogHandler.resolve('https://blog.sme.sk/tomasvanco')).toEqual(expected)
    })

    it('should return the site feed for home', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.sme.sk/rss',
          hint: { key: 'sme-blog:site', label: 'Site' },
        },
      ]

      expect(smeBlogHandler.resolve('https://blog.sme.sk/')).toEqual(expected)
    })

    it('should return the https site feed for home over http', () => {
      const value = 'http://blog.sme.sk/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.sme.sk/rss',
          hint: { key: 'sme-blog:site', label: 'Site' },
        },
      ]

      expect(smeBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https posts feed for a blog over http', () => {
      const value = 'http://blog.sme.sk/alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.sme.sk/alice/rss',
          hint: { key: 'sme-blog:posts', label: 'Posts' },
        },
      ]

      expect(smeBlogHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a blog feed', () => {
      const value = 'https://blog.sme.sk/alice/rss'
      const expected: DiscoverUriHint = { key: 'sme-blog:posts', label: 'Posts' }

      expect(smeBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the site hint for the site feed', () => {
      const value = 'https://blog.sme.sk/rss'
      const expected: DiscoverUriHint = { key: 'sme-blog:site', label: 'Site' }

      expect(smeBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the site hint for the site feed with a query', () => {
      const value = 'https://blog.sme.sk/rss?vr=1'
      const expected: DiscoverUriHint = { key: 'sme-blog:site', label: 'Site' }

      expect(smeBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://blog.sme.sk/alice'

      expect(smeBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a post', () => {
      const value = 'https://blog.sme.sk/alice/politika/example-post'

      expect(smeBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/alice/rss'

      expect(smeBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const postsHint: DiscoverUriHint = { key: 'sme-blog:posts', label: 'Posts' }
    const siteHint: DiscoverUriHint = { key: 'sme-blog:site', label: 'Site' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://blog.sme.sk/alice/rss', postsHint],
      ['https://blog.sme.sk/alice/rss/', postsHint],
      ['https://blog.sme.sk/rss', siteHint],
      ['https://blog.sme.sk/rss?vr=1', siteHint],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [smeBlogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
