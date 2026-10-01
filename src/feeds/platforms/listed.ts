import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ListedUrl = { kind: 'blog'; username: string }

const hosts = ['listed.to', 'www.listed.to']
const userRegex = /^\/@([^/]+)/

export const parseListedUrl = (url: string): ListedUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const username = new URL(url).pathname.match(userRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'blog', username }
}

export const listedHandler: PlatformHandler = {
  match: (url) => {
    return parseListedUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseListedUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://listed.to/@${parsed.username}/feed.rss`,
        hint: composeHint('listed:blog'),
      },
    ]
  },
}
