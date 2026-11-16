import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type OmnystudioUrl =
  | { kind: 'show'; show: string }
  | { kind: 'playlist'; show: string; playlist: string }

const hosts = ['omny.fm', 'www.omny.fm']

const showPathRegex = /^\/shows\/([^/]+)(?:\/playlists\/([^/]+))?/i

const feeds = definePlatformFeeds([
  { key: 'omnystudio:show', template: 'https://omny.fm/shows/{show}/playlists/podcast.rss' },
  // Every show feed answers 302 to its playlist here. A named playlist redirects here too, and no
  // URL tells it apart from the show's own.
  {
    key: 'omnystudio:show',
    template: 'https://www.omnycontent.com/d/playlist/{orgId}/{programId}/{playlistId}/podcast.rss',
    isAlias: true,
  },
  { key: 'omnystudio:playlist', template: 'https://omny.fm/shows/{show}/playlists/{playlist}.rss' },
])

export const parseOmnystudioUrl = (url: string): OmnystudioUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [, show, playlist] = parsedUrl.pathname.match(showPathRegex) ?? []

  if (!show) {
    return
  }

  // The show's own playlist, whose feed is the show feed.
  if (playlist && !isAnyOf(playlist, 'podcast')) {
    return { kind: 'playlist', show, playlist }
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

    // Playlist page: omny.fm/shows/{show}/playlists/{playlist}.
    if (parsed.kind === 'playlist') {
      return [
        feeds.getFeedEntry('omnystudio:playlist', { show: parsed.show, playlist: parsed.playlist }),
        feeds.getFeedEntry('omnystudio:show', { show: parsed.show }),
      ]
    }

    return [feeds.getFeedEntry('omnystudio:show', { show: parsed.show })]
  },

  getFeedHint: feeds.getFeedHint,
  getSiblingFeeds: feeds.getSiblingFeeds,
}
