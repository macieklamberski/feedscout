import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Apple Podcasts show pages at `podcasts.apple.com/{locale}/podcast/{name}/id{number}`
// embed the upstream RSS URL in a `"feedUrl":"…"` JSON payload inside the page
// HTML, but the page itself ships no `<link rel="alternate">` for that feed.
// The handler scrapes the `feedUrl` string from the fetched HTML to surface
// the actual podcast RSS (typically hosted on a third party like Simplecast,
// Megaphone, or Libsyn).

const hosts = ['podcasts.apple.com']
const podcastRegex = /^(?:\/[a-z]{2})?\/podcast\/(?:[^/]+\/)?id\d+/
const feedUrlRegex = /"feedUrl"\s*:\s*"([^"]+)"/

const extractFeedUrlFromContent = (content: string): string | undefined => {
  const match = content.match(feedUrlRegex)

  return match?.[1]
}

export const applePodcastsHandler: PlatformHandler = {
  match: (url) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    const { pathname } = new URL(url)

    // Match podcast pages: /{locale}/podcast/{name}/id{number}, locale and name optional.
    return podcastRegex.test(pathname)
  },

  resolve: (_url, content) => {
    if (!content) {
      return []
    }

    const feedUrl = extractFeedUrlFromContent(content)

    if (!feedUrl) {
      return []
    }

    return [{ uri: feedUrl, hint: composeHint('apple-podcasts:podcast') }]
  },
}
