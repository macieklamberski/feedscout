import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type CnblogsUrl = { kind: 'blog'; username: string }

const hosts = ['cnblogs.com', 'www.cnblogs.com']
const feedHosts = ['feed.cnblogs.com']

const feeds = definePlatformFeeds([
  { key: 'cnblogs:posts', template: 'https://www.cnblogs.com/{username}/rss' },
  // The posts feed answers 302 to this spelling, under the blog's numeric id.
  { key: 'cnblogs:posts', template: 'https://feed.cnblogs.com/blog/u/{blogId}/rss' },
])

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

    return [feeds.getFeedEntry('cnblogs:posts', { username: parsed.username })]
  },

  // The table reads any first segment as a name, so the page parser refuses a dotted one first:
  // www.cnblogs.com/skins.aspx/rss answers 404.
  getFeedKey: (url) => {
    // The feed host serves feeds only, so its URLs skip the page parser.
    if (isHostOf(url, feedHosts)) {
      return feeds.getFeedKey(url)
    }

    if (!parseCnblogsUrl(url)) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
