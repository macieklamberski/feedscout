import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// An Omny Studio show serves its feed at `/playlists/podcast.rss`, which 302s
// to a three-part identifier path on omnycontent.com.
//
// A show whose page answers 404 can still resolve through the `.rss` shortcut,
// so derive from the URL rather than reading the page.

const hosts = ['omny.fm', 'www.omny.fm']
const showPathRegex = /^\/shows\/([^/]+)/

export const omnystudioHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) && showPathRegex.test(new URL(url).pathname)
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const slug = pathname.match(showPathRegex)?.[1]

      if (!slug) {
        return []
      }

      return [
        {
          uri: `${origin}/shows/${slug}/playlists/podcast.rss`,
          hint: composeHint('omnystudio:show'),
        },
      ]
    } catch {}

    return []
  },
}
