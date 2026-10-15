import { describe, expect, it } from 'bun:test'
import { type PodbeanUrl, parsePodbeanUrl, podbeanHandler } from './podbean.js'

describe('parsePodbeanUrl', () => {
  it('should return the podcast for a show subdomain', () => {
    const expected: PodbeanUrl = { kind: 'podcast', show: 'example' }

    expect(parsePodbeanUrl('https://example.podbean.com/')).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parsePodbeanUrl('https://www.podbean.com/')).toBeUndefined()
  })

  it('should return undefined for the feed host', () => {
    expect(parsePodbeanUrl('https://feed.podbean.com/myshow/feed.xml')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parsePodbeanUrl('https://www.example.podbean.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePodbeanUrl('https://example.com/')).toBeUndefined()
  })
})

describe('podbeanHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.podbean.com'],
      [false, 'https://blog.example.podbean.com'],
      [false, 'https://podbean.com'],
      [false, 'https://example.com'],
      [false, 'https://www.podbean.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(podbeanHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(podbeanHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for podcast', () => {
      const value = 'https://alice.podbean.com'
      const expected = [
        {
          uri: 'https://feed.podbean.com/alice/feed.xml',
          hint: { key: 'podbean:podcast', label: 'Podcast' },
        },
      ]

      expect(podbeanHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.podbean.com/e/some-episode'
      const expected = [
        {
          uri: 'https://feed.podbean.com/alice/feed.xml',
          hint: { key: 'podbean:podcast', label: 'Podcast' },
        },
      ]

      expect(podbeanHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(podbeanHandler.resolve('https://podbean.com/')).toEqual([])
    })
  })
})
