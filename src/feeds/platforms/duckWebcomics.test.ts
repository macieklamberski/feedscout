import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import {
  type DuckWebcomicsUrl,
  duckWebcomicsHandler,
  parseDuckWebcomicsUrl,
} from './duckWebcomics.js'

describe('parseDuckWebcomicsUrl', () => {
  it('should return the comic for a comic home page', () => {
    const expected: DuckWebcomicsUrl = { kind: 'comic', comic: 'Alice_Tales' }

    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/Alice_Tales/')).toEqual(expected)
  })

  it('should return the comic for a strip page', () => {
    const expected: DuckWebcomicsUrl = { kind: 'comic', comic: 'Alice_Tales' }

    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/Alice_Tales/1234567/')).toEqual(
      expected,
    )
  })

  it('should return the comic for the bare host', () => {
    const expected: DuckWebcomicsUrl = { kind: 'comic', comic: 'Alice_Tales' }

    expect(parseDuckWebcomicsUrl('https://theduckwebcomics.com/Alice_Tales')).toEqual(expected)
  })

  it('should keep the comic case', () => {
    const expected: DuckWebcomicsUrl = { kind: 'comic', comic: 'AlIcE' }

    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/AlIcE/')).toEqual(expected)
  })

  it('should return undefined for a segment that is not a comic name', () => {
    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/favicon.ico')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseDuckWebcomicsUrl('https://www.theduckwebcomics.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseDuckWebcomicsUrl('https://example.com/Alice_Tales/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseDuckWebcomicsUrl('not-a-url')).toBeUndefined()
  })
})

describe('duckWebcomicsHandler', () => {
  describe('match', () => {
    it('should match a comic URL', () => {
      expect(duckWebcomicsHandler.match('https://www.theduckwebcomics.com/Alice_Tales/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(duckWebcomicsHandler.match('https://example.com/Alice_Tales/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the comic feed on the page origin with the comic in lowercase', () => {
      const value = 'https://theduckwebcomics.com/Alice_Tales/1234567/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://theduckwebcomics.com/alice_tales/rss/',
          hint: { key: 'duck-webcomics:comic', label: 'Comic' },
        },
      ]

      expect(duckWebcomicsHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http page', () => {
      const value = 'http://www.theduckwebcomics.com/Alice_Tales/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.theduckwebcomics.com/alice_tales/rss/',
          hint: { key: 'duck-webcomics:comic', label: 'Comic' },
        },
      ]

      expect(duckWebcomicsHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array when the URL names no comic', () => {
      expect(duckWebcomicsHandler.resolve('https://www.theduckwebcomics.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the comic hint for a comic feed', () => {
      const value = 'https://www.theduckwebcomics.com/hats/rss/'
      const expected: DiscoverUriHint = { key: 'duck-webcomics:comic', label: 'Comic' }

      expect(duckWebcomicsHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })
})
