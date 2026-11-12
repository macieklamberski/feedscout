import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type HearthisUrl = { kind: 'profile'; username: string }

const hosts = ['hearthis.at', 'www.hearthis.at']

// Pages that take a genre as their second segment: hearthis.at/categories/podcast/ is a page.
const genreRoutes = ['categories', 'tags', 'artists', 'maps']

const feeds = definePlatformFeeds([
  { key: 'hearthis:new-tracks', template: 'https://hearthis.at/new_tracks.rss' },
  { key: 'hearthis:tracks', template: 'https://hearthis.at/{username}/podcast/' },
])

export const parseHearthisUrl = (url: string): HearthisUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const hearthisHandler: PlatformHandler = {
  match: (url) => {
    return parseHearthisUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHearthisUrl(url)

    if (!parsed) {
      return []
    }

    return [
      feeds.getFeedEntry('hearthis:tracks', { username: parsed.username }),
      feeds.getFeedEntry('hearthis:new-tracks'),
    ]
  },

  getFeedKey: (url) => {
    const [route] = getPathSegments(url)

    if (isAnyOf(route, genreRoutes)) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
