import { describe, expect, it } from 'bun:test'
import { hearthisHandler } from './hearthis.js'

describe('hearthisHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://hearthis.at/james-monty-montgomery'],
      [true, 'https://www.hearthis.at/user'],
      [true, 'https://hearthis.at'],
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
