import { describe, expect, it } from 'bun:test'
import type { TogetterUrl } from './togetter.js'
import { parseTogetterUrl, togetterHandler } from './togetter.js'

describe('parseTogetterUrl', () => {
  it('should return the user for a user page', () => {
    const expected: TogetterUrl = { kind: 'user', username: 'example' }

    expect(parseTogetterUrl('https://togetter.com/id/example')).toEqual(expected)
  })

  it('should return the user for a user page with a capitalized id segment', () => {
    const expected: TogetterUrl = { kind: 'user', username: 'example' }

    expect(parseTogetterUrl('https://togetter.com/Id/example')).toEqual(expected)
  })

  it('should return the user for the www host', () => {
    const expected: TogetterUrl = { kind: 'user', username: 'example' }

    expect(parseTogetterUrl('https://www.togetter.com/id/example')).toEqual(expected)
  })

  it('should return the home page for a summary page', () => {
    const expected: TogetterUrl = { kind: 'home' }

    expect(parseTogetterUrl('https://togetter.com/li/123456')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: TogetterUrl = { kind: 'home' }

    expect(parseTogetterUrl('https://togetter.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseTogetterUrl('https://example.com/id/example')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseTogetterUrl('not-a-url')).toBeUndefined()
  })
})

describe('togetterHandler', () => {
  describe('match', () => {
    it('should match a Togetter URL', () => {
      expect(togetterHandler.match('https://togetter.com/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(togetterHandler.match('https://example.com/id/example')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Togetter', () => {
      expect(togetterHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the curator and popular feeds for a curator page', () => {
      const value = 'https://togetter.com/id/example'
      const expected = [
        {
          uri: 'https://togetter.com/rss/id/example',
          hint: { key: 'togetter:curator', label: 'Curator' },
        },
        { uri: 'https://togetter.com/rss/hot', hint: { key: 'togetter:hot', label: 'Popular' } },
      ]

      expect(togetterHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the popular feed elsewhere', () => {
      const value = 'https://togetter.com/li/123456'
      const expected = [
        { uri: 'https://togetter.com/rss/hot', hint: { key: 'togetter:hot', label: 'Popular' } },
      ]

      expect(togetterHandler.resolve(value)).toEqual(expected)
    })
  })
})
