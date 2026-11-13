import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type OmnystudioUrl = { kind: 'show'; show: string }

const hosts = ['omny.fm', 'www.omny.fm']

const showPathRegex = /^\/shows\/([^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'omnystudio:show', template: 'https://omny.fm/shows/{show}/playlists/podcast.rss' },
  {
    key: 'omnystudio:show',
    template: 'https://www.omnycontent.com/d/playlist/{orgId}/{programId}/{playlistId}/podcast.rss',
  },
  // A feed carrying an access token is private to its subscriber, so it is claimed and never built.
  {
    key: 'omnystudio:show',
    template: 'https://omny.fm/shows/{show}/playlists/podcast.rss?accessToken={token}',
  },
  {
    key: 'omnystudio:show',
    template:
      'https://www.omnycontent.com/d/playlist/{orgId}/{programId}/{playlistId}/podcast.rss?accessToken={token}',
  },
])

export const parseOmnystudioUrl = (url: string): OmnystudioUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const show = parsedUrl.pathname.match(showPathRegex)?.[1]

  if (!show) {
    return
  }

  return { kind: 'show', show }
}

export const omnystudioHandler: PlatformHandler = {
  match: (url) => {
    return parseOmnystudioUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseOmnystudioUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('omnystudio:show', { show: parsed.show })]
  },

  getFeedHint: feeds.getFeedHint,
}
