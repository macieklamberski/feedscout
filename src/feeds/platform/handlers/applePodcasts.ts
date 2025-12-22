import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['podcasts.apple.com']
const podcastPathRegex = /^\/[a-z]{2}\/podcast\/[^/]+\/id\d+/
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

    // Match podcast pages: /us/podcast/{name}/id{number}
    return podcastPathRegex.test(pathname)
  },

  resolve: (_url, content) => {
    if (!content) {
      return []
    }

    const feedUrl = extractFeedUrlFromContent(content)

    if (!feedUrl) {
      return []
    }

    return [feedUrl]
  },
}
