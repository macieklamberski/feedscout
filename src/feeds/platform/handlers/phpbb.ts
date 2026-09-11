import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// phpBB serves a board feed at `{board}/feed.php` and a per-forum feed at
// `?f={id}`.
//
// A board is routinely mounted under a sub-path such as `/community`, so the
// feed is built from the directory holding the script and never from the
// origin.
//
// The feeds are an administrator toggle, so an install can carry the marker and
// answer 404 for the feed.

const forumIdRegex = /[?&]f=(\d+)/
const scriptSegmentRegex = /\/[^/]*\.php$/
const trailingSlashRegex = /\/$/

export const isPhpbbHtml = (content: string): boolean => {
  return content.includes('id="phpbb"')
}

export const phpbbHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isPhpbbHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin, pathname, search } = new URL(url)
      const boardPath = pathname.replace(scriptSegmentRegex, '').replace(trailingSlashRegex, '')
      const boardUrl = `${origin}${boardPath}`
      const forumId = search.match(forumIdRegex)?.[1]
      const uris: Array<DiscoverUriEntry> = []

      if (forumId) {
        uris.push({
          uri: `${boardUrl}/feed.php?f=${forumId}`,
          hint: composeHint('phpbb:forum'),
        })
      }

      uris.push({ uri: `${boardUrl}/feed.php`, hint: composeHint('phpbb:site') })

      return uris
    } catch {}

    return []
  },
}
