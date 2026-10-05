import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type RakutenBlogUrl = { kind: 'blog'; username: string }

const hosts = ['plaza.rakuten.co.jp']

const excludedPaths = ['_css', 'acc', 'dac', 'evt', 'img', 'inc', 'rnd', 'thm']

export const parseRakutenBlogUrl = (url: string): RakutenBlogUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'blog', username: username.toLowerCase() }
}

export const rakutenBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseRakutenBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseRakutenBlogUrl(url)

    if (!parsed) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `https://api.plaza.rakuten.ne.jp/${parsed.username}/rss/`,
      hint: composeHint('rakuten-blog:posts'),
    })

    return uris
  },
}
