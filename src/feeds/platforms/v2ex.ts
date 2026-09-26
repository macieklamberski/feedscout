import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['www.v2ex.com', 'v2ex.com']

const nodeRegex = /^\/go\/([^/]+)/i
const memberRegex = /^\/member\/([^/]+)/i

export const v2exHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname, searchParams } = new URL(url)

    // Node page: /go/{node}
    const nodeMatch = pathname.match(nodeRegex)

    if (nodeMatch?.[1]) {
      return [
        {
          // V2EX serves node feeds in lowercase only: /feed/Python.xml answers 404.
          uri: `https://www.v2ex.com/feed/${nodeMatch[1].toLowerCase()}.xml`,
          hint: composeHint('v2ex:node'),
        },
      ]
    }

    // Member page: /member/{username}
    const memberMatch = pathname.match(memberRegex)

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
          // V2EX serves tab feeds in lowercase only: /feed/tab/TECH.xml answers 404.
          uri: `https://www.v2ex.com/feed/tab/${tab.toLowerCase()}.xml`,
          hint: composeHint('v2ex:tab'),
        },
        { uri: 'https://www.v2ex.com/index.xml', hint: composeHint('v2ex:index') },
      ]
    }

    // Root page.
    if (pathname === '/') {
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
