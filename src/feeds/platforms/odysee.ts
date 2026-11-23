import { odysee } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: videos.

export type OdyseeUrl = { kind: 'channel'; name: string; claimId?: string }

const feeds = withHintLabels(odysee.feeds)

export const parseOdyseeUrl = (url: string): OdyseeUrl | undefined => {
  const page = odysee.pages.read(url)

  if (!page) {
    return
  }

  const { name, claimId } = page.params

  return { kind: 'channel', name, claimId }
}

export const odyseeHandler: PlatformHandler = {
  // The feed answers "Invalid URL" for a channel without its claim ID.
  match: (url) => {
    return parseOdyseeUrl(url)?.claimId !== undefined
  },

  resolve: (url) => {
    const parsed = parseOdyseeUrl(url)

    if (!parsed?.claimId) {
      return []
    }

    return [feeds.getFeedEntry('videos', { name: parsed.name, claimId: parsed.claimId })]
  },

  getFeedHint: feeds.getFeedHint,
}
