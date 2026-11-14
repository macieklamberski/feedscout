import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type CsdnUrl = { kind: 'blog'; username: string }

const hosts = ['blog.csdn.net']
const feedHosts = ['rss.csdn.net', 'blog.csdn.net']

const userRegex = /^\/([^/]+)/

// blog.csdn.net serves the feed of rss.csdn.net under the same path, and redirects `rss/list`
// to it.
const feeds = definePlatformFeeds(
  [
    { key: 'csdn:blog', template: '{scheme}://{host}/{username}/rss/map' },
    { key: 'csdn:blog', template: 'https://blog.csdn.net/{username}/rss/list', isAlias: true },
  ],
  { hosts: feedHosts },
)

export const parseCsdnUrl = (url: string): CsdnUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const username = new URL(url).pathname.match(userRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'blog', username }
}

export const csdnHandler: PlatformHandler = {
  match: (url) => {
    return parseCsdnUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCsdnUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const { username } = parsed

    return [page.getFeedEntry('csdn:blog', { host: 'rss.csdn.net', username })]
  },

  getFeedHint: feeds.getFeedHint,
}
