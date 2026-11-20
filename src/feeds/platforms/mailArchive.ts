import { mailArchive } from 'feedintel'
import { decodeSegment, getPathSegments, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: list.

export type MailArchiveUrl = { kind: 'list'; list: string }

const hosts = mailArchive.hosts.exact

const feeds = withHintLabels(mailArchive.feeds)

export const parseMailArchiveUrl = (url: string): MailArchiveUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [list] = getPathSegments(url)

  // A list is archived under its posting address, so the site's own pages carry no `@`. The address
  // stays as written, so a feed stored as `%40` keeps that spelling.
  if (!list || !decodeSegment(list)?.includes('@')) {
    return
  }

  return { kind: 'list', list }
}

export const mailArchiveHandler: PlatformHandler = {
  match: (url) => {
    return parseMailArchiveUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMailArchiveUrl(url)
    const pageFeeds = feeds.forUrl(url)

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
