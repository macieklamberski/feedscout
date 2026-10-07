import { escapeRegex, getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html), partly covers category.

export type AladinUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }

const hosts = ['blog.aladin.co.kr']

const categoryIdRegex = /^\d+$/

// Site-wide pages and asset roots that share the first segment with blog names.
const excludedPaths = [
  'bookple',
  'bp',
  'js',
  'myblog',
  'ScriptResource.axd',
  'town',
  'trackback',
  'ucl_editor',
  'WebResource.axd',
]

export const parseAladinUrl = (url: string): AladinUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, value] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  if (isAnyOf(section, 'category') && value && categoryIdRegex.test(value)) {
    return { kind: 'category', username, categoryId: value }
  }

  return { kind: 'blog', username }
}

export const aladinHandler: PlatformHandler = {
  match: (url) => {
    return parseAladinUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseAladinUrl(url)

    if (!parsed) {
      return []
    }

    // Usernames match in any case, and the page's alternate link spells the blog's own:
    // `/CHANGBI/category/49178853` links `/changbi/rss`.
    const usernameRegex = new RegExp(
      `blog\\.aladin\\.co\\.kr/(${escapeRegex(parsed.username)})/rss`,
      'i',
    )
    const username = content?.match(usernameRegex)?.[1] ?? parsed.username
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'category') {
      // Only the blog's subscribe page links a category feed, as an http url that redirects here.
      uris.push({
        uri: `https://blog.aladin.co.kr/${username}/category/${parsed.categoryId}/rss`,
        hint: composeHint('aladin:category'),
      })
    }

    uris.push({
      uri: `https://blog.aladin.co.kr/${username}/rss`,
      hint: composeHint('aladin:posts'),
    })

    return uris
  },
}
