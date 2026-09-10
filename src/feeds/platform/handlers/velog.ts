import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

const hosts = ['velog.io', 'www.velog.io']
const userRegex = /^\/@([^/]+)/

export const velogHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const userMatch = pathname.match(userRegex)

    if (userMatch?.[1]) {
      return [
        {
          uri: `https://v2.velog.io/rss/${userMatch[1]}`,
          hint: composeHint('velog:posts'),
        },
      ]
    }

    // Homepage: trending posts feed.
    if (pathname === '/' || pathname === '') {
      return [
        {
          uri: 'https://v2.velog.io/rss',
          hint: composeHint('velog:trending'),
        },
      ]
    }

    return []
  },
}
