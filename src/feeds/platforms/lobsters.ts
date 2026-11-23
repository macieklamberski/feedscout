import { lobsters } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: domain, stories, tag, top.
// Handler needed for: comments, newest.

export type LobstersUrl =
  | { kind: 'tag'; tags: string }
  | { kind: 'domain'; domain: string }
  | { kind: 'user'; username: string }
  | { kind: 'top'; period?: string }
  | { kind: 'newest' }
  | { kind: 'comments' }
  | { kind: 'home' }

const feeds = withHintLabels(lobsters.feeds)

export const parseLobstersUrl = (url: string): LobstersUrl | undefined => {
  const page = lobsters.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tags: page.params.tags }
  }

  if (page.key === 'domain') {
    return { kind: 'domain', domain: page.params.domain }
  }

  if (page.key === 'user') {
    return { kind: 'user', username: page.params.username }
  }

  if (page.key === 'top') {
    return { kind: 'top', period: page.params.period }
  }

  if (page.key === 'newest') {
    return { kind: 'newest' }
  }

  if (page.key === 'comments') {
    return { kind: 'comments' }
  }

  return { kind: 'home' }
}

export const lobstersHandler: PlatformHandler = {
  match: (url) => {
    return parseLobstersUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLobstersUrl(url)

    if (!parsed) {
      return []
    }

    // The site-wide stories, newest and comments feeds need no value from the page, so every page
    // builds them after its own feeds.
    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('tag', { tags: parsed.tags }),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('newest'),
        feeds.getFeedEntry('comments'),
      ]
    }

    if (parsed.kind === 'domain') {
      return [
        feeds.getFeedEntry('domain', { domain: parsed.domain }),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('newest'),
        feeds.getFeedEntry('comments'),
      ]
    }

    if (parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('user-stories', { username: parsed.username }),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('newest'),
        feeds.getFeedEntry('comments'),
      ]
    }

    // The top page without a period redirects to the one-week page.
    if (parsed.kind === 'top') {
      return [
        feeds.getFeedEntry('top', { period: parsed.period ?? '1w' }),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('newest'),
        feeds.getFeedEntry('comments'),
      ]
    }

    if (parsed.kind === 'newest') {
      return [
        feeds.getFeedEntry('newest'),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('comments'),
      ]
    }

    if (parsed.kind === 'comments') {
      return [
        feeds.getFeedEntry('comments'),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('newest'),
      ]
    }

    return [
      feeds.getFeedEntry('stories'),
      feeds.getFeedEntry('newest'),
      feeds.getFeedEntry('comments'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
