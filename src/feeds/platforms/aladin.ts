import { escapeRegex, getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html), partly covers category.

export type AladinUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }

const hosts = ['blog.aladin.co.kr']

const feeds = definePlatformFeeds([
  {
    key: 'aladin:category',
    template: 'https://blog.aladin.co.kr/{username}/category/{categoryId}/rss',
  },
  { key: 'aladin:posts', template: 'https://blog.aladin.co.kr/{username}/rss' },
])

export const parseAladinUrl = (url: string): AladinUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, value] = getPathSegments(url)

  // A dotted segment such as ScriptResource.axd is a file of the site.
  if (!username || username.includes('.')) {
    return
  }

  if (isAnyOf(section, 'category') && value && digitsRegex.test(value)) {
    return { kind: 'category', username, categoryId: value }
  }

  return { kind: 'blog', username }
}

export type AladinPage = AladinUrl

export const getAladinPage = (url: string, content: string | undefined): AladinPage | undefined => {
  const parsed = parseAladinUrl(url)

  if (!parsed) {
    return
  }

  // Usernames match in any case, and the page's alternate link spells the blog's own:
  // `/CHANGBI/category/49178853` links `/changbi/rss`.
  const usernameRegex = new RegExp(
    `blog\\.aladin\\.co\\.kr/(${escapeRegex(parsed.username)})/rss`,
    'i',
  )
  const username = content?.match(usernameRegex)?.[1] ?? parsed.username

  return { ...parsed, username }
}

export const aladinHandler: PlatformHandler = {
  match: (url) => {
    return parseAladinUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getAladinPage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'category') {
      // Only the blog's subscribe page links a category feed, as an http url that redirects here.
      return [
        feeds.getFeedEntry('aladin:category', {
          username: page.username,
          categoryId: page.categoryId,
        }),
        feeds.getFeedEntry('aladin:posts', { username: page.username }),
      ]
    }

    return [feeds.getFeedEntry('aladin:posts', { username: page.username })]
  },

  // The table reads any first segment as a username, so the page parser refuses a dotted one, a
  // file of the site, and a host other than the blog's own first.
  getFeedHint: (url) => {
    if (!parseAladinUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
