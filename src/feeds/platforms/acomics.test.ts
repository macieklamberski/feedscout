import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type AcomicsUrl, acomicsHandler, parseAcomicsUrl } from './acomics.js'

describe('parseAcomicsUrl', () => {
  it('should return the comic for a comic page', () => {
    const expected: AcomicsUrl = { kind: 'comic', comic: 'Bobcomic' }

    expect(parseAcomicsUrl('https://acomics.ru/~Bobcomic')).toEqual(expected)
  })

  it('should return the comic for an issue page', () => {
    const expected: AcomicsUrl = { kind: 'comic', comic: 'carolcomic' }

    expect(parseAcomicsUrl('https://acomics.ru/~carolcomic/819')).toEqual(expected)
  })

  it('should return the user for a profile page', () => {
    const expected: AcomicsUrl = { kind: 'user', username: 'Alicecomic' }

    expect(parseAcomicsUrl('https://acomics.ru/-Alicecomic')).toEqual(expected)
  })

  it('should return the user for a subscriptions page', () => {
    const expected: AcomicsUrl = { kind: 'user', username: 'Alicecomic' }

    expect(parseAcomicsUrl('https://acomics.ru/-Alicecomic/list2')).toEqual(expected)
  })

  it('should return the comic on the www host', () => {
    const expected: AcomicsUrl = { kind: 'comic', comic: 'Bobcomic' }

    expect(parseAcomicsUrl('https://www.acomics.ru/~Bobcomic')).toEqual(expected)
  })

  it('should return undefined for a bare prefix', () => {
    expect(parseAcomicsUrl('https://acomics.ru/~')).toBeUndefined()
  })

  it('should return undefined for a site page', () => {
    expect(parseAcomicsUrl('https://acomics.ru/comics')).toBeUndefined()
  })

  it('should return undefined for the home page', () => {
    expect(parseAcomicsUrl('https://acomics.ru/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseAcomicsUrl('https://example.com/~Bobcomic')).toBeUndefined()
  })
})

describe('acomicsHandler', () => {
  describe('match', () => {
    it('should return true for a comic page', () => {
      expect(acomicsHandler.match('https://acomics.ru/~Bobcomic')).toBe(true)
    })

    it('should return false for the home page', () => {
      expect(acomicsHandler.match('https://acomics.ru/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Acomics', () => {
      expect(acomicsHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the issues feed for a comic', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://acomics.ru/~Bobcomic/rss',
          hint: { key: 'acomics:issues', label: 'Issues' },
        },
      ]

      expect(acomicsHandler.resolve('https://www.acomics.ru/~Bobcomic/902')).toEqual(expected)
    })

    it('should return the subscriptions feed for a user', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://acomics.ru/-Alicecomic/rss',
          hint: { key: 'acomics:subscriptions', label: 'Subscriptions' },
        },
      ]

      expect(acomicsHandler.resolve('https://acomics.ru/-Alicecomic')).toEqual(expected)
    })
  })
})
