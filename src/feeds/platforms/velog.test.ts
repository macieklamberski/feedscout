import { describe, expect, it } from 'bun:test'
import type { VelogUrl } from './velog.js'
import { parseVelogUrl, velogHandler } from './velog.js'

describe('parseVelogUrl', () => {
  it('should return the username for a profile page', () => {
    const expected: VelogUrl = { kind: 'user', username: 'velopert' }

    expect(parseVelogUrl('https://velog.io/@velopert')).toEqual(expected)
  })

  it('should return the username for profile subpages', () => {
    const expected: VelogUrl = { kind: 'user', username: 'velopert' }

    expect(parseVelogUrl('https://velog.io/@velopert/posts')).toEqual(expected)
    expect(parseVelogUrl('https://velog.io/@velopert/series')).toEqual(expected)
    expect(parseVelogUrl('https://velog.io/@velopert/about')).toEqual(expected)
  })

  it('should return the username for a post page', () => {
    const value = 'https://velog.io/@velopert/some-post-slug'
    const expected: VelogUrl = { kind: 'user', username: 'velopert' }

    expect(parseVelogUrl(value)).toEqual(expected)
  })

  it('should return the username for the www host', () => {
    const expected: VelogUrl = { kind: 'user', username: 'velopert' }

    expect(parseVelogUrl('https://www.velog.io/@velopert')).toEqual(expected)
  })

  it('should decode an encoded username', () => {
    const expected: VelogUrl = { kind: 'user', username: '김' }

    expect(parseVelogUrl('https://velog.io/@%EA%B9%80')).toEqual(expected)
  })

  it('should return undefined for a malformed encoded username', () => {
    expect(parseVelogUrl('https://velog.io/@%E0%A4%A')).toBeUndefined()
  })

  it('should return undefined for paths without @ prefix', () => {
    expect(parseVelogUrl('https://velog.io/trending')).toBeUndefined()
    expect(parseVelogUrl('https://velog.io/tags/react')).toBeUndefined()
  })

  it('should return undefined for the home page', () => {
    expect(parseVelogUrl('https://velog.io/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseVelogUrl('https://example.com/@velopert')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseVelogUrl('not-a-url')).toBeUndefined()
  })
})

describe('velogHandler', () => {
  describe('match', () => {
    it('should match a velog.io URL', () => {
      expect(velogHandler.match('https://velog.io')).toBe(true)
    })

    it('should not match another host', () => {
      expect(velogHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user', () => {
      const value = 'https://velog.io/@velopert'
      const expected = [
        {
          uri: 'https://v2.velog.io/rss/velopert',
          hint: { key: 'velog:posts', label: 'Posts' },
        },
      ]

      expect(velogHandler.resolve(value)).toEqual(expected)
    })

    it('should keep an encoded username encoded', () => {
      const value = 'https://velog.io/@%EA%B9%80'
      const expected = [
        {
          uri: 'https://v2.velog.io/rss/%EA%B9%80',
          hint: { key: 'velog:posts', label: 'Posts' },
        },
      ]

      expect(velogHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for root path', () => {
      const value = 'https://velog.io/'
      const expected = [
        {
          uri: 'https://v2.velog.io/rss',
          hint: { key: 'velog:trending', label: 'Trending' },
        },
      ]

      expect(velogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for paths without @ prefix', () => {
      expect(velogHandler.resolve('https://velog.io/trending')).toEqual([])
    })
  })
})
