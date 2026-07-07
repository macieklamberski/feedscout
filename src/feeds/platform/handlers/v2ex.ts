import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// V2EX publishes four Atom feed surfaces documented at `blog.v2ex.com/rss/`:
// `/index.xml`, `/feed/{node}.xml`, `/feed/member/{name}.xml` and
// `/feed/tab/{tab}.xml`, all served at `www.v2ex.com` (apex 301s to www).
// The handler translates the in-app URL shapes (`/go/{node}`,
// `/member/{name}`, `/?tab={tab}`, root) onto those canonical Atom feeds so
// users do not have to recall the `/feed/...xml` paths.

const nodeRegex = /^\/go\/([^/]+)/
const memberRegex = /^\/member\/([^/]+)/

const hosts = ['www.v2ex.com', 'v2ex.com']

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
          uri: `https://www.v2ex.com/feed/${nodeMatch[1]}.xml`,
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
