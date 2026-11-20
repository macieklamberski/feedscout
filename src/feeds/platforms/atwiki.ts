import { atwiki } from 'feedintel'
import { getPathSegments, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type AtwikiUrl = { kind: 'wiki'; wiki: string }

// Legacy wwwNN.atwiki.jp hosts redirect every wiki path to w.atwiki.jp.
const hosts = atwiki.hosts.exact

const feeds = withHintLabels(atwiki.feeds)

export const parseAtwikiUrl = (url: string): AtwikiUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [wiki] = getPathSegments(url)

  if (!wiki) {
    return
  }

  return { kind: 'wiki', wiki }
}

export const atwikiHandler: PlatformHandler = {
  match: (url) => {
    return parseAtwikiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAtwikiUrl(url)

    if (!parsed) {
      return []
    }

    const { wiki } = parsed

    return [
      feeds.getFeedEntry('updated-pages', { wiki }, 'rdf'),
      feeds.getFeedEntry('updated-pages', { wiki }, 'atom'),
      feeds.getFeedEntry('new-pages', { wiki }, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
