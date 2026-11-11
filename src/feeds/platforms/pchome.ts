import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, wordRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers paper (html), partly covers category.

export type PchomeUrl =
  | { kind: 'paper'; username: string }
  | { kind: 'category'; username: string; category: string }

const hosts = ['mypaper.pchome.com.tw', 'mypaper.m.pchome.com.tw']

const feeds = definePlatformFeeds([
  {
    key: 'pchome:category',
    template: 'https://mypaper.pchome.com.tw/{username}/rss?cid={category}',
  },
  { key: 'pchome:posts', template: 'https://mypaper.pchome.com.tw/{username}/rss' },
])

export const parsePchomeUrl = (url: string): PchomeUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, category] = getPathSegments(url)

  // A segment like oops.htm or favicon.ico is a file at the root, not a paper.
  if (!username || !wordRegex.test(username)) {
    return
  }

  if (isAnyOf(section, 'category') && category && digitsRegex.test(category)) {
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
      uris.push(
        feeds.getFeedEntry('pchome:category', {
          username: parsed.username,
          category: parsed.category,
        }),
      )
    }

    uris.push(feeds.getFeedEntry('pchome:posts', { username: parsed.username }))

    return uris
  },

  getFeedKey: feeds.getFeedKey,
}
