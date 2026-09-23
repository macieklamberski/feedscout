import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { deviantartHandler } from './deviantart.js'

describe('deviantartHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(deviantartHandler.match('https://www.deviantart.com/artistname')).toBe(true)
    })

    it('should match gallery URLs', () => {
      expect(deviantartHandler.match('https://www.deviantart.com/artistname/gallery')).toBe(true)
    })

    it('should match gallery/all URLs', () => {
      expect(deviantartHandler.match('https://www.deviantart.com/artistname/gallery/all')).toBe(
        true,
      )
    })

    it('should match favourites URLs', () => {
      expect(deviantartHandler.match('https://www.deviantart.com/artistname/favourites')).toBe(true)
    })

    it('should match single-char username URLs even though resolve returns no avatars', () => {
      expect(deviantartHandler.match('https://www.deviantart.com/x')).toBe(true)
    })

    it('should not match tag pages', () => {
      expect(deviantartHandler.match('https://www.deviantart.com/tag/photography')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(deviantartHandler.match('https://www.deviantart.com/about')).toBe(false)
      expect(deviantartHandler.match('https://www.deviantart.com/join')).toBe(false)
      expect(deviantartHandler.match('https://www.deviantart.com/search')).toBe(false)
    })

    it('should not match root URL', () => {
      expect(deviantartHandler.match('https://www.deviantart.com')).toBe(false)
      expect(deviantartHandler.match('https://www.deviantart.com/')).toBe(false)
    })

    it('should not match non-deviantart URLs', () => {
      expect(deviantartHandler.match('https://example.com/artistname')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(deviantartHandler.match('not-a-url')).toBe(false)
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

    it('should resolve user avatar from gallery URL', () => {
      const value = 'https://www.deviantart.com/artistname/gallery/all'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.jpg' },
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.gif' },
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.png' },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should normalize username to lowercase', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.jpg' },
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.gif' },
        { uri: 'https://a.deviantart.net/avatars-big/a/r/artistname.png' },
      ]

      expect(deviantartHandler.resolve('https://www.deviantart.com/ArtistName')).toEqual(expected)
    })

    it('should return empty array for tag pages', () => {
      expect(deviantartHandler.resolve('https://www.deviantart.com/tag/photography')).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      expect(deviantartHandler.resolve('https://www.deviantart.com/about')).toEqual([])
      expect(deviantartHandler.resolve('https://www.deviantart.com/search')).toEqual([])
    })

    it('should return empty array for root URL', () => {
      expect(deviantartHandler.resolve('https://www.deviantart.com/')).toEqual([])
    })

    it('should return empty array for single-char username', () => {
      expect(deviantartHandler.resolve('https://www.deviantart.com/x')).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
