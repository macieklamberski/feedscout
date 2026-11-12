import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { wordRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers smartlink, smartlinkEpisode (html).
// Handler needed for: episode, show.

export type AushaUrl = { kind: 'show' }
export type AushaPage = { kind: 'show'; feedId: string }

const hosts = ['podcast.ausha.co', 'smartlink.ausha.co']

// The feed id is opaque: show and episode pages carry it only in the markup.
const feedIdRegex = /feed\.ausha\.co\/(\w+)/i

const feeds = definePlatformFeeds([
  { key: 'ausha:podcast', template: 'https://feed.ausha.co/{feedId}' },
])

export const parseAushaUrl = (url: string): AushaUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [slug] = getPathSegments(url)

  if (!slug) {
    return
  }

  return { kind: 'show' }
}

export const getAushaPage = (url: string, content: string | undefined): AushaPage | undefined => {
  const parsed = parseAushaUrl(url)
  const feedId = content?.match(feedIdRegex)?.[1]

  if (!parsed || !feedId) {
    return
  }

  return { kind: 'show', feedId }
}

export const aushaHandler: PlatformHandler = {
  match: (url) => {
    return parseAushaUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getAushaPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('ausha:podcast', { feedId: page.feedId })]
  },

  getFeedKey: (url) => {
    const [feedId] = getPathSegments(url)

    // A feed id is word characters only, so a file on the feed host, such as `rss.xslt`, is no
    // feed.
    if (!feedId || !wordRegex.test(feedId)) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
