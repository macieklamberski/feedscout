import { atwiki } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type AtwikiUrl = { kind: 'wiki'; wiki: string }

const feeds = withHintLabels(atwiki.feeds)

export const parseAtwikiUrl = (url: string): AtwikiUrl | undefined => {
  const page = atwiki.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'wiki', wiki: page.values.wiki }
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
