import { reddit } from 'feedintel'
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

const feeds = withHintLabels(reddit.feeds)

// Combined subreddits work transparently: /r/{sub1}+{sub2} is captured as one name. A sort and a
// timeframe are read in any case and built in lowercase.
export const parseRedditUrl = (url: string): RedditUrl | undefined => {
  const page = reddit.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'home') {
    return { kind: 'home' }
  }

  if (page.key === 'site-sort') {
    const { sort, timeframe } = page.values

    return { kind: 'siteSort', sort: sort.toLowerCase(), timeframe: timeframe?.toLowerCase() }
  }

  if (page.key === 'site-search') {
    return { kind: 'siteSearch', query: page.values.query }
  }

  if (page.key === 'subreddits') {
    return { kind: 'subreddits', sort: page.values.sort?.toLowerCase() }
  }

  if (page.key === 'domain') {
    return { kind: 'domain', domain: page.values.domain }
  }

  if (page.key === 'search') {
    return { kind: 'search', subreddit: page.values.subreddit, query: page.values.query }
  }

  if (page.key === 'wiki') {
    return { kind: 'wiki', subreddit: page.values.subreddit }
  }

  if (page.key === 'post') {
    return { kind: 'post', subreddit: page.values.subreddit, postId: page.values.postId }
  }

  if (page.key === 'subreddit') {
    const { subreddit, sort, timeframe } = page.values

    if (!sort) {
      return { kind: 'subreddit', subreddit }
    }

    return {
      kind: 'subreddit',
      subreddit,
      sort: sort.toLowerCase(),
      timeframe: timeframe?.toLowerCase(),
    }
  }

  if (page.key === 'multireddit') {
    const { username, multireddit } = page.values

    return { kind: 'multireddit', username, multireddit }
  }

  if (page.key === 'submitted') {
    return { kind: 'submitted', username: page.values.username }
  }

  if (page.key === 'user-post') {
    return { kind: 'userPost', username: page.values.username, postId: page.values.postId }
  }

  if (page.key === 'comments') {
    return { kind: 'comments', username: page.values.username }
  }

  return { kind: 'user', username: page.values.username }
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
