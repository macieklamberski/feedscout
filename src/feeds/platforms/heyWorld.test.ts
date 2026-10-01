import { describe, expect, it } from 'bun:test'
import { type HeyWorldUrl, heyWorldHandler, parseHeyWorldUrl } from './heyWorld.js'

describe('parseHeyWorldUrl', () => {
  it('should return the blog for a user page', () => {
    const expected: HeyWorldUrl = { kind: 'blog', username: 'jason' }

    expect(parseHeyWorldUrl('https://world.hey.com/jason')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseHeyWorldUrl('https://world.hey.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseHeyWorldUrl('https://example.com/')).toBeUndefined()
  })
})

describe('heyWorldHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://world.hey.com/dhh'],
      [false, 'https://world.hey.com'],
      [false, 'https://hey.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(heyWorldHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(heyWorldHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside HEY World', () => {
      expect(heyWorldHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://world.hey.com/dhh'
      const expected = [
        {
          uri: 'https://world.hey.com/dhh/feed.atom',
          hint: { key: 'hey-world:blog', label: 'Blog' },
        },
      ]

      expect(heyWorldHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://world.hey.com/dhh/some-post-title'
      const expected = [
        {
          uri: 'https://world.hey.com/dhh/feed.atom',
          hint: { key: 'hey-world:blog', label: 'Blog' },
        },
      ]

      expect(heyWorldHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://world.hey.com/'

      expect(heyWorldHandler.resolve(value)).toEqual([])
    })
  })
})
