import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['librivox.org']

const audiobookRegex = /^\/[^/]+\/?$/
// An audiobook page links its feed by numeric id, which the slug does not carry.
const feedIdRegex = /href="(?:https?|itpc):\/\/librivox\.org\/rss\/(\d+)"/i

const feeds = definePlatformFeeds([
  { key: 'librivox:audiobook', template: 'https://librivox.org/rss/{audiobookId}' },
])

export type LibrivoxPage = { audiobookId: string }

const getLibrivoxPage = (url: string, content: string | undefined): LibrivoxPage | undefined => {
  if (!audiobookRegex.test(new URL(url).pathname)) {
    return
  }

  const audiobookId = content?.match(feedIdRegex)?.[1]

  if (!audiobookId) {
    return
  }

  return { audiobookId }
}

export const librivoxHandler: PlatformHandler = {
  match: (url, content) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    return getLibrivoxPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getLibrivoxPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('librivox:audiobook', { audiobookId: page.audiobookId })]
  },

  getFeedKey: (url) => {
    const key = feeds.getFeedKey(url)
    const [, audiobookId] = getPathSegments(url)

    // An audiobook id is digits, so a named feed such as rss/latest_releases is not one.
    if (!key || !digitsRegex.test(audiobookId)) {
      return
    }

    return key
  },
}
