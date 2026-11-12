import { getAnyOf, getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformFeedParams } from '../../common/uris/platform/feeds.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers domain, subreddits (guess, html), partly covers multiSubreddit.
// Handler needed for: home, multireddit, post, search, subreddit, subredditSort, user, userSubmitted.

export type RedditUrl =
  | { kind: 'home' }
  | { kind: 'siteSort'; sort: string; timeframe?: string }
  | { kind: 'siteSearch'; query: string }
  | { kind: 'subreddits'; sort?: string }
  | { kind: 'subreddit'; subreddit: string; sort?: string; timeframe?: string }
  | { kind: 'search'; subreddit: string; query?: string }
  | { kind: 'wiki'; subreddit: string }
  | { kind: 'post'; subreddit: string; postId: string }
  | { kind: 'user'; username: string }
  | { kind: 'submitted'; username: string }
  | { kind: 'comments'; username: string }
  | { kind: 'userPost'; username: string; postId: string }
  | { kind: 'multireddit'; username: string; multireddit: string }
  | { kind: 'domain'; domain: string }

export const hosts = ['reddit.com', 'www.reddit.com', 'old.reddit.com', 'new.reddit.com']
const mirrorHosts = ['old.reddit.com', 'new.reddit.com']

const subredditsRegex = /^\/(?:subreddits|reddits)(?:\/([^/.]+))?(?:[/.]|$)/i
// Stops at a dot, so a feed URL like /r/{sub}.rss, /user/{user}/submitted.rss or
// /user/{user}/m/{multi}.rss yields the name, the section and the multireddit.
const nameRegex = /^[^.]+/

const subredditsSorts = ['new', 'popular']
const sortOptions = ['hot', 'new', 'rising', 'controversial', 'top', 'best']
const timeOptions = ['hour', 'day', 'week', 'month', 'year', 'all']
const timeFilteredSorts = ['top', 'controversial']
const userPrefixes = ['u', 'user']

