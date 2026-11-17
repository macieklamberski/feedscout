import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: podcast.
// Handler needed for: latest.

export type CaptivateUrl = { kind: 'show'; slug: string }

const domains = ['captivate.fm']

// The feed URL without the trailing slash answers 301.
const feeds = definePlatformFeeds(
  'captivate',
  [
    {
      key: 'podcast',
      main: 'https://feeds.captivate.fm/{slug}/',
      aliases: [
        // `/feed` on a show's own host answers 302 to its feed on feeds.captivate.fm.
        '{scheme}://{host}/feed',
      ],
    },
    // Every show serves its newest episode alone at `latest`. A network's feed sits under `n`, and
    // a collection of a show's episodes under its own name, so the collection row comes last.
    { key: 'latest', main: 'https://feeds.captivate.fm/{slug}/latest/' },
    { key: 'network', main: 'https://feeds.captivate.fm/n/{network}/' },
    { key: 'collection', main: 'https://feeds.captivate.fm/{slug}/{collection}/' },
    // A private feed for one listener, under tokens no page gives, is claimed and never built.
    { key: 'private', main: 'https://private.captivate.fm/{show}/{listener}' },
  ],
  { hosts: { tenants: domains } },
)

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
      feeds.getFeedEntry('podcast', { slug: parsed.slug }),
      feeds.getFeedEntry('latest', { slug: parsed.slug }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
