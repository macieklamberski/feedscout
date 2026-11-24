import { atypon } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Unmeasured, bot wall.

export type AtyponUrl = { kind: 'journal'; code: string; isWiley: boolean }

const feeds = withHintLabels(atypon.feeds)

export const parseAtyponUrl = (url: string): AtyponUrl | undefined => {
  const page = atypon.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'journal', code: page.params.code, isWiley: page.key === 'wiley-journal' }
}

export const atyponHandler: PlatformHandler = {
  match: (url) => {
    return parseAtyponUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAtyponUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.isWiley) {
      return [
        page.getFeedEntry('journal', { code: parsed.code }, 'rss'),
        page.getFeedEntry('ahead-of-print', { code: parsed.code }, 'rdf'),
        page.getFeedEntry('most-cited', { code: parsed.code }, 'rss'),
      ]
    }

    return [
      page.getFeedEntry('journal', { code: parsed.code }, 'rdf'),
      page.getFeedEntry('ahead-of-print', { code: parsed.code }, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