// Rows with a fixed segment sit above the `{sort}` rows that would read it as a sort. Within a key,
// a row with more placeholders sits above one with fewer, since the first row the values fill is
// built.
const feeds = definePlatformFeeds(
  [
    {
      key: 'reddit:search',
      template: 'https://www.reddit.com/r/{subreddit}/search.rss?q={query}&restrict_sr=on',
    },
    { key: 'reddit:search', template: 'https://www.reddit.com/search.rss?q={query}' },
    { key: 'reddit:wiki', template: 'https://www.reddit.com/r/{subreddit}/wiki/index.rss' },
    {
      key: 'reddit:post-comments',
      template: 'https://www.reddit.com/r/{subreddit}/comments/{postId}/.rss',
    },
    {
      key: 'reddit:post-comments',
      template: 'https://www.reddit.com/user/{username}/comments/{postId}/.rss',
    },
    { key: 'reddit:comments', template: 'https://www.reddit.com/r/{subreddit}/comments/.rss' },
    {
      key: 'reddit:multireddit',
      template: 'https://www.reddit.com/user/{username}/m/{multireddit}/.rss',
    },
    {
      key: 'reddit:user-submitted',
      template: 'https://www.reddit.com/user/{username}/submitted/.rss',
    },
    {
      key: 'reddit:user-comments',
      template: 'https://www.reddit.com/user/{username}/comments/.rss',
    },
    { key: 'reddit:subreddits', template: 'https://www.reddit.com/subreddits/{sort}/.rss' },
    { key: 'reddit:subreddits', template: 'https://www.reddit.com/subreddits/.rss' },
    {
      key: 'reddit:posts',
      template: 'https://www.reddit.com/r/{subreddit}/{sort}/.rss?t={timeframe}',
    },
    { key: 'reddit:posts', template: 'https://www.reddit.com/r/{subreddit}/{sort}/.rss' },
    { key: 'reddit:posts', template: 'https://www.reddit.com/r/{subreddit}/.rss' },
    { key: 'reddit:posts', template: 'https://www.reddit.com/r/{subreddit}.rss' },
    { key: 'reddit:posts', template: 'https://www.reddit.com/user/{username}/.rss' },
    { key: 'reddit:posts', template: 'https://www.reddit.com/domain/{domain}/.rss' },
    { key: 'reddit:posts', template: 'https://www.reddit.com/{sort}/.rss?t={timeframe}' },
    { key: 'reddit:posts', template: 'https://www.reddit.com/{sort}/.rss' },
    { key: 'reddit:posts', template: 'https://www.reddit.com/.rss' },
    // The same feeds on old. and new., which the page parser reads as pages. `resolve` passes no
    // `host`, so it builds on www.
    {
      key: 'reddit:search',
      template: 'https://{host}/r/{subreddit}/search.rss?q={query}&restrict_sr=on',
    },
    { key: 'reddit:wiki', template: 'https://{host}/r/{subreddit}/wiki/index.rss' },
    {
      key: 'reddit:post-comments',
      template: 'https://{host}/r/{subreddit}/comments/{postId}/.rss',
    },
    {
      key: 'reddit:post-comments',
      template: 'https://{host}/user/{username}/comments/{postId}/.rss',
    },
    { key: 'reddit:comments', template: 'https://{host}/r/{subreddit}/comments/.rss' },
    { key: 'reddit:multireddit', template: 'https://{host}/user/{username}/m/{multireddit}/.rss' },
    { key: 'reddit:user-submitted', template: 'https://{host}/user/{username}/submitted/.rss' },
    { key: 'reddit:user-comments', template: 'https://{host}/user/{username}/comments/.rss' },
    { key: 'reddit:subreddits', template: 'https://{host}/subreddits/{sort}/.rss' },
    { key: 'reddit:subreddits', template: 'https://{host}/subreddits/.rss' },
    { key: 'reddit:posts', template: 'https://{host}/r/{subreddit}/{sort}/.rss' },
    { key: 'reddit:posts', template: 'https://{host}/r/{subreddit}/.rss' },
    { key: 'reddit:posts', template: 'https://{host}/r/{subreddit}.rss' },
    { key: 'reddit:posts', template: 'https://{host}/user/{username}/.rss' },
    { key: 'reddit:posts', template: 'https://{host}/domain/{domain}/.rss' },
  ],
  { hosts: mirrorHosts },
)

const getTimeframe = (sort: string, searchParams: URLSearchParams): string | undefined => {
  if (!timeFilteredSorts.includes(sort)) {
    return
  }

  return getAnyOf(getQueryParam(searchParams, 't'), timeOptions)
}

// Combined subreddits work transparently: /r/{sub1}+{sub2} is captured as one name.
export const parseRedditUrl = (url: string): RedditUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const pathSegments = getPathSegments(parsedUrl)

  if (pathSegments.length === 0) {
    return { kind: 'home' }
  }

  // Sitewide sort: /hot, /new, /rising, /controversial, /top, /best.
  const siteSort = pathSegments.length === 1 ? getAnyOf(pathSegments[0], sortOptions) : undefined

  if (siteSort) {
    return { kind: 'siteSort', sort: siteSort, timeframe: getTimeframe(siteSort, searchParams) }
  }

  const query = getQueryParam(searchParams, 'q')

  if (isAnyOf(pathSegments[0], 'search') && query) {
    return { kind: 'siteSearch', query }
  }

  // Subreddit list: /subreddits[/new|/popular].
  const subredditsMatch = pathname.match(subredditsRegex)

  if (subredditsMatch) {
    return { kind: 'subreddits', sort: getAnyOf(subredditsMatch[1], subredditsSorts) }
  }

  const [prefix, rawName, rawSection, item] = pathSegments

  if (isAnyOf(prefix, 'domain') && rawName) {
    return { kind: 'domain', domain: rawName }
  }

  const name = rawName?.match(nameRegex)?.[0]
  const section = rawSection?.match(nameRegex)?.[0]

  if (!name) {
    return
  }

  if (isAnyOf(prefix, 'r')) {
    if (isAnyOf(section, 'search')) {
      return { kind: 'search', subreddit: name, query }
    }

    if (isAnyOf(section, 'wiki')) {
      return { kind: 'wiki', subreddit: name }
    }

    if (isAnyOf(section, 'comments') && item) {
      return { kind: 'post', subreddit: name, postId: item }
    }

    const sort = getAnyOf(section, sortOptions)

    if (sort) {
      return {
        kind: 'subreddit',
        subreddit: name,
        sort,
        timeframe: getTimeframe(sort, searchParams),
      }
    }

    return { kind: 'subreddit', subreddit: name }
  }

  if (!isAnyOf(prefix, userPrefixes)) {
    return
  }

  const multireddit = item?.match(nameRegex)?.[0]

  if (isAnyOf(section, 'm') && multireddit) {
    return { kind: 'multireddit', username: name, multireddit }
  }

  if (isAnyOf(section, 'submitted')) {
    return { kind: 'submitted', username: name }
  }

  if (isAnyOf(section, 'comments') && item) {
    return { kind: 'userPost', username: name, postId: item }
  }

  if (isAnyOf(section, 'comments')) {
    return { kind: 'comments', username: name }
  }

  return { kind: 'user', username: name }
}

