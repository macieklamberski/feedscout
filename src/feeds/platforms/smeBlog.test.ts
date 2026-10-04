import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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

  it('should return home for a topic page', () => {
    const expected: SmeBlogUrl = { kind: 'home' }

    expect(parseSmeBlogUrl('https://blog.sme.sk/t/politika')).toEqual(expected)
  })

  it('should return home for a site path in any case', () => {
    const expected: SmeBlogUrl = { kind: 'home' }

    expect(parseSmeBlogUrl('https://blog.sme.sk/Diskusie/5526497')).toEqual(expected)
  })

  it('should return home for the site feed path', () => {
    const expected: SmeBlogUrl = { kind: 'home' }

    expect(parseSmeBlogUrl('https://blog.sme.sk/rss')).toEqual(expected)
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
  })
})
