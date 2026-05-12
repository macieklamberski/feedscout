import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Reddit exposes Atom feeds across an extensive surface — sitewide
// (`/.rss`, `/{sort}/.rss`, `/search.rss`, `/subreddits.rss`), per-subreddit
// (`/r/{sub}/.rss`, with `/{sort}` and `?t=` timeframe), per-post
// (`/r/{sub}/comments/{id}/.rss`), wiki, multireddit, user, and domain —
// but pages emit no `<link rel="alternate">`, and the bare `Mozilla/5.0` UA
// is 403'd platform-wide. The handler maps the canonical browser URL
// shapes onto the appropriate `.rss` feed for each surface.

const commentsRegex = /^\/r\/([^/]+)\/comments\/([^/]+)/
const subredditWikiRegex = /^\/r\/([^/]+)\/wiki/
const subredditSearchRegex = /^\/r\/([^/]+)\/search/
const subredditRegex = /^\/r\/([^/]+)(?:\/([^/]+))?/
const multiredditRegex = /^\/user\/([^/]+)\/m\/([^/]+)/
const userRegex = /^\/(?:u|user)\/([^/]+)(?:\/(submitted|comments))?/
const domainRegex = /^\/domain\/([^/]+)/
const subredditsRegex = /^\/(?:subreddits|reddits)(?:\/(new|popular))?/

export const hosts = ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'new.reddit.com']
const sortOptions = ['hot', 'new', 'rising', 'controversial', 'top', 'best']
const timeOptions = new Set(['hour', 'day', 'week', 'month', 'year', 'all'])
const timeFilteredSorts = new Set(['top', 'controversial'])

const getTimeframeSuffix = (sort: string, searchParams: URLSearchParams): string => {
  if (!timeFilteredSorts.has(sort)) {
    return ''
  }

  const timeframe = searchParams.get('t')

  if (timeframe && timeOptions.has(timeframe)) {
    return `?t=${timeframe}`
  }

  return ''
}

// Combined subreddits work transparently: /r/{sub1}+{sub2} is captured by the same regex.

export const redditHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname, searchParams } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Homepage: reddit.com/
    if (pathSegments.length === 0) {
      return [{ uri: 'https://www.reddit.com/.rss', hint: composeHint('reddit:posts') }]
    }

    // Sitewide sort: /hot, /new, /rising, /controversial, /top, /best
    if (pathSegments.length === 1 && isAnyOf(pathSegments[0], sortOptions)) {
      const sort = pathSegments[0]

      return [
        {
          uri: `https://www.reddit.com/${sort}/.rss${getTimeframeSuffix(sort, searchParams)}`,
          hint: composeHint('reddit:posts'),
        },
      ]
    }

    // Sitewide search: /search?q=...
    if (pathSegments[0] === 'search') {
      const query = searchParams.get('q')

      if (query) {
        return [
          {
            uri: `https://www.reddit.com/search.rss?q=${encodeURIComponent(query)}`,
            hint: composeHint('reddit:search'),
          },
        ]
      }
    }

    // Subreddit list: /subreddits[/new|/popular]
    const subredditsMatch = pathname.match(subredditsRegex)

    if (subredditsMatch) {
      const sort = subredditsMatch[1]
      const path = sort ? `subreddits/${sort}` : 'subreddits'

      return [
        {
          uri: `https://www.reddit.com/${path}/.rss`,
          hint: composeHint('reddit:subreddits'),
        },
      ]
    }

    // Subreddit search: /r/{sub}/search?q=...
    const subredditSearchMatch = pathname.match(subredditSearchRegex)

    if (subredditSearchMatch?.[1]) {
      const subreddit = subredditSearchMatch[1]
      const query = searchParams.get('q')

      if (query) {
        return [
          {
            uri: `https://www.reddit.com/r/${subreddit}/search.rss?q=${encodeURIComponent(query)}&restrict_sr=on`,
            hint: composeHint('reddit:search'),
          },
        ]
      }
    }

    // Subreddit wiki: /r/{sub}/wiki[/...]
    const subredditWikiMatch = pathname.match(subredditWikiRegex)

    if (subredditWikiMatch?.[1]) {
      return [
        {
          uri: `https://www.reddit.com/r/${subredditWikiMatch[1]}/wiki/index.rss`,
          hint: composeHint('reddit:wiki'),
        },
      ]
    }

    // Match /r/subreddit/comments/id pattern (post comments feed).
    const commentsMatch = pathname.match(commentsRegex)

    if (commentsMatch?.[1] && commentsMatch?.[2]) {
      const subreddit = commentsMatch[1]
      const postId = commentsMatch[2]

      return [
        {
          uri: `https://www.reddit.com/r/${subreddit}/comments/${postId}/.rss`,
          hint: composeHint('reddit:post-comments'),
        },
      ]
    }

    // Match /r/subreddit with optional sort.
    const subredditMatch = pathname.match(subredditRegex)

    if (subredditMatch?.[1]) {
      const subreddit = subredditMatch[1]
      const sort = subredditMatch[2]
      const uris: Array<DiscoverUriEntry> = []

      if (sort && isAnyOf(sort, sortOptions)) {
        uris.push({
          uri: `https://www.reddit.com/r/${subreddit}/${sort}/.rss${getTimeframeSuffix(sort, searchParams)}`,
          hint: composeHint('reddit:posts'),
        })
      } else {
        uris.push({
          uri: `https://www.reddit.com/r/${subreddit}/.rss`,
          hint: composeHint('reddit:posts'),
        })
      }

      // Add all comments feed for subreddit.
      uris.push({
        uri: `https://www.reddit.com/r/${subreddit}/comments/.rss`,
        hint: composeHint('reddit:comments'),
      })

      return uris
    }

    // Match multireddit: /user/{username}/m/{multireddit}.
    const multiredditMatch = pathname.match(multiredditRegex)

    if (multiredditMatch?.[1] && multiredditMatch?.[2]) {
      const username = multiredditMatch[1]
      const multireddit = multiredditMatch[2]

      return [
        {
          uri: `https://www.reddit.com/user/${username}/m/${multireddit}/.rss`,
          hint: composeHint('reddit:multireddit'),
        },
      ]
    }

    // Match /u/username or /user/username pattern, with optional /submitted or /comments.
    const userMatch = pathname.match(userRegex)

    if (userMatch?.[1]) {
      const username = userMatch[1]
      const filter = userMatch[2]

      if (filter === 'submitted') {
        return [
          {
            uri: `https://www.reddit.com/user/${username}/submitted/.rss`,
            hint: composeHint('reddit:user-submitted'),
          },
          {
            uri: `https://www.reddit.com/user/${username}/.rss`,
            hint: composeHint('reddit:posts'),
          },
        ]
      }

      if (filter === 'comments') {
        return [
          {
            uri: `https://www.reddit.com/user/${username}/comments/.rss`,
            hint: composeHint('reddit:user-comments'),
          },
          {
            uri: `https://www.reddit.com/user/${username}/.rss`,
            hint: composeHint('reddit:posts'),
          },
        ]
      }

      return [
        {
          uri: `https://www.reddit.com/user/${username}/.rss`,
          hint: composeHint('reddit:posts'),
        },
      ]
    }

    // Match /domain/site pattern.
    const domainMatch = pathname.match(domainRegex)

    if (domainMatch?.[1]) {
      const domain = domainMatch[1]

      return [
        {
          uri: `https://www.reddit.com/domain/${domain}/.rss`,
          hint: composeHint('reddit:posts'),
        },
      ]
    }

    return []
  },
}
