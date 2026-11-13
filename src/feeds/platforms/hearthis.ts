import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type HearthisUrl = { kind: 'profile'; username: string }

const hosts = ['hearthis.at', 'www.hearthis.at']

const feeds = definePlatformFeeds([
  { key: 'hearthis:new-tracks', template: 'https://hearthis.at/new_tracks.rss' },
  { key: 'hearthis:tracks', template: 'https://hearthis.at/{username}/podcast/' },
  // The same feed, byte for byte, under a second spelling.
  { key: 'hearthis:tracks', template: 'https://hearthis.at/{username}/podcast.xml' },
  // A set's feed, which its page links. The set id is not in the page URL. Any one segment after
  // `podcast/`, such as `feed/` or `.rss/`, serves the same items.
  { key: 'hearthis:set', template: 'https://hearthis.at/set/{setId}/podcast/' },
  { key: 'hearthis:set', template: 'https://hearthis.at/set/{setId}/podcast/{spelling}/' },
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

  getFeedHint: feeds.getFeedHint,
}
