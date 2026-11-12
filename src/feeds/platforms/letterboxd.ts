import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type LetterboxdUrl = { kind: 'member'; username: string } | { kind: 'journal' }

const hosts = ['letterboxd.com', 'www.letterboxd.com']

const feeds = definePlatformFeeds([
  { key: 'letterboxd:journal', template: 'https://letterboxd.com/journal/rss/' },
  { key: 'letterboxd:diary', template: 'https://letterboxd.com/{username}/rss/' },
  { key: 'letterboxd:diary', template: 'https://embed.letterboxd.com/{username}/rss/' },
])

export const parseLetterboxdUrl = (url: string): LetterboxdUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  // The editorial Letterboxd Journal.
  if (isAnyOf(username, 'journal')) {
    return { kind: 'journal' }
  }

  // Letterboxd names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (!username || username.includes('.')) {
    return
  }

  return { kind: 'member', username }
}

export const letterboxdHandler: PlatformHandler = {
  match: (url) => {
    return parseLetterboxdUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLetterboxdUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'journal') {
      return [feeds.getFeedEntry('letterboxd:journal')]
    }

    return [feeds.getFeedEntry('letterboxd:diary', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
