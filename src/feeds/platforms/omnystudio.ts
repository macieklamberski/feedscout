import { omnystudio } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type OmnystudioUrl =
  | { kind: 'show'; show: string }
  | { kind: 'playlist'; show: string; playlist: string }

const feeds = withHintLabels(omnystudio.feeds)

export const parseOmnystudioUrl = (url: string): OmnystudioUrl | undefined => {
  const page = omnystudio.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'playlist') {
    return { kind: 'playlist', show: page.params.show, playlist: page.params.playlist }
  }

  return { kind: 'show', show: page.params.show }
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
