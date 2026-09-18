import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// XenForo serves a site feed at `/index.rss` and a per-forum feed at
// `/f/{slug}.{id}/index.rss`. A board links the site feed and not the per-forum
// one, so the per-forum case is what the handler adds.
//
// The forum path carries a numeric id after the slug and the id is required.
//
// A missing forum answers with an XML error document rather than HTML, so a
// check for "is this XML" passes on a 404.

const forumPathRegex = /\/f\/([^/]+\.\d+)/

// XF2 puts `id="XF"` on the html element and XF1 put `id="XenForo"` there.
const appRootMarkers = ['id="XF"', 'id="XenForo"']

export const isXenforoHtml = (content: string): boolean => {
  return appRootMarkers.some((marker) => content.includes(marker))
}

export const xenforoHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isXenforoHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const forumPath = pathname.match(forumPathRegex)?.[1]
      const uris: Array<DiscoverUriEntry> = []

      if (forumPath) {
        uris.push({
          uri: `${origin}/f/${forumPath}/index.rss`,
          hint: composeHint('xenforo:forum'),
        })
      }

      uris.push({ uri: `${origin}/index.rss`, hint: composeHint('xenforo:site') })

      return uris
    } catch {}

    return []
  },
}
