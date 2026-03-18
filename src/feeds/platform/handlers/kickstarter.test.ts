import { describe, expect, it } from 'bun:test'
import { kickstarterHandler } from './kickstarter.js'

describe('kickstarterHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://www.kickstarter.com/projects/creator/project', true],
      ['https://kickstarter.com/projects/creator/project', true],
      ['https://kickstarter.com/discover', true],
      ['https://kickstarter.com', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(kickstarterHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(kickstarterHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return atom feed for project page', () => {
      const value = 'https://www.kickstarter.com/projects/reinnesplace/reinnes-place'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/reinnesplace/reinnes-place/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return atom feed for project subpage', () => {
      const value = 'https://www.kickstarter.com/projects/reinnesplace/reinnes-place/description'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/reinnesplace/reinnes-place/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return global projects feed for homepage', () => {
      const value = 'https://www.kickstarter.com/'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/feed.atom',
          hint: { key: 'kickstarter:projects', label: 'Projects' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return global projects feed for discover page', () => {
      const value = 'https://www.kickstarter.com/discover'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/feed.atom',
          hint: { key: 'kickstarter:projects', label: 'Projects' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should handle URLs with query params', () => {
      const value = 'https://www.kickstarter.com/projects/creator/project?ref=discovery'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/creator/project/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should handle URLs with trailing slashes', () => {
      const value = 'https://www.kickstarter.com/projects/creator/project/'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/creator/project/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })
  })
})
