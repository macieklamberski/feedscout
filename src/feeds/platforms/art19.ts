import { art19 } from 'feedintel'
import { isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { uuidRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type Art19Url = { kind: 'show'; slug: string }

const hosts = art19.hosts.exact

const showPathRegex = /^\/shows\/([^/]+)/i

const feeds = withHintLabels(art19.feeds)

export const parseArt19Url = (url: string): Art19Url | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const slug = new URL(url).pathname.match(showPathRegex)?.[1]

  // A show page also answers under the show's uuid, and rss.art19.com serves a feed only under the
  // slug, which the page alone names.
  if (!slug || uuidRegex.test(slug)) {
    return
  }

  return { kind: 'show', slug }
}

export const art19Handler: PlatformHandler = {
  match: (url) => {
    return parseArt19Url(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseArt19Url(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('show', { slug: parsed.slug })]
  },

  getFeedHint: feeds.getFeedHint,
}
