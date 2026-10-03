import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers topic.
// Handler needed for: home.

const topicRegex = /^\/forum\/topics\/([^/]+)\/?$/i

export type NingUrl = { kind: 'topic'; topic: string } | { kind: 'home' }

// Ning 3 networks send the same `ning_session` cookie and `x-xn-trace-token` header but serve
// none of these feeds, and only the classic networks load assets from this path.
export const isNingHtml = (content: string): boolean => {
  return content.includes('static.ning.com/socialnetworkmain/')
}

export const parseNingUrl = (url: string): NingUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const topic = parsedUrl.pathname.match(topicRegex)?.[1]

  if (topic) {
    return { kind: 'topic', topic }
  }

  return { kind: 'home' }
}

export const ningHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isNingHtml })) {
      return false
    }

    return parseNingUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNingUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'topic') {
      uris.push({
        uri: `${origin}/forum/topics/${parsed.topic}?feed=yes&xn_auth=no`,
        hint: composeHint('ning:topic'),
      })
    }

    uris.push(
      { uri: `${origin}/activity/log/list?fmt=rss`, hint: composeHint('ning:activity') },
      { uri: `${origin}/profiles/blog/feed?xn_auth=no`, hint: composeHint('ning:blog') },
      // The bare `/forum?feed=yes` answers with the forum page on some networks.
      { uri: `${origin}/forum/topic/list?feed=yes&xn_auth=no`, hint: composeHint('ning:forum') },
    )

    return uris
  },
}
