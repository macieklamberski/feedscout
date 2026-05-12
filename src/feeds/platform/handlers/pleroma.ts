import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Pleroma exposes per-profile feeds at `{instance}/users/{user}/feed.{atom,rss}`,
// served by `Feed.UserController` which whitelists those two formats; the bare
// `/users/{user}.atom` form 302-redirects to the canonical path. There are no
// per-status feed routes upstream, and tag feeds exist (`/tags/{tag}.{atom,rss}`)
// but have no human-facing HTML page to trigger discovery from. The handler is
// content-keyed via the `/api/pleroma/` marker (instances are not enumerable by
// host) and emits both Atom and RSS for each profile URL.

const profileRegex = /^\/users\/([^/]+)/
const pleromaApiRegex = /\/api\/pleroma\//i

export const isPleromaHtml = (content: string): boolean => {
  return pleromaApiRegex.test(content)
}

export const pleromaHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isPleromaHtml(content)) {
        return false
      }

      const { pathname } = new URL(url)

      return profileRegex.test(pathname)
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const match = pathname.match(profileRegex)

      if (!match?.[1]) {
        return []
      }

      return [
        {
          uri: `${origin}/users/${match[1]}/feed.atom`,
          hint: composeHint('pleroma:posts'),
        },
        {
          uri: `${origin}/users/${match[1]}/feed.rss`,
          hint: composeHint('pleroma:posts-rss'),
        },
      ]
    } catch {}

    return []
  },
}
