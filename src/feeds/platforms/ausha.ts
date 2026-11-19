import { ausha } from 'feedintel'
import { getPathSegments, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: podcast.

export type AushaUrl = { kind: 'show' }
export type AushaPage = { kind: 'show'; feedId: string }

const hosts = ausha.hosts.exact

// The feed id is opaque: show and episode pages carry it only in the markup.
const feedIdRegex = /feed\.ausha\.co\/(\w+)/i

const feeds = withHintLabels(ausha.feeds)

export const parseAushaUrl = (url: string): AushaUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [slug] = getPathSegments(url)

  if (!slug) {
    return
  }

  return { kind: 'show' }
}

export const getAushaPage = (url: string, content: string | undefined): AushaPage | undefined => {
  const parsed = parseAushaUrl(url)
  const feedId = content?.match(feedIdRegex)?.[1]

  if (!parsed || !feedId) {
    return
  }

  return { kind: 'show', feedId }
}

export const aushaHandler: PlatformHandler = {
  match: (url) => {
    return parseAushaUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getAushaPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { feedId: page.feedId })]
  },

  getFeedHint: feeds.getFeedHint,
}
