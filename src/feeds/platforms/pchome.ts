import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers paper (html), partly covers category.

export type PchomeUrl =
  | { kind: 'paper'; username: string }
  | { kind: 'category'; username: string; category: string }

const hosts = ['mypaper.pchome.com.tw', 'mypaper.m.pchome.com.tw']
const baseUrl = 'https://mypaper.pchome.com.tw'

const usernameRegex = /^\w+$/
const categoryRegex = /^\d+$/

// Site-wide pages and asset roots that share the first segment with paper names.
const excludedPaths = [
  'css',
  'fancybox',
  'img',
  'index',
  'js',
  'panel',
  'public_file',
  's',
  'search_mypaper',
  'show',
]

export const parsePchomeUrl = (url: string): PchomeUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, category] = getPathSegments(url)

  // A segment like oops.htm or favicon.ico is a file at the root, not a paper.
  if (!username || !usernameRegex.test(username) || isAnyOf(username, excludedPaths)) {
    return
  }

  if (isAnyOf(section, 'category') && category && categoryRegex.test(category)) {
    return { kind: 'category', username, category }
  }

  return { kind: 'paper', username }
}

export const pchomeHandler: PlatformHandler = {
  match: (url) => {
    return parsePchomeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePchomeUrl(url)

    if (!parsed) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'category') {
      uris.push({
        uri: `${baseUrl}/${parsed.username}/rss?cid=${parsed.category}`,
        hint: composeHint('pchome:category'),
      })
    }

    uris.push({ uri: `${baseUrl}/${parsed.username}/rss`, hint: composeHint('pchome:posts') })

    return uris
  },
}
