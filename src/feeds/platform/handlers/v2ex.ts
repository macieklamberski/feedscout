import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

const nodePattern = /^\/go\/([^/]+)/
const memberPattern = /^\/member\/([^/]+)/

const hosts = ['www.v2ex.com', 'v2ex.com']

export const v2exHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname, searchParams } = new URL(url)

    // Node page: /go/{node}
    const nodeMatch = pathname.match(nodePattern)

    if (nodeMatch?.[1]) {
      return [
        {
          uri: `https://www.v2ex.com/feed/${nodeMatch[1]}.xml`,
          hint: composeHint('v2ex:node'),
        },
      ]
    }

    // Member page: /member/{username}
    const memberMatch = pathname.match(memberPattern)

    if (memberMatch?.[1]) {
      return [
        {
          uri: `https://www.v2ex.com/feed/member/${memberMatch[1]}.xml`,
          hint: composeHint('v2ex:member'),
        },
      ]
    }

    // Tab page: /?tab={tab}
    const tab = searchParams.get('tab')

    if (tab) {
      return [
        {
          uri: `https://www.v2ex.com/feed/tab/${tab}.xml`,
          hint: composeHint('v2ex:tab'),
        },
      ]
    }

    // Root page.
    if (pathname === '/' || pathname === '') {
      return [
        {
          uri: 'https://www.v2ex.com/index.xml',
          hint: composeHint('v2ex:index'),
        },
      ]
    }

    return []
  },
}
