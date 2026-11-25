import { mailArchive } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: list.

export type MailArchiveUrl = { kind: 'list'; list: string }

const feeds = withHintLabels(mailArchive.feeds)

export const parseMailArchiveUrl = (url: string): MailArchiveUrl | undefined => {
  const page = mailArchive.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'list', list: page.values.list }
}

export const mailArchiveHandler: PlatformHandler = {
  match: (url) => {
    return parseMailArchiveUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMailArchiveUrl(url)
    const pageFeeds = feeds.forSite(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    return [
      pageFeeds.getFeedEntry('list', { list: parsed.list }, 'rss'),
      pageFeeds.getFeedEntry('list', { list: parsed.list }, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
