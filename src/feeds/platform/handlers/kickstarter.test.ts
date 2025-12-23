import { describe, expect, it } from 'bun:test'
import { kickstarterHandler } from './kickstarter.js'

describe('kickstarterHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://www.kickstarter.com/projects/creator/project', true],
      ['https://kickstarter.com/projects/creator/project', true],
      ['https://kickstarter.com/discover', false],
      ['https://kickstarter.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(kickstarterHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return atom feed for project page', () => {
      const value = 'https://www.kickstarter.com/projects/reinnesplace/reinnes-place'
      const expected = [
        'https://www.kickstarter.com/projects/reinnesplace/reinnes-place/posts.atom',
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return atom feed for project subpage', () => {
      const value = 'https://www.kickstarter.com/projects/reinnesplace/reinnes-place/description'
      const expected = [
        'https://www.kickstarter.com/projects/reinnesplace/reinnes-place/posts.atom',
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-project pages', () => {
      expect(kickstarterHandler.resolve('https://www.kickstarter.com/discover')).toEqual([])
    })

    it('should handle URLs with query params', () => {
      const value = 'https://www.kickstarter.com/projects/creator/project?ref=discovery'
      const expected = ['https://www.kickstarter.com/projects/creator/project/posts.atom']

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should handle URLs with trailing slashes', () => {
      const value = 'https://www.kickstarter.com/projects/creator/project/'
      const expected = ['https://www.kickstarter.com/projects/creator/project/posts.atom']

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })
  })
})
