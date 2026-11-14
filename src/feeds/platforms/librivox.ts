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
  // The site's new releases. It needs no value from the page, so `resolve` builds it on every
  // page it matches. It goes before the audiobook row, whose placeholder its path also fills.
  { key: 'librivox:latest', template: 'https://librivox.org/rss/latest_releases' },
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

    return [
      feeds.getFeedEntry('librivox:audiobook', { audiobookId: page.audiobookId }),
      feeds.getFeedEntry('librivox:latest'),
    ]
  },

  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)
    const [, audiobookId] = getPathSegments(url)

    // An audiobook id is digits, so a file such as rss/robots.txt is not one.
    if (!hint || (hint.key === 'librivox:audiobook' && !digitsRegex.test(audiobookId))) {
      return
    }

    return hint
  },
}
