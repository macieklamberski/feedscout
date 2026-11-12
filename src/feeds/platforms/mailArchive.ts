import { decodeSegment, getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers list (html).
// Handler needed for: message.

export type MailArchiveUrl = { kind: 'list'; list: string }

const hosts = ['mail-archive.com', 'www.mail-archive.com']

const feeds = definePlatformFeeds(
  [{ key: 'mail-archive:list', template: '{scheme}://{host}/{list}/maillist.xml' }],
  { hosts },
)

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

    if (!parsed) {
      return []
    }

    const { protocol, host } = new URL(url)
    const params = { scheme: protocol.slice(0, -1), host, list: parsed.list }

    return [feeds.getFeedEntry('mail-archive:list', params)]
  },

  // The table reads any first segment as a list, so a segment without `@`, a page of the site, is
  // refused by the page parser first.
  getFeedKey: (url) => {
    if (!parseMailArchiveUrl(url)) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
