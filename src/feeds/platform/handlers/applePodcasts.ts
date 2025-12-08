import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf } from '../../../common/utils.js'

const hosts = ['podcasts.apple.com']
const excludedPaths = ['subscribe', 'app', 'redeem', 'buy', 'charts']

// Extract feed URL from Apple Podcasts page HTML.
// Apple embeds podcast data in JSON-LD or script tags.
const extractFeedUrlFromContent = (content: string): string | undefined => {
  // Try JSON-LD structured data first.
  const jsonLdMatch = content.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i,
  )

  if (jsonLdMatch?.[1]) {
    try {
      const data = JSON.parse(jsonLdMatch[1])
      // JSON-LD might have associatedMedia or webFeed property.
      if (data.associatedMedia?.contentUrl) {
        return data.associatedMedia.contentUrl
      }
    } catch {
      // Invalid JSON, continue to other methods.
    }
  }

  // Try embedded JSON data in script tags (Apple uses various formats).
  const dataMatch = content.match(/"feedUrl"\s*:\s*"([^"]+)"/i)

  if (dataMatch?.[1]) {
    return dataMatch[1]
  }

  // Try meta tag with feed URL.
  const metaMatch = content.match(/<meta[^>]*property="al:web:url"[^>]*content="([^"]*feed[^"]*)"/i)

  if (metaMatch?.[1]) {
    return metaMatch[1]
  }

  return undefined
}

// Extract podcast ID from Apple Podcasts URL.
const extractPodcastId = (pathname: string): string | undefined => {
  // Match /podcast/{name}/id{number} or /podcast/id{number}.
  const idMatch = pathname.match(/\/id(\d+)/)

  return idMatch?.[1]
}

export const applePodcastsHandler: PlatformHandler = {
  match: (url) => {
    return isAnyOf(new URL(url).hostname, hosts)
  },

  resolve: (url, content) => {
    const { pathname } = new URL(url)
    const uris: Array<string> = []

    // Check for excluded paths.
    const firstSegment = pathname.split('/').filter(Boolean)[0]

    if (firstSegment && isAnyOf(firstSegment, excludedPaths)) {
      return []
    }

    // Try to extract feed URL from page content.
    if (content) {
      const feedUrl = extractFeedUrlFromContent(content)

      if (feedUrl) {
        uris.push(feedUrl)
        return uris
      }
    }

    // If no content provided, extract podcast ID for iTunes Lookup API.
    // The caller can use this ID with: https://itunes.apple.com/lookup?id={id}
    // The API returns JSON with feedUrl field.
    const podcastId = extractPodcastId(pathname)

    if (podcastId) {
      // Return iTunes Lookup API URL - caller needs to fetch this and extract feedUrl from JSON.
      uris.push(`https://itunes.apple.com/lookup?id=${podcastId}&entity=podcast`)
    }

    return uris
  },
}
