import { librivox } from 'feedintel'
import { isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: audiobook.
// Handler needed for: latest.

const hosts = librivox.hosts.exact

const audiobookRegex = /^\/[^/]+\/?$/
// An audiobook page links its feed by numeric id, which the slug does not carry.
const feedIdRegex = /href="(?:https?|itpc):\/\/librivox\.org\/rss\/(\d+)"/i

const feeds = withHintLabels(librivox.feeds)

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
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url, content) => {
    const page = getLibrivoxPage(url, content)

    if (!page) {
      return [feeds.getFeedEntry('latest')]
    }

    return [
      feeds.getFeedEntry('audiobook', { audiobookId: page.audiobookId }),
      feeds.getFeedEntry('latest'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
