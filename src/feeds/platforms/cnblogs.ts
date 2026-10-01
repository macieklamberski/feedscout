import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CnblogsUrl = { kind: 'blog'; username: string }

const hosts = ['cnblogs.com', 'www.cnblogs.com']
const excludedPaths = ['news', 'aggsite', 'question', 'ing', 'search', 'kb', 'sitehome', 'util']

export const parseCnblogsUrl = (url: string): CnblogsUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'blog', username }
}

export const cnblogsHandler: PlatformHandler = {
  match: (url) => {
    return parseCnblogsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCnblogsUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/${parsed.username}/rss`, hint: composeHint('cnblogs:posts') }]
  },
}
