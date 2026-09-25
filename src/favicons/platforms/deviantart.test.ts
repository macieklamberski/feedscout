import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { deviantartHandler } from './deviantart.js'

describe('deviantartHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(deviantartHandler.match('https://www.deviantart.com/artistname')).toBe(true)
    })

    it('should not match tag pages', () => {
      expect(deviantartHandler.match('https://www.deviantart.com/tag/photography')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve user avatar with 3 URI alternatives', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.jpg' },
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.gif' },
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.png' },
      ]

      expect(deviantartHandler.resolve('https://www.deviantart.com/artistname')).toEqual(expected)
    })

    it('should normalize username to lowercase', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.jpg' },
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.gif' },
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.png' },
      ]

      expect(deviantartHandler.resolve('https://www.deviantart.com/ArtistName')).toEqual(expected)
    })

    it('should return empty array for single-char username', () => {
      expect(deviantartHandler.resolve('https://www.deviantart.com/x')).toEqual([])
    })
  })
})
