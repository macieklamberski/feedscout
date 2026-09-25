import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Unmeasured, no public page.

const hosts = ['omny.fm', 'www.omny.fm']
const showPathRegex = /^\/shows\/([^/]+)/

export const omnystudioHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) && showPathRegex.test(new URL(url).pathname)
  },

  resolve: (url) => {
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
  },
}
