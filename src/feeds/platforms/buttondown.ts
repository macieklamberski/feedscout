import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ButtondownUrl = { kind: 'newsletter'; username: string }

const hosts = ['buttondown.com', 'www.buttondown.com', 'buttondown.email', 'www.buttondown.email']

// The legacy buttondown.email host redirects each feed to the same path on buttondown.com.
const feeds = definePlatformFeeds([
  { key: 'buttondown:newsletter', template: 'https://buttondown.com/{username}/rss' },
  { key: 'buttondown:newsletter', template: 'https://buttondown.email/{username}/rss' },
])

export const parseButtondownUrl = (url: string): ButtondownUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username) {
    return
  }

  return { kind: 'newsletter', username }
}

export const buttondownHandler: PlatformHandler = {
  match: (url) => {
    return parseButtondownUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseButtondownUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('buttondown:newsletter', { username: parsed.username })]
  },

  getFeedKey: feeds.getFeedKey,
}
