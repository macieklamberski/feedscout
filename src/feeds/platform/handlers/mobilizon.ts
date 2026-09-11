import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Mobilizon serves an instance feed at `/feed/instance/atom` and a per-group
// feed at `/@{group}/feed/atom`.
//
// The page is a JavaScript shell, so the marker is the noscript notice, which
// is the only text the server renders on every page.

const groupPathRegex = /^\/@([^/]+)/

export const isMobilizonHtml = (content: string): boolean => {
  return content.includes("Mobilizon doesn't work properly without JavaScript")
}

export const mobilizonHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isMobilizonHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const group = pathname.match(groupPathRegex)?.[1]
      const uris: Array<DiscoverUriEntry> = []

      if (group) {
        uris.push({
          uri: `${origin}/@${group}/feed/atom`,
          hint: composeHint('mobilizon:group'),
        })
      }

      uris.push({
        uri: `${origin}/feed/instance/atom`,
        hint: composeHint('mobilizon:instance'),
      })

      return uris
    } catch {}

    return []
  },
}
