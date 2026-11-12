import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers comic (html).
// Handler needed for: user.

export type AcomicsUrl = { kind: 'comic'; comic: string } | { kind: 'user'; username: string }

const hosts = ['acomics.ru', 'www.acomics.ru']

const feeds = definePlatformFeeds([
  { key: 'acomics:issues', template: 'https://acomics.ru/~{comic}/rss' },
  { key: 'acomics:subscriptions', template: 'https://acomics.ru/-{username}/rss' },
])

// A comic lives under /~{comic} and a user under /-{user}, and both keep their case in the feed
// URL, since /~oglaf/rss answers 404 where /~Oglaf/rss serves the comic.
export const parseAcomicsUrl = (url: string): AcomicsUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [comicOrUser] = getPathSegments(url)

  // length: keeps a bare ~ or - with no name after it out
  if (!comicOrUser || comicOrUser.length < 2) {
    return
  }

  if (comicOrUser.startsWith('~')) {
    return { kind: 'comic', comic: comicOrUser.slice(1) }
  }

  if (comicOrUser.startsWith('-')) {
    return { kind: 'user', username: comicOrUser.slice(1) }
  }
}

export const acomicsHandler: PlatformHandler = {
  match: (url) => {
    return parseAcomicsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAcomicsUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'comic') {
      return [feeds.getFeedEntry('acomics:issues', { comic: parsed.comic })]
    }

    return [feeds.getFeedEntry('acomics:subscriptions', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