export const redditHandler: PlatformHandler = {
  match: (url) => {
    return parseRedditUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseRedditUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'home') {
      return [feeds.getFeedEntry('reddit:posts')]
    }

    if (parsed.kind === 'siteSort') {
      const { sort, timeframe } = parsed

      return [feeds.getFeedEntry('reddit:posts', timeframe ? { sort, timeframe } : { sort })]
    }

    if (parsed.kind === 'siteSearch') {
      return [feeds.getFeedEntry('reddit:search', { query: parsed.query })]
    }

    if (parsed.kind === 'subreddits') {
      const { sort } = parsed

      return [feeds.getFeedEntry('reddit:subreddits', sort ? { sort } : {})]
    }

    if (parsed.kind === 'search' && parsed.query) {
      return [
        feeds.getFeedEntry('reddit:search', { subreddit: parsed.subreddit, query: parsed.query }),
      ]
    }

    if (parsed.kind === 'wiki') {
      return [feeds.getFeedEntry('reddit:wiki', { subreddit: parsed.subreddit })]
    }

    if (parsed.kind === 'post') {
      const { subreddit, postId } = parsed

      return [feeds.getFeedEntry('reddit:post-comments', { subreddit, postId })]
    }

    // A subreddit search without a query shows the subreddit.
    if (parsed.kind === 'subreddit' || parsed.kind === 'search') {
      const { subreddit } = parsed
      const comments = feeds.getFeedEntry('reddit:comments', { subreddit })

      if (parsed.kind === 'subreddit' && parsed.sort) {
        const { sort, timeframe } = parsed
        const params: PlatformFeedParams = timeframe
          ? { subreddit, sort, timeframe }
          : { subreddit, sort }

        return [feeds.getFeedEntry('reddit:posts', params), comments]
      }

      return [feeds.getFeedEntry('reddit:posts', { subreddit }), comments]
    }

    if (parsed.kind === 'multireddit') {
      const { username, multireddit } = parsed

      return [feeds.getFeedEntry('reddit:multireddit', { username, multireddit })]
    }

    if (parsed.kind === 'submitted') {
      const { username } = parsed

      return [
        feeds.getFeedEntry('reddit:user-submitted', { username }),
        feeds.getFeedEntry('reddit:posts', { username }),
      ]
    }

    if (parsed.kind === 'userPost') {
      const { username, postId } = parsed

      return [feeds.getFeedEntry('reddit:post-comments', { username, postId })]
    }

    if (parsed.kind === 'comments') {
      const { username } = parsed

      return [
        feeds.getFeedEntry('reddit:user-comments', { username }),
        feeds.getFeedEntry('reddit:posts', { username }),
      ]
    }

    if (parsed.kind === 'user') {
      return [feeds.getFeedEntry('reddit:posts', { username: parsed.username })]
    }

    return [feeds.getFeedEntry('reddit:posts', { domain: parsed.domain })]
  },

  getFeedHint: feeds.getFeedHint,
}
