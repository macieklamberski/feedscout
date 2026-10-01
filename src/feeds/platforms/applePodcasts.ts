import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type ApplePodcastsUrl = { kind: 'podcast' }

const hosts = ['podcasts.apple.com']
const podcastRegex = /^(?:\/[a-z]{2})?\/podcast\/(?:[^/]+\/)?id\d+(?:\/|$)/i
const feedUrlRegex = /"feedUrl"\s*:\s*"([^"]+)"/

const extractFeedUrlFromContent = (content: string): string | undefined => {
  const match = content.match(feedUrlRegex)

  return match?.[1]
}

// Podcast pages: /{locale}/podcast/{name}/id{number}, locale and name optional.
export const parseApplePodcastsUrl = (url: string): ApplePodcastsUrl | undefined => {
  if (!isHostOf(url, hosts) || !podcastRegex.test(new URL(url).pathname)) {
    return
  }

  return { kind: 'podcast' }
}

export const applePodcastsHandler: PlatformHandler = {
  match: (url) => {
    return parseApplePodcastsUrl(url) !== undefined
  },

  resolve: (url, content) => {
    if (!parseApplePodcastsUrl(url) || !content) {
      return []
    }

    const feedUrl = extractFeedUrlFromContent(content)

    if (!feedUrl) {
      return []
    }

    return [{ uri: feedUrl, hint: composeHint('apple-podcasts:podcast') }]
  },
}
