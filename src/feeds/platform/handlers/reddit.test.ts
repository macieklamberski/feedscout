import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../../common/types.js'
import { redditHandler } from './reddit.js'

const createMockFetch = (body = ''): DiscoverFetchFn => {
  return async () => ({ body, headers: new Headers(), url: '', status: 200, statusText: 'OK' })
}

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
    it('should return RSS feed URL for subreddit', async () => {
      const value = await redditHandler.resolve(
        'https://reddit.com/r/programming',
        createMockFetch(),
      )

      expect(value).toEqual(['https://www.reddit.com/r/programming/.rss'])
    })

    it('should return RSS feed URL for user profile', async () => {
      const value = await redditHandler.resolve('https://reddit.com/user/spez', createMockFetch())

      expect(value).toEqual(['https://www.reddit.com/user/spez/.rss'])
    })

    it('should handle u/ format for user profiles', async () => {
      const value = await redditHandler.resolve('https://reddit.com/u/spez', createMockFetch())

      expect(value).toEqual(['https://www.reddit.com/user/spez/.rss'])
    })

    it('should handle subreddit paths with trailing content', async () => {
      const value = await redditHandler.resolve(
        'https://reddit.com/r/programming/hot',
        createMockFetch(),
      )

      expect(value).toEqual(['https://www.reddit.com/r/programming/.rss'])
    })

    it('should return empty array for invalid paths', async () => {
      const value = await redditHandler.resolve('https://reddit.com/about', createMockFetch())

      expect(value).toEqual([])
    })
  })
})
