import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  type DuckWebcomicsUrl,
  duckWebcomicsHandler,
  parseDuckWebcomicsUrl,
} from './duckWebcomics.js'

describe('parseDuckWebcomicsUrl', () => {
  it('should return the comic for a comic home page', () => {
    const expected: DuckWebcomicsUrl = { kind: 'comic', comic: 'Quack_Tales' }

    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/Quack_Tales/')).toEqual(expected)
  })

  it('should return the comic for a strip page', () => {
    const expected: DuckWebcomicsUrl = { kind: 'comic', comic: 'Quack_Tales' }

    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/Quack_Tales/1234567/')).toEqual(
      expected,
    )
  })

  it('should return the comic for the bare host', () => {
    const expected: DuckWebcomicsUrl = { kind: 'comic', comic: 'Quack_Tales' }

    expect(parseDuckWebcomicsUrl('https://theduckwebcomics.com/Quack_Tales')).toEqual(expected)
  })

  it('should keep the comic case', () => {
    const expected: DuckWebcomicsUrl = { kind: 'comic', comic: 'QuAcK' }

    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/QuAcK/')).toEqual(expected)
  })

  it('should return undefined for excluded paths', () => {
    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/user/alice/')).toBeUndefined()
    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/news/')).toBeUndefined()
    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/forum/')).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/Search/')).toBeUndefined()
  })

  it('should return undefined for a segment that is not a comic name', () => {
    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/favicon.ico')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseDuckWebcomicsUrl('https://example.com/Quack_Tales/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseDuckWebcomicsUrl('not-a-url')).toBeUndefined()
  })
})

describe('duckWebcomicsHandler', () => {
  describe('match', () => {
    it('should match a comic URL', () => {
      expect(duckWebcomicsHandler.match('https://www.theduckwebcomics.com/Quack_Tales/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(duckWebcomicsHandler.match('https://example.com/Quack_Tales/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the comic feed on the page origin', () => {
      const value = 'https://theduckwebcomics.com/Quack_Tales/1234567/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://theduckwebcomics.com/Quack_Tales/rss/',
          hint: { key: 'duck-webcomics:comic', label: 'Comic' },
        },
      ]

      expect(duckWebcomicsHandler.resolve(value)).toEqual(expected)
    })

    it('should spell the comic as the page links its feed', () => {
      const value = 'https://www.theduckwebcomics.com/quack_tales/'
      const content = '<a href="/Other_Comic/rss/">rss</a><a href="/Quack_Tales/rss/">rss</a>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.theduckwebcomics.com/Quack_Tales/rss/',
          hint: { key: 'duck-webcomics:comic', label: 'Comic' },
        },
      ]

      expect(duckWebcomicsHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array when the URL names no comic', () => {
      expect(duckWebcomicsHandler.resolve('https://www.theduckwebcomics.com/')).toEqual([])
    })
  })

  describe('guessExclusionRegex', () => {
    it('should match a guessed comic feed in another case', () => {
      expect(
        duckWebcomicsHandler.guessExclusionRegex?.test('https://www.theduckwebcomics.com/hats/rss'),
      ).toBe(true)
    })

    it('should not match a strip page', () => {
      expect(
        duckWebcomicsHandler.guessExclusionRegex?.test(
          'https://www.theduckwebcomics.com/HaTs/4960244/',
        ),
      ).toBe(false)
    })
  })
})
