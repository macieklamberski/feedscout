import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers domain, subreddits (guess, html), partly covers multiSubreddit.
// Handler needed for: home, search, subreddit, user, userSubmitted.

export type RedditUrl =
  | { kind: 'subreddit'; subreddit: string; sort?: string }
  | { kind: 'search'; subreddit: string }
  | { kind: 'wiki'; subreddit: string }
  | { kind: 'post'; subreddit: string; postId: string }
  | { kind: 'user'; username: string }
  | { kind: 'submitted'; username: string }
  | { kind: 'comments'; username: string }
  | { kind: 'multireddit'; username: string; multireddit: string }
  | { kind: 'domain'; domain: string }

export const hosts = ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'new.reddit.com']

const subredditsRegex = /^\/(?:subreddits|reddits)(?:\/(new|popular))?/
// Stops at a dot, so a feed URL like /r/{sub}.rss or /user/{user}/submitted.rss yields the
// name and the section.
const nameRegex = /^[^.]+/

const sortOptions = ['hot', 'new', 'rising', 'controversial', 'top', 'best']
const timeOptions = ['hour', 'day', 'week', 'month', 'year', 'all']
const timeFilteredSorts = ['top', 'controversial']
const userPrefixes = ['u', 'user']

const getTimeframeSuffix = (sort: string, searchParams: URLSearchParams): string => {
  if (!timeFilteredSorts.includes(sort)) {
    return ''
  }

  const timeframe = searchParams.get('t')

  if (timeframe && timeOptions.includes(timeframe)) {
    return `?t=${timeframe}`
  }

  return ''
}

// Combined subreddits work transparently: /r/{sub1}+{sub2} is captured as one name.
export const parseRedditUrl = (url: string): RedditUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [prefix, rawName, rawSection, item] = getPathSegments(parsedUrl)

  if (prefix === 'domain' && rawName) {
    return { kind: 'domain', domain: rawName }
  }

  const name = rawName?.match(nameRegex)?.[0]
  const section = rawSection?.match(nameRegex)?.[0]

  if (!name) {
    return
  }

  if (prefix === 'r') {
    if (section === 'search') {
      return { kind: 'search', subreddit: name }
    }

    if (section === 'wiki') {
      return { kind: 'wiki', subreddit: name }
    }

    if (section === 'comments' && item) {
      return { kind: 'post', subreddit: name, postId: item }
    }

    if (section && isAnyOf(section, sortOptions)) {
      return { kind: 'subreddit', subreddit: name, sort: section }
    }

    return { kind: 'subreddit', subreddit: name }
  }

  if (prefix === 'user' && section === 'm' && item) {
    return { kind: 'multireddit', username: name, multireddit: item }
  }

  if (!prefix || !userPrefixes.includes(prefix)) {
    return
  }

  if (section === 'submitted') {
    return { kind: 'submitted', username: name }
  }

  if (section === 'comments') {
    return { kind: 'comments', username: name }
  }

  return { kind: 'user', username: name }
}

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

    const parsed = parseRedditUrl(url)
    const query = searchParams.get('q')

    if (parsed?.kind === 'search' && query) {
      return [
        {
          uri: `https://www.reddit.com/r/${parsed.subreddit}/search.rss?q=${encodeURIComponent(query)}&restrict_sr=on`,
          hint: composeHint('reddit:search'),
        },
      ]
    }

    if (parsed?.kind === 'wiki') {
      return [
        {
          uri: `https://www.reddit.com/r/${parsed.subreddit}/wiki/index.rss`,
          hint: composeHint('reddit:wiki'),
        },
      ]
    }

    if (parsed?.kind === 'post') {
      return [
        {
          uri: `https://www.reddit.com/r/${parsed.subreddit}/comments/${parsed.postId}/.rss`,
          hint: composeHint('reddit:post-comments'),
        },
      ]
    }

    // A subreddit search without a query shows the subreddit.
    if (parsed?.kind === 'subreddit' || parsed?.kind === 'search') {
      const { subreddit } = parsed
      const sort = parsed.kind === 'subreddit' ? parsed.sort : undefined
      const uris: Array<DiscoverUriEntry> = []

      if (sort) {
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

      uris.push({
        uri: `https://www.reddit.com/r/${subreddit}/comments/.rss`,
        hint: composeHint('reddit:comments'),
      })

      return uris
    }

    if (parsed?.kind === 'multireddit') {
      return [
        {
          uri: `https://www.reddit.com/user/${parsed.username}/m/${parsed.multireddit}/.rss`,
          hint: composeHint('reddit:multireddit'),
        },
      ]
    }

    if (parsed?.kind === 'submitted') {
      return [
        {
          uri: `https://www.reddit.com/user/${parsed.username}/submitted/.rss`,
          hint: composeHint('reddit:user-submitted'),
        },
        {
          uri: `https://www.reddit.com/user/${parsed.username}/.rss`,
          hint: composeHint('reddit:posts'),
        },
      ]
    }

    if (parsed?.kind === 'comments') {
      return [
        {
          uri: `https://www.reddit.com/user/${parsed.username}/comments/.rss`,
          hint: composeHint('reddit:user-comments'),
        },
        {
          uri: `https://www.reddit.com/user/${parsed.username}/.rss`,
          hint: composeHint('reddit:posts'),
        },
      ]
    }

    if (parsed?.kind === 'user') {
      return [
        {
          uri: `https://www.reddit.com/user/${parsed.username}/.rss`,
          hint: composeHint('reddit:posts'),
        },
      ]
    }

    if (parsed?.kind === 'domain') {
      return [
        {
          uri: `https://www.reddit.com/domain/${parsed.domain}/.rss`,
          hint: composeHint('reddit:posts'),
        },
      ]
    }

    return []
  },
}
