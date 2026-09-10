import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { redditHandler } from './reddit.js'

describe('redditHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://reddit.com/r/programming'],
      [true, 'https://www.reddit.com/r/programming'],
      [true, 'https://old.reddit.com/r/programming'],
      [true, 'https://new.reddit.com/r/programming'],
      [false, 'https://example.com/r/test'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(redditHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(redditHandler.match('not-a-url')).toBe(false)
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

    const sortedValues: Array<[string, Array<DiscoverUriEntry>]> = [
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
      [
        'https://reddit.com/r/programming/best',
        [
          {
            uri: 'https://www.reddit.com/r/programming/best/.rss',
            hint: { key: 'reddit:posts', label: 'Posts' },
          },
          {
            uri: 'https://www.reddit.com/r/programming/comments/.rss',
            hint: { key: 'reddit:comments', label: 'Comments' },
          },
        ],
      ],
    ]

    it.each(sortedValues)(
      'should return sorted RSS feed URL and all-comments feed for %s',
      (url, expected) => {
        expect(redditHandler.resolve(url)).toEqual(expected)
      },
    )

    const timeframeValues: Array<[string, Array<DiscoverUriEntry>]> = [
      [
        'https://reddit.com/r/programming/top?t=week',
        [
          {
            uri: 'https://www.reddit.com/r/programming/top/.rss?t=week',
            hint: { key: 'reddit:posts', label: 'Posts' },
          },
          {
            uri: 'https://www.reddit.com/r/programming/comments/.rss',
            hint: { key: 'reddit:comments', label: 'Comments' },
          },
        ],
      ],
      [
        'https://reddit.com/r/programming/controversial?t=all',
        [
          {
            uri: 'https://www.reddit.com/r/programming/controversial/.rss?t=all',
            hint: { key: 'reddit:posts', label: 'Posts' },
          },
          {
            uri: 'https://www.reddit.com/r/programming/comments/.rss',
            hint: { key: 'reddit:comments', label: 'Comments' },
          },
        ],
      ],
    ]

    it.each(timeframeValues)(
      'should forward ?t=timeframe on time-filtered sort for %s',
      (url, expected) => {
        expect(redditHandler.resolve(url)).toEqual(expected)
      },
    )

    it('should drop unknown ?t= values', () => {
      const value = 'https://reddit.com/r/programming/top?t=garbage'
      const expected = [
        {
          uri: 'https://www.reddit.com/r/programming/top/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.reddit.com/r/programming/comments/.rss',
          hint: { key: 'reddit:comments', label: 'Comments' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should not forward ?t= on non-time-filtered sorts', () => {
      const value = 'https://reddit.com/r/programming/new?t=week'
      const expected = [
        {
          uri: 'https://www.reddit.com/r/programming/new/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.reddit.com/r/programming/comments/.rss',
          hint: { key: 'reddit:comments', label: 'Comments' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return base feed and all-comments feed for unknown sort options', () => {
      const value = 'https://reddit.com/r/programming/about'
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

    it('should return sitewide sort feed for /hot', () => {
      const value = 'https://www.reddit.com/hot'
      const expected = [
        {
          uri: 'https://www.reddit.com/hot/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return sitewide sort feed with timeframe for /top?t=week', () => {
      const value = 'https://www.reddit.com/top?t=week'
      const expected = [
        {
          uri: 'https://www.reddit.com/top/.rss?t=week',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return sitewide sort feed for /best', () => {
      const value = 'https://www.reddit.com/best'
      const expected = [
        {
          uri: 'https://www.reddit.com/best/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for /search without q', () => {
      const value = 'https://www.reddit.com/search'

      expect(redditHandler.resolve(value)).toEqual([])
    })

    it('should return sitewide search feed for /search?q=', () => {
      const value = 'https://www.reddit.com/search?q=typescript'
      const expected = [
        {
          uri: 'https://www.reddit.com/search.rss?q=typescript',
          hint: { key: 'reddit:search', label: 'Search' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should fall through to base subreddit feed for /r/{sub}/search without q', () => {
      const value = 'https://www.reddit.com/r/programming/search'
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

    it('should return restricted search feed for /r/{sub}/search?q=', () => {
      const value = 'https://www.reddit.com/r/programming/search?q=rust'
      const expected = [
        {
          uri: 'https://www.reddit.com/r/programming/search.rss?q=rust&restrict_sr=on',
          hint: { key: 'reddit:search', label: 'Search' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return wiki feed for /r/{sub}/wiki', () => {
      const value = 'https://www.reddit.com/r/programming/wiki'
      const expected = [
        {
          uri: 'https://www.reddit.com/r/programming/wiki/index.rss',
          hint: { key: 'reddit:wiki', label: 'Wiki' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return subreddit-list feed for /subreddits', () => {
      const value = 'https://www.reddit.com/subreddits'
      const expected = [
        {
          uri: 'https://www.reddit.com/subreddits/.rss',
          hint: { key: 'reddit:subreddits', label: 'Subreddits' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return subreddit-list feed for /subreddits/popular', () => {
      const value = 'https://www.reddit.com/subreddits/popular'
      const expected = [
        {
          uri: 'https://www.reddit.com/subreddits/popular/.rss',
          hint: { key: 'reddit:subreddits', label: 'Subreddits' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return subreddit-list feed for /subreddits/new', () => {
      const value = 'https://www.reddit.com/subreddits/new'
      const expected = [
        {
          uri: 'https://www.reddit.com/subreddits/new/.rss',
          hint: { key: 'reddit:subreddits', label: 'Subreddits' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return subreddit-list feed for /reddits alias', () => {
      const value = 'https://www.reddit.com/reddits'
      const expected = [
        {
          uri: 'https://www.reddit.com/subreddits/.rss',
          hint: { key: 'reddit:subreddits', label: 'Subreddits' },
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

    it('should return submitted and profile feeds for /user/{user}/submitted', () => {
      const value = 'https://reddit.com/user/spez/submitted'
      const expected = [
        {
          uri: 'https://www.reddit.com/user/spez/submitted/.rss',
          hint: { key: 'reddit:user-submitted', label: 'Submitted' },
        },
        {
          uri: 'https://www.reddit.com/user/spez/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it('should return user-comments and profile feeds for /user/{user}/comments', () => {
      const value = 'https://reddit.com/user/spez/comments'
      const expected = [
        {
          uri: 'https://www.reddit.com/user/spez/comments/.rss',
          hint: { key: 'reddit:user-comments', label: 'Comments' },
        },
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

    it('should return empty array for /r/ without subreddit', () => {
      const value = 'https://reddit.com/r/'

      expect(redditHandler.resolve(value)).toEqual([])
    })

    it('should ignore query params in subreddit URL', () => {
      const value = 'https://reddit.com/r/programming?sort=new'
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

    it('should treat malformed comments URL without post ID as subreddit', () => {
      // /r/AskReddit/comments/ lacks a post ID, so commentsMatch fails.
      const value = 'https://reddit.com/r/AskReddit/comments/'
      const expected = [
        {
          uri: 'https://www.reddit.com/r/AskReddit/.rss',
          hint: { key: 'reddit:posts', label: 'Posts' },
        },
        {
          uri: 'https://www.reddit.com/r/AskReddit/comments/.rss',
          hint: { key: 'reddit:comments', label: 'Comments' },
        },
      ]

      expect(redditHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
