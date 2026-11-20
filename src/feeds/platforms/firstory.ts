import { firstory } from 'feedintel'
import { isHostOf, isSubdomainOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

const hosts = firstory.hosts.exact
const domains = firstory.hosts.tenants

// The feed is keyed by the show's cuid, and the vanity-slug form of it answers 403.
// Show, episode and firstory.cc pages each link the show's feed.
const feedUrlRegex = /feed\.firstory\.me\/rss\/user\/([a-z\d]+)/i

const feeds = withHintLabels(firstory.feeds)

export type FirstoryPage = { kind: 'show'; cuid: string }

export const getFirstoryPage = (
  url: string,
  content: string | undefined,
): FirstoryPage | undefined => {
  if (!isHostOf(url, hosts) && !isSubdomainOf(url, domains)) {
    return
  }

  const cuid = content?.match(feedUrlRegex)?.[1]

  if (!cuid) {
    return
  }

  return { kind: 'show', cuid }
}

export const firstoryHandler: PlatformHandler = {
  match: (url, content) => {
    return getFirstoryPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getFirstoryPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { cuid: page.cuid })]
  },

  getFeedHint: feeds.getFeedHint,
}
