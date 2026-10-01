import { describe, expect, it } from 'bun:test'
import { type HearthisUrl, hearthisHandler, parseHearthisUrl } from './hearthis.js'

describe('parseHearthisUrl', () => {
  it('should return the profile for a user page', () => {
    const expected: HearthisUrl = { kind: 'profile', username: 'djname' }

    expect(parseHearthisUrl('https://hearthis.at/djname/')).toEqual(expected)
  })

  it('should return undefined for an excluded path', () => {
    expect(parseHearthisUrl('https://hearthis.at/search')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseHearthisUrl('https://hearthis.at/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseHearthisUrl('https://example.com/')).toBeUndefined()
  })
})

describe('hearthisHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://hearthis.at/james-monty-montgomery'],
      [true, 'https://www.hearthis.at/user'],
      [false, 'https://hearthis.at'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(hearthisHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(hearthisHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside hearthis.at', () => {
      expect(hearthisHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for user', () => {
      const value = 'https://hearthis.at/james-monty-montgomery'
      const expected = [
        {
          uri: 'https://hearthis.at/james-monty-montgomery/podcast/',
          hint: { key: 'hearthis:tracks', label: 'Tracks' },
        },
        {
          uri: 'https://hearthis.at/new_tracks.rss',
          hint: { key: 'hearthis:new-tracks', label: 'New tracks' },
        },
      ]

      expect(hearthisHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://hearthis.at/james-monty-montgomery/some-track'
      const expected = [
        {
          uri: 'https://hearthis.at/james-monty-montgomery/podcast/',
          hint: { key: 'hearthis:tracks', label: 'Tracks' },
        },
        {
          uri: 'https://hearthis.at/new_tracks.rss',
          hint: { key: 'hearthis:new-tracks', label: 'New tracks' },
        },
      ]

      expect(hearthisHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://hearthis.at/'

      expect(hearthisHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://hearthis.at/login'

      expect(hearthisHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for a capitalized excluded path', () => {
      const value = 'https://hearthis.at/Login'

      expect(hearthisHandler.resolve(value)).toEqual([])
    })
  })
})
