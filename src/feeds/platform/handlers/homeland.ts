import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Homeland serves a topics feed at `/topics/feed` and a per-node feed at
// `/topics/node{id}/feed`.
//
// There is no per-user feed.

const nodePathRegex = /\/topics\/(node\d+)/

export const isHomelandHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Homeland')
}

export const homelandHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isHomelandHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const node = pathname.match(nodePathRegex)?.[1]
      const uris: Array<DiscoverUriEntry> = []

      if (node) {
        uris.push({
          uri: `${origin}/topics/${node}/feed`,
          hint: composeHint('homeland:node'),
        })
      }

      uris.push({ uri: `${origin}/topics/feed`, hint: composeHint('homeland:topics') })

      return uris
    } catch {}

    return []
  },
}
