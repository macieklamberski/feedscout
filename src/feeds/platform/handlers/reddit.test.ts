import { describe, expect, it } from 'bun:test'
import { redditHandler } from './reddit.js'

describe('redditHandler', () => {
  describe('match', () => {
    it.each([
      ['https://reddit.com/r/programming', true],
      ['https://www.reddit.com/r/programming', true],
      ['https://old.reddit.com/r/programming', true],
      ['https://example.com/r/test', false],
    ])('%s -> %s', (url, expected) => {
      expect(redditHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for subreddit', () => {
      const value = redditHandler.resolve('https://reddit.com/r/programming', '')

      expect(value).toEqual(['https://www.reddit.com/r/programming/.rss'])
    })

    it('should return RSS feed URL for user profile', () => {
      const value = redditHandler.resolve('https://reddit.com/user/spez', '')

      expect(value).toEqual(['https://www.reddit.com/user/spez/.rss'])
    })

    it('should handle u/ format for user profiles', () => {
      const value = redditHandler.resolve('https://reddit.com/u/spez', '')

      expect(value).toEqual(['https://www.reddit.com/user/spez/.rss'])
    })

    it('should handle subreddit paths with trailing content', () => {
      const value = redditHandler.resolve('https://reddit.com/r/programming/hot', '')

      expect(value).toEqual(['https://www.reddit.com/r/programming/.rss'])
    })

    it('should return empty array for invalid paths', () => {
      const value = redditHandler.resolve('https://reddit.com/about', '')

      expect(value).toEqual([])
    })
  })
})
