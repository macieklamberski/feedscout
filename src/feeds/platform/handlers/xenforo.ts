import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.

const forumPathRegex = /\/f\/([^/]+\.\d+)/

// XF2 puts `id="XF"` on the html element and XF1 put `id="XenForo"` there.
const appRootMarkers = ['id="XF"', 'id="XenForo"']

export const isXenforoHtml = (content: string): boolean => {
  return appRootMarkers.some((marker) => content.includes(marker))
}

export const xenforoHandler: PlatformHandler = {
  match: (url, content) => {
    return Boolean(parseUrl(url)) && Boolean(content) && isXenforoHtml(content ?? '')
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin, pathname } = parsedUrl
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
  },
}
