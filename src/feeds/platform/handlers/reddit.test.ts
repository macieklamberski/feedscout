import { describe, expect, it } from 'bun:test'
import { redditHandler } from './reddit.js'

describe('redditHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://reddit.com/r/programming', true],
      ['https://www.reddit.com/r/programming', true],
      ['https://old.reddit.com/r/programming', true],
      ['https://example.com/r/test', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(redditHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for subreddit', () => {
      const value = 'https://reddit.com/r/programming'
      const expected = ['https://www.reddit.com/r/programming/.rss']

      expect(redditHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return RSS feed URL for user profile', () => {
      const value = 'https://reddit.com/user/spez'
      const expected = ['https://www.reddit.com/user/spez/.rss']

      expect(redditHandler.resolve(value, '')).toEqual(expected)
    })

    it('should handle u/ format for user profiles', () => {
      const value = 'https://reddit.com/u/spez'
      const expected = ['https://www.reddit.com/user/spez/.rss']

      expect(redditHandler.resolve(value, '')).toEqual(expected)
    })

    it('should handle subreddit paths with trailing content', () => {
      const value = 'https://reddit.com/r/programming/hot'
      const expected = ['https://www.reddit.com/r/programming/.rss']

      expect(redditHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return empty array for invalid paths', () => {
      const value = 'https://reddit.com/about'
      const expected: Array<string> = []

      expect(redditHandler.resolve(value, '')).toEqual(expected)
    })
  })
})
