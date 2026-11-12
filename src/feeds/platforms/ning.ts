import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers topic.
// Handler needed for: home.

export type NingUrl = { kind: 'topic'; topic: string } | { kind: 'home' }

const topicRegex = /^\/forum\/topics\/([^/]+)\/?$/i

const domains = ['ning.com']

// A network on its own domain is known only by its marker, so its feeds are built here but not
// claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'ning:topic', template: '{scheme}://{host}/forum/topics/{topic}?feed=yes&xn_auth=no' },
    { key: 'ning:activity', template: '{scheme}://{host}/activity/log/list?fmt=rss' },
    { key: 'ning:blog', template: '{scheme}://{host}/profiles/blog/feed?xn_auth=no' },
    // The bare `/forum?feed=yes` answers with the forum page on some networks.
    { key: 'ning:forum', template: '{scheme}://{host}/forum/topic/list?feed=yes&xn_auth=no' },
  ],
  { domains },
)

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'topic') {
      uris.push(page.getFeedEntry('ning:topic', { topic: parsed.topic }))
    }

    uris.push(
      page.getFeedEntry('ning:activity'),
      page.getFeedEntry('ning:blog'),
      page.getFeedEntry('ning:forum'),
    )

    return uris
  },

  // The table reads any host under ning.com, so only a network's own subdomain is claimed, never
  // the apex, www or a nested host.
  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
