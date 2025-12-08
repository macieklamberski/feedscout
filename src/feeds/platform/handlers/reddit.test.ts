import { describe, expect, it } from 'bun:test'
import { redditHandler } from './reddit.js'

describe('redditHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://reddit.com/r/programming', true],
      ['https://www.reddit.com/r/programming', true],
      ['https://old.reddit.com/r/programming', true],
      ['https://new.reddit.com/r/programming', true],
      ['https://example.com/r/test', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(redditHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL and all-comments feed for subreddit', () => {
      const value = 'https://reddit.com/r/programming'
      const expected = [
        'https://www.reddit.com/r/programming/.rss',
        'https://www.reddit.com/r/programming/comments/.rss',
      ]

      expect(redditHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return sorted RSS feed URL and all-comments feed when viewing sorted subreddit', () => {
      const cases: Array<[string, Array<string>]> = [
        [
          'https://reddit.com/r/programming/hot',
          [
            'https://www.reddit.com/r/programming/hot/.rss',
            'https://www.reddit.com/r/programming/comments/.rss',
          ],
        ],
        [
          'https://reddit.com/r/programming/new',
          [
            'https://www.reddit.com/r/programming/new/.rss',
            'https://www.reddit.com/r/programming/comments/.rss',
          ],
        ],
        [
          'https://reddit.com/r/programming/rising',
          [
            'https://www.reddit.com/r/programming/rising/.rss',
            'https://www.reddit.com/r/programming/comments/.rss',
          ],
        ],
        [
          'https://reddit.com/r/programming/controversial',
          [
            'https://www.reddit.com/r/programming/controversial/.rss',
            'https://www.reddit.com/r/programming/comments/.rss',
          ],
        ],
        [
          'https://reddit.com/r/programming/top',
          [
            'https://www.reddit.com/r/programming/top/.rss',
            'https://www.reddit.com/r/programming/comments/.rss',
          ],
        ],
      ]

      for (const [value, expected] of cases) {
        expect(redditHandler.resolve(value, '')).toEqual(expected)
      }
    })

    it('should return base feed and all-comments feed for unknown sort options', () => {
      const value = 'https://reddit.com/r/programming/wiki'
      const expected = [
        'https://www.reddit.com/r/programming/.rss',
        'https://www.reddit.com/r/programming/comments/.rss',
      ]

      expect(redditHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return RSS feed URL for post comments', () => {
      const value = 'https://reddit.com/r/AskReddit/comments/abc123/whats_your_favorite'
      const expected = ['https://www.reddit.com/r/AskReddit/comments/abc123/.rss']

      expect(redditHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return RSS feed URL for domain tracking', () => {
      const value = 'https://reddit.com/domain/github.com'
      const expected = ['https://www.reddit.com/domain/github.com/.rss']

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

    it('should return empty array for invalid paths', () => {
      const value = 'https://reddit.com/about'
      const expected: Array<string> = []

      expect(redditHandler.resolve(value, '')).toEqual(expected)
    })
  })
})
