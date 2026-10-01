import { describe, expect, it } from 'bun:test'
import { type LearnkuUrl, learnkuHandler, parseLearnkuUrl } from './learnku.js'

describe('parseLearnkuUrl', () => {
  it('should return the community for a community page', () => {
    const expected: LearnkuUrl = { kind: 'community', community: 'laravel' }

    expect(parseLearnkuUrl('https://learnku.com/laravel')).toEqual(expected)
  })

  it('should return the home page for an excluded path', () => {
    const expected: LearnkuUrl = { kind: 'home' }

    expect(parseLearnkuUrl('https://learnku.com/search')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: LearnkuUrl = { kind: 'home' }

    expect(parseLearnkuUrl('https://learnku.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseLearnkuUrl('https://example.com/')).toBeUndefined()
  })
})

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
    it('should return empty array for a URL outside LearnKu', () => {
      expect(learnkuHandler.resolve('https://example.com/')).toEqual([])
    })

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

    it('should return only the site feed on a capitalized reserved path', () => {
      const value = 'https://learnku.com/Search'
      const expected = [
        { uri: 'https://learnku.com/feed', hint: { key: 'learnku:site', label: 'Site' } },
      ]

      expect(learnkuHandler.resolve(value)).toEqual(expected)
    })
  })
})
