import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
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
        {
          uri: 'https://www.reddit.com/r/programming/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.reddit.com/r/programming/comments/.rss',
          hint: { key: 'reddit:comments', label: 'Comments' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return sorted RSS feed URL and all-comments feed when viewing sorted subreddit', () => {
      const cases: Array<[string, Array<DiscoverUriEntry>]> = [
        [
          'https://reddit.com/r/programming/hot',
          [
            {
              uri: 'https://www.reddit.com/r/programming/hot/.rss',
              hint: { key: 'reddit:posts', label: 'Posts' },
            },
            {
              uri: 'https://www.reddit.com/r/programming/comments/.rss',
              hint: { key: 'reddit:comments', label: 'Comments' },
            },
          ],
        ],
        [
          'https://reddit.com/r/programming/new',
          [
            {
              uri: 'https://www.reddit.com/r/programming/new/.rss',
              hint: { key: 'reddit:posts', label: 'Posts' },
            },
            {
              uri: 'https://www.reddit.com/r/programming/comments/.rss',
              hint: { key: 'reddit:comments', label: 'Comments' },
            },
          ],
        ],
        [
          'https://reddit.com/r/programming/rising',
          [
            {
              uri: 'https://www.reddit.com/r/programming/rising/.rss',
              hint: { key: 'reddit:posts', label: 'Posts' },
            },
            {
              uri: 'https://www.reddit.com/r/programming/comments/.rss',
              hint: { key: 'reddit:comments', label: 'Comments' },
            },
          ],
        ],
        [
          'https://reddit.com/r/programming/controversial',
          [
            {
              uri: 'https://www.reddit.com/r/programming/controversial/.rss',
              hint: { key: 'reddit:posts', label: 'Posts' },
            },
            {
              uri: 'https://www.reddit.com/r/programming/comments/.rss',
              hint: { key: 'reddit:comments', label: 'Comments' },
            },
          ],
        ],
        [
          'https://reddit.com/r/programming/top',
          [
            {
              uri: 'https://www.reddit.com/r/programming/top/.rss',
              hint: { key: 'reddit:posts', label: 'Posts' },
            },
            {
              uri: 'https://www.reddit.com/r/programming/comments/.rss',
              hint: { key: 'reddit:comments', label: 'Comments' },
            },
          ],
        ],
      ]

      for (const [value, expected] of cases) {
        expect(redditHandler.resolve(value)).toEqual(expected)
      }
    })

    it('should return base feed and all-comments feed for unknown sort options', () => {
      const value = 'https://reddit.com/r/programming/wiki'
      const expected = [
        {
          uri: 'https://www.reddit.com/r/programming/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.reddit.com/r/programming/comments/.rss',
          hint: { key: 'reddit:comments', label: 'Comments' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for post comments', () => {
      const value = 'https://reddit.com/r/AskReddit/comments/abc123/whats_your_favorite'
      const expected = [
        {
          uri: 'https://www.reddit.com/r/AskReddit/comments/abc123/.rss',
          hint: { key: 'reddit:post-comments', label: 'Post comments' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for domain tracking', () => {
      const value = 'https://reddit.com/domain/github.com'
      const expected = [
        {
          uri: 'https://www.reddit.com/domain/github.com/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for user profile', () => {
      const value = 'https://reddit.com/user/spez'
      const expected = [
        {
          uri: 'https://www.reddit.com/user/spez/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should handle u/ format for user profiles', () => {
      const value = 'https://reddit.com/u/spez'
      const expected = [
        {
          uri: 'https://www.reddit.com/user/spez/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for combined subreddits', () => {
      const value = 'https://reddit.com/r/programming+javascript'
      const expected = [
        {
          uri: 'https://www.reddit.com/r/programming+javascript/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.reddit.com/r/programming+javascript/comments/.rss',
          hint: { key: 'reddit:comments', label: 'Comments' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for multireddit', () => {
      const value = 'https://reddit.com/user/kjoneslol/m/sfwpornnetwork'
      const expected = [
        {
          uri: 'https://www.reddit.com/user/kjoneslol/m/sfwpornnetwork/.rss',
          hint: { key: 'reddit:multireddit', label: 'Multireddit' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for invalid paths', () => {
      const value = 'https://reddit.com/about'

      expect(redditHandler.resolve(value)).toEqual([])
    })

    it('should return RSS feed URL for homepage', () => {
      const value = 'https://reddit.com/'
      const expected = [
        {
          uri: 'https://www.reddit.com/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })
  })
})
