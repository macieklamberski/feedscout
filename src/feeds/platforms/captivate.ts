import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CaptivateUrl = { kind: 'show'; slug: string }

const domains = ['captivate.fm']

// The feed URL without the trailing slash answers 301.
const feeds = definePlatformFeeds([
  { key: 'captivate:podcast', template: 'https://feeds.captivate.fm/{slug}/' },
  // Every show serves its newest episode alone at `latest`. A network's feed sits under `n`, and a
  // collection of a show's episodes under its own name, so the collection row comes last.
  { key: 'captivate:latest', template: 'https://feeds.captivate.fm/{slug}/latest/' },
  { key: 'captivate:network', template: 'https://feeds.captivate.fm/n/{network}/' },
  { key: 'captivate:collection', template: 'https://feeds.captivate.fm/{slug}/{collection}/' },
  // A private feed for one listener, under tokens no page gives, so it is claimed and never built.
  { key: 'captivate:podcast', template: 'https://private.captivate.fm/{show}/{listener}' },
])

export const parseCaptivateUrl = (url: string): CaptivateUrl | undefined => {
  const slug = getTenantSubdomain(url, domains)

  if (!slug) {
    return
  }

  return { kind: 'show', slug }
}

export const captivateHandler: PlatformHandler = {
  match: (url) => {
    return parseCaptivateUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCaptivateUrl(url)

    if (!parsed) {
      return []
    }

    return [
      feeds.getFeedEntry('captivate:podcast', { slug: parsed.slug }),
      feeds.getFeedEntry('captivate:latest', { slug: parsed.slug }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
