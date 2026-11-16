import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home (html), partly covers user.

export type BangumiUrl = { kind: 'user'; username: string } | { kind: 'home' }

// chii.in serves the same site, but answers a plain fetch of its feeds with a Cloudflare challenge,
// so its pages get the bgm.tv feeds.
const challengedHosts = ['chii.in']
const hosts = ['bgm.tv', 'bangumi.tv', ...challengedHosts]

const userRegex = /^\/user\/([^/]+)/i

const feeds = definePlatformFeeds(
  [
    { key: 'bangumi:collections', template: '{scheme}://{host}/feed/user/{username}/interests' },
    { key: 'bangumi:timeline', template: '{scheme}://{host}/feed/user/{username}/timeline' },
    { key: 'bangumi:blog', template: '{scheme}://{host}/feed/blog/all' },
  ],
  { hosts },
)

export const parseBangumiUrl = (url: string): BangumiUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const username = parsedUrl.pathname.match(userRegex)?.[1]

  if (!username) {
    return { kind: 'home' }
  }

  return { kind: 'user', username }
}

export const bangumiHandler: PlatformHandler = {
  match: (url) => {
    return parseBangumiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBangumiUrl(url)
    const pageFeeds = feeds.forUrl(isHostOf(url, challengedHosts) ? 'https://bgm.tv/' : url)

    if (!parsed || !pageFeeds) {
      return []
    }

    if (parsed.kind === 'user') {
      return [
        pageFeeds.getFeedEntry('bangumi:collections', { username: parsed.username }),
        pageFeeds.getFeedEntry('bangumi:timeline', { username: parsed.username }),
      ]
    }

    return [pageFeeds.getFeedEntry('bangumi:blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
