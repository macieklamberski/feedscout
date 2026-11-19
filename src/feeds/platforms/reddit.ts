import { reddit } from 'feedintel'
import { getAnyOf, getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: domain, subreddits.
// Handler needed for: comments, multireddit, post-comments, posts, search, subreddit, user, user-submitted.

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

export const hosts = reddit.hosts.exact

const subredditsRegex = /^\/(?:subreddits|reddits)(?:\/([^/.]+))?(?:[/.]|$)/i
// Stops at a dot, so a feed URL like /r/{sub}.rss, /user/{user}/submitted.rss or
// /user/{user}/m/{multi}.rss yields the name, the section and the multireddit.
const nameRegex = /^[^.]+/

const subredditsSorts = ['new', 'popular']
const sortOptions = ['hot', 'new', 'rising', 'controversial', 'top', 'best']
const timeOptions = ['hour', 'day', 'week', 'month', 'year', 'all']
const timeFilteredSorts = ['top', 'controversial']
const userPrefixes = ['u', 'user']

const feeds = withHintLabels(reddit.feeds)

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
      return [feeds.getFeedEntry('posts')]
    }

    if (parsed.kind === 'siteSort') {
      const { sort, timeframe } = parsed

      return [feeds.getFeedEntry('posts', { sort, timeframe })]
    }

    if (parsed.kind === 'siteSearch') {
      return [feeds.getFeedEntry('search', { query: parsed.query })]
    }

    if (parsed.kind === 'subreddits') {
      return [feeds.getFeedEntry('subreddits', { sort: parsed.sort })]
    }

    if (parsed.kind === 'search' && parsed.query) {
      return [
        feeds.getFeedEntry('subreddit-search', {
          subreddit: parsed.subreddit,
          query: parsed.query,
        }),
      ]
    }

    if (parsed.kind === 'wiki') {
      return [feeds.getFeedEntry('wiki', { subreddit: parsed.subreddit })]
    }

    if (parsed.kind === 'post') {
      const { subreddit, postId } = parsed

      return [feeds.getFeedEntry('post-comments', { subreddit, postId })]
    }

    if (parsed.kind === 'subreddit') {
      const { subreddit, sort, timeframe } = parsed

      return [
        feeds.getFeedEntry('subreddit', { subreddit, sort, timeframe }),
        feeds.getFeedEntry('comments', { subreddit }),
      ]
    }

    // A subreddit search without a query shows the subreddit.
    if (parsed.kind === 'search') {
      const { subreddit } = parsed

      return [
        feeds.getFeedEntry('subreddit', { subreddit }),
        feeds.getFeedEntry('comments', { subreddit }),
      ]
    }

    if (parsed.kind === 'multireddit') {
      const { username, multireddit } = parsed

      return [feeds.getFeedEntry('multireddit', { username, multireddit })]
    }

    if (parsed.kind === 'submitted') {
      const { username } = parsed

      return [
        feeds.getFeedEntry('user-submitted', { username }),
        feeds.getFeedEntry('user', { username }),
      ]
    }

    if (parsed.kind === 'userPost') {
      const { username, postId } = parsed

      return [feeds.getFeedEntry('post-comments', { username, postId })]
    }

    if (parsed.kind === 'comments') {
      const { username } = parsed

      return [
        feeds.getFeedEntry('user-comments', { username }),
        feeds.getFeedEntry('user', { username }),
      ]
    }

    if (parsed.kind === 'user') {
      return [feeds.getFeedEntry('user', { username: parsed.username })]
    }

    return [feeds.getFeedEntry('domain', { domain: parsed.domain })]
  },

  getFeedHint: feeds.getFeedHint,
}
