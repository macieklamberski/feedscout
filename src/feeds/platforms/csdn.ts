import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type CsdnUrl = { kind: 'blog'; username: string }

const hosts = ['blog.csdn.net']

const userRegex = /^\/([^/]+)/

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

    if (!parsed) {
      return []
    }

    return [
      {
        uri: [
          `https://rss.csdn.net/${parsed.username}/rss/map`,
          `https://blog.csdn.net/${parsed.username}/rss/list`,
        ],
        hint: composeHint('csdn:blog'),
      },
    ]
  },
}
