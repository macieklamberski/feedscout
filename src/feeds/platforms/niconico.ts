import { niconico } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: blog, live, videos.

export type NiconicoUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'live'; channel: string }
  | { kind: 'blomaga'; channel: string }

const feeds = withHintLabels(niconico.feeds)

export const parseNiconicoUrl = (url: string): NiconicoUrl | undefined => {
  const page = niconico.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'live') {
    return { kind: 'live', channel: page.values.channel }
  }

  if (page.key === 'blomaga') {
    return { kind: 'blomaga', channel: page.values.channel }
  }

  return { kind: 'channel', channel: page.values.channel }
}

export const niconicoHandler: PlatformHandler = {
  match: (url) => {
    return parseNiconicoUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNiconicoUrl(url)

    if (!parsed) {
      return []
    }

    const params = { channel: parsed.channel }

    if (parsed.kind === 'live') {
      return [
        feeds.getFeedEntry('live', params),
        feeds.getFeedEntry('videos', params),
        feeds.getFeedEntry('blog', params),
      ]
    }

    if (parsed.kind === 'blomaga') {
      return [
        feeds.getFeedEntry('blog', params),
        feeds.getFeedEntry('videos', params),
        feeds.getFeedEntry('live', params),
      ]
    }

    return [
      feeds.getFeedEntry('videos', params),
      feeds.getFeedEntry('live', params),
      feeds.getFeedEntry('blog', params),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
