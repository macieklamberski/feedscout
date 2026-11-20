import { cnblogs } from 'feedintel'
import { getPathSegments, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type CnblogsUrl = { kind: 'blog'; username: string }

const hosts = cnblogs.hosts.exact

const feeds = withHintLabels(cnblogs.feeds)

export const parseCnblogsUrl = (url: string): CnblogsUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  // A dotted segment such as skins.aspx is a file of the site.
  if (!username || username.includes('.')) {
    return
  }

  return { kind: 'blog', username }
}

export const cnblogsHandler: PlatformHandler = {
  match: (url) => {
    return parseCnblogsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCnblogsUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('posts', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
