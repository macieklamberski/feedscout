import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const forumIdRegex = /[?&]f=(\d+)/
const scriptSegmentRegex = /\/[^/]*\.php$/
const trailingSlashRegex = /\/$/

export const isPhpbbHtml = (content: string): boolean => {
  return content.includes('id="phpbb"')
}

// phpBB sets `{name}_u`, `{name}_k` and `{name}_sid`, where the board picks the name.
export const isPhpbbHeaders = (headers: Headers): boolean => {
  const names = getCookieNames(headers)

  return names.some((name) => {
    if (!name.endsWith('_sid')) {
      return false
    }

    const prefix = name.slice(0, -'_sid'.length)

    return names.includes(`${prefix}_u`) && names.includes(`${prefix}_k`)
  })
}

export const phpbbHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!URL.canParse(url)) {
      return false
    }

    if (content && isPhpbbHtml(content)) {
      return true
    }

    if (headers && isPhpbbHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
    const { origin, pathname, search } = new URL(url)
    // A board is routinely mounted under a sub-path such as `/community`.
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
  },
}
