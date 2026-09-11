import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Publii writes a feed to `/feed.xml` and a JSON Feed to `/feed.json` on every
// site it builds. The theme decides whether either is linked, so the vendor's
// own site advertises neither.
//
// `/feed.xml` is Atom despite the name.

export const isPubliiHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Publii')
}

export const publiiHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isPubliiHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)

      return [
        { uri: `${origin}/feed.xml`, hint: composeHint('publii:posts') },
        { uri: `${origin}/feed.json`, hint: composeHint('publii:posts-json') },
      ]
    } catch {}

    return []
  },
}
