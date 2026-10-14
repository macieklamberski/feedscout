import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type ApplePodcastsUrl = { kind: 'podcast' }

const hosts = ['podcasts.apple.com']
const podcastRegex = /^(?:\/[a-z]{2})?\/podcast\/(?:[^/]+\/)?id\d+(?:\/|$)/i
const feedUrlRegex = /"feedUrl"\s*:\s*"([^"]+)"/

// The value is a JSON string, which may write `/` as `\/` and `&` as `\u0026`.
const extractFeedUrlFromContent = (content: string): string | undefined => {
  const value = content.match(feedUrlRegex)?.[1]

  if (!value) {
    return
  }

  try {
    return JSON.parse(`"${value}"`)
  } catch {
    return value
  }
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
