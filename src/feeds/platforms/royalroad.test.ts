import { describe, expect, it } from 'bun:test'
import { royalroadHandler } from './royalroad.js'

describe('royalroadHandler', () => {
  describe('match', () => {
    it('should match a fiction page', () => {
      const value = 'https://www.royalroad.com/fiction/21220/mother-of-learning'

      expect(royalroadHandler.match(value)).toBe(true)
    })

    it('should match a chapter page', () => {
      const value =
        'https://www.royalroad.com/fiction/21220/mother-of-learning/chapter/301778/1-good-morning-brother'

      expect(royalroadHandler.match(value)).toBe(true)
    })

    it('should match a fiction page without the slug', () => {
      expect(royalroadHandler.match('https://www.royalroad.com/fiction/21220')).toBe(true)
    })

    it('should match the bare host', () => {
      expect(royalroadHandler.match('https://royalroad.com/fiction/21220')).toBe(true)
    })

    it('should match route words in any case', () => {
      expect(royalroadHandler.match('https://www.royalroad.com/Fiction/21220')).toBe(true)
    })

    it('should not match a profile page', () => {
      expect(royalroadHandler.match('https://www.royalroad.com/profile/100374')).toBe(false)
    })

    it('should not match a fiction list', () => {
      const value = 'https://www.royalroad.com/fictions/latest-updates'

      expect(royalroadHandler.match(value)).toBe(false)
    })

    it('should not match another host', () => {
      expect(royalroadHandler.match('https://example.com/fiction/21220')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the fiction feed for a chapter page', () => {
      const value =
        'https://www.royalroad.com/fiction/21220/mother-of-learning/chapter/301778/1-good-morning-brother'
      const expected = [
        {
          uri: 'https://www.royalroad.com/syndication/21220',
          hint: { key: 'royalroad:fiction', label: 'Fiction' },
        },
      ]

      expect(royalroadHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array without a fiction id', () => {
      expect(royalroadHandler.resolve('https://www.royalroad.com/profile/100374')).toEqual([])
    })
  })
})
