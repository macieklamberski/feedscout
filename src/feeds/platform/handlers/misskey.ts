import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Misskey exposes per-profile feeds at `{instance}/@{user}.{atom,rss,json}` — the
// only feed routes registered by upstream `ClientServerService.ts` and built by
// `FeedService.ts`. The handler is content-keyed via the `application-name=Misskey`
// meta tag (instances are not enumerable by host) and emits all three format
// variants for the same profile path; there are no per-tag, channel, antenna, or
// timeline feed routes upstream.

const profileRegex = /^\/@([^/.]+)/

export const isMisskeyHtml = (content: string): boolean => {
  return hasMetaContent(content, 'application-name', 'Misskey')
}

export const misskeyHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isMisskeyHtml(content)) {
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
          uri: `${origin}/@${match[1]}.atom`,
          hint: composeHint('misskey:posts-atom'),
        },
        {
          uri: `${origin}/@${match[1]}.rss`,
          hint: composeHint('misskey:posts-rss'),
        },
        {
          uri: `${origin}/@${match[1]}.json`,
          hint: composeHint('misskey:posts-json'),
        },
      ]
    } catch {}

    return []
  },
}
