import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { RedditUrl } from './reddit.js'
import { parseRedditUrl, redditHandler } from './reddit.js'

describe('parseRedditUrl', () => {
  it('should return the subreddit for a subreddit page', () => {
    const expected: RedditUrl = { kind: 'subreddit', subreddit: 'programming' }

    expect(parseRedditUrl('https://reddit.com/r/programming')).toEqual(expected)
  })

  it('should return the subreddit for every Reddit host', () => {
    const expected: RedditUrl = { kind: 'subreddit', subreddit: 'programming' }

    expect(parseRedditUrl('https://www.reddit.com/r/programming')).toEqual(expected)
    expect(parseRedditUrl('https://old.reddit.com/r/programming')).toEqual(expected)
    expect(parseRedditUrl('https://new.reddit.com/r/programming')).toEqual(expected)
  })

  it('should return the subreddit for a trailing slash', () => {
    const expected: RedditUrl = { kind: 'subreddit', subreddit: 'programming' }

    expect(parseRedditUrl('https://reddit.com/r/programming/')).toEqual(expected)
  })

  it('should return the subreddit for a URL with query params', () => {
    const expected: RedditUrl = { kind: 'subreddit', subreddit: 'programming' }

    expect(parseRedditUrl('https://reddit.com/r/programming?sort=new')).toEqual(expected)
  })

  it('should return the combined subreddits as one name', () => {
    const expected: RedditUrl = { kind: 'subreddit', subreddit: 'programming+javascript' }

    expect(parseRedditUrl('https://reddit.com/r/programming+javascript')).toEqual(expected)
  })

  it('should return the subreddit without a feed extension', () => {
    const expected: RedditUrl = { kind: 'subreddit', subreddit: 'programming' }

    expect(parseRedditUrl('https://www.reddit.com/r/programming.rss')).toEqual(expected)
    expect(parseRedditUrl('https://www.reddit.com/r/programming.atom')).toEqual(expected)
  })

  it('should return the subreddit with its sort', () => {
    const expected: RedditUrl = { kind: 'subreddit', subreddit: 'programming', sort: 'hot' }

    expect(parseRedditUrl('https://reddit.com/r/programming/hot')).toEqual(expected)
  })

  it('should return the lowercase sort for a capitalized subreddit sort', () => {
    const expected: RedditUrl = { kind: 'subreddit', subreddit: 'programming', sort: 'hot' }

    expect(parseRedditUrl('https://reddit.com/r/programming/Hot')).toEqual(expected)
  })

  it('should return the subreddit without an unknown section', () => {
    const expected: RedditUrl = { kind: 'subreddit', subreddit: 'programming' }

    expect(parseRedditUrl('https://reddit.com/r/programming/about')).toEqual(expected)
  })

  it('should return the search for a subreddit search page', () => {
    const expected: RedditUrl = { kind: 'search', subreddit: 'programming' }

    expect(parseRedditUrl('https://reddit.com/r/programming/search?q=rust')).toEqual(expected)
  })

  it('should return the wiki for a subreddit wiki page', () => {
    const expected: RedditUrl = { kind: 'wiki', subreddit: 'programming' }

    expect(parseRedditUrl('https://reddit.com/r/programming/wiki')).toEqual(expected)
  })

  it('should return the post for a post page', () => {
    const value = 'https://reddit.com/r/AskReddit/comments/abc123/whats_your_favorite'
    const expected: RedditUrl = { kind: 'post', subreddit: 'AskReddit', postId: 'abc123' }

    expect(parseRedditUrl(value)).toEqual(expected)
  })

  it('should return the subreddit for a comments path without a post', () => {
    const expected: RedditUrl = { kind: 'subreddit', subreddit: 'AskReddit' }

    expect(parseRedditUrl('https://reddit.com/r/AskReddit/comments')).toEqual(expected)
  })

  it('should return the user for a /user/ page', () => {
    const expected: RedditUrl = { kind: 'user', username: 'spez' }

    expect(parseRedditUrl('https://reddit.com/user/spez')).toEqual(expected)
  })

  it('should return the user for a /u/ page', () => {
    const expected: RedditUrl = { kind: 'user', username: 'spez' }

    expect(parseRedditUrl('https://reddit.com/u/spez')).toEqual(expected)
  })

  it('should return the user without a feed extension', () => {
    const expected: RedditUrl = { kind: 'user', username: 'spez' }

    expect(parseRedditUrl('https://www.reddit.com/u/spez.rss')).toEqual(expected)
    expect(parseRedditUrl('https://www.reddit.com/user/spez.atom')).toEqual(expected)
  })

  it('should return the submitted page of a user', () => {
    const expected: RedditUrl = { kind: 'submitted', username: 'spez' }

    expect(parseRedditUrl('https://reddit.com/user/spez/submitted')).toEqual(expected)
  })

  it('should return the submitted page without a feed extension', () => {
    const expected: RedditUrl = { kind: 'submitted', username: 'spez' }

    expect(parseRedditUrl('https://www.reddit.com/user/spez/submitted.rss')).toEqual(expected)
  })

  it('should return the comments page of a user', () => {
    const expected: RedditUrl = { kind: 'comments', username: 'spez' }

    expect(parseRedditUrl('https://reddit.com/user/spez/comments')).toEqual(expected)
  })

  it('should return the user for an unknown user section', () => {
    const expected: RedditUrl = { kind: 'user', username: 'spez' }

    expect(parseRedditUrl('https://reddit.com/user/spez/upvoted')).toEqual(expected)
  })

  it('should return the multireddit for a /user/ multireddit page', () => {
    const value = 'https://reddit.com/user/kjoneslol/m/sfwpornnetwork'
    const expected: RedditUrl = {
      kind: 'multireddit',
      username: 'kjoneslol',
      multireddit: 'sfwpornnetwork',
    }

    expect(parseRedditUrl(value)).toEqual(expected)
  })

  it('should return the multireddit for a /u/ multireddit page', () => {
    const expected: RedditUrl = {
      kind: 'multireddit',
      username: 'kjoneslol',
      multireddit: 'sfwpornnetwork',
    }

    expect(parseRedditUrl('https://reddit.com/u/kjoneslol/m/sfwpornnetwork')).toEqual(expected)
  })

  it('should return the domain for a domain page', () => {
    const expected: RedditUrl = { kind: 'domain', domain: 'github.com' }

    expect(parseRedditUrl('https://reddit.com/domain/github.com')).toEqual(expected)
  })

  it('should return undefined for an unknown prefix', () => {
    expect(parseRedditUrl('https://reddit.com/settings/profile')).toBeUndefined()
  })

  it('should return the subreddit for a capitalized /R/ prefix', () => {
    const expected: RedditUrl = { kind: 'subreddit', subreddit: 'programming' }

    expect(parseRedditUrl('https://reddit.com/R/programming')).toEqual(expected)
  })

  it('should return the multireddit for a capitalized multireddit path', () => {
    const value = 'https://reddit.com/User/kjoneslol/M/sfwpornnetwork'
    const expected: RedditUrl = {
      kind: 'multireddit',
      username: 'kjoneslol',
      multireddit: 'sfwpornnetwork',
    }

    expect(parseRedditUrl(value)).toEqual(expected)
  })

  it('should return the submitted posts for a capitalized submitted path', () => {
    const expected: RedditUrl = { kind: 'submitted', username: 'spez' }

    expect(parseRedditUrl('https://reddit.com/U/spez/Submitted')).toEqual(expected)
  })

  it('should return undefined for a prefix without a name', () => {
    expect(parseRedditUrl('https://reddit.com/r/')).toBeUndefined()
    expect(parseRedditUrl('https://reddit.com/r')).toBeUndefined()
    expect(parseRedditUrl('https://reddit.com/u/')).toBeUndefined()
    expect(parseRedditUrl('https://reddit.com/user')).toBeUndefined()
  })

  it('should return undefined for a name that is only a feed extension', () => {
    expect(parseRedditUrl('https://reddit.com/r/.rss')).toBeUndefined()
  })

  it('should return undefined for other Reddit paths', () => {
    expect(parseRedditUrl('https://reddit.com/about')).toBeUndefined()
    expect(parseRedditUrl('https://reddit.com/wiki')).toBeUndefined()
    expect(parseRedditUrl('https://reddit.com/search?q=typescript')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseRedditUrl('https://reddit.com/')).toBeUndefined()
    expect(parseRedditUrl('https://reddit.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseRedditUrl('https://example.com/r/programming')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseRedditUrl('not-a-url')).toBeUndefined()
  })
})

describe('redditHandler', () => {
  describe('match', () => {
    it('should match a Reddit URL', () => {
      expect(redditHandler.match('https://reddit.com/r/programming')).toBe(true)
    })

    it('should not match another host', () => {
      expect(redditHandler.match('https://example.com/r/test')).toBe(false)
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

    it('should return lowercase sitewide sort feed with timeframe for /Top?t=week', () => {
      const value = 'https://www.reddit.com/Top?t=week'
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

    it('should return sitewide search feed for /search?q= with a capitalized search segment', () => {
      const value = 'https://www.reddit.com/Search?q=typescript'
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

    it('should strip a feed extension from the subreddit', () => {
      const value = 'https://www.reddit.com/r/programming.rss'
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
  })
})
