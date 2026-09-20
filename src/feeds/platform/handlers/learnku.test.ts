import { describe, expect, it } from 'bun:test'
import { learnkuHandler } from './learnku.js'

describe('learnkuHandler', () => {
  describe('match', () => {
    it('should match a LearnKu URL', () => {
      expect(learnkuHandler.match('https://learnku.com/laravel')).toBe(true)
      expect(learnkuHandler.match('https://learnku.com/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(learnkuHandler.match('https://example.com/laravel')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(learnkuHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the community and site feeds for a community page', () => {
      const value = 'https://learnku.com/laravel'
      const expected = [
        {
          uri: 'https://learnku.com/laravel/feed',
          hint: { key: 'learnku:community', label: 'Community' },
        },
        { uri: 'https://learnku.com/feed', hint: { key: 'learnku:site', label: 'Site' } },
      ]

      expect(learnkuHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the site feed on a reserved path', () => {
      const value = 'https://learnku.com/search'
      const expected = [
        { uri: 'https://learnku.com/feed', hint: { key: 'learnku:site', label: 'Site' } },
      ]

      expect(learnkuHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(learnkuHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
