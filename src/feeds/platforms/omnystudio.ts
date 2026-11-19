import { omnystudio } from 'feedintel'
import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type OmnystudioUrl =
  | { kind: 'show'; show: string }
  | { kind: 'playlist'; show: string; playlist: string }

const hosts = omnystudio.hosts.exact

const showPathRegex = /^\/shows\/([^/]+)(?:\/playlists\/([^/]+))?/i

const feeds = withHintLabels(omnystudio.feeds)

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
        feeds.getFeedEntry('playlist', { show: parsed.show, playlist: parsed.playlist }),
        feeds.getFeedEntry('show', { show: parsed.show }),
      ]
    }

    return [feeds.getFeedEntry('show', { show: parsed.show })]
  },

  getFeedHint: feeds.getFeedHint,
}
