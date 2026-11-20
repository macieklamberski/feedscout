import { fireside } from 'feedintel'
import { decodePercent, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type FiresideUrl = { kind: 'podcast'; slug: string; tag?: string }

const domains = fireside.hosts.tenants

const tagPathRegex = /^\/tags\/([^/]+)\/?$/i

const feeds = withHintLabels(fireside.feeds)

export const parseFiresideUrl = (url: string): FiresideUrl | undefined => {
  const slug = getTenantSubdomain(url, domains)

  if (!slug) {
    return
  }

  // A tag page, /tags/{tag}, has a feed of the episodes with that tag.
  const tag = parseUrl(url)?.pathname.match(tagPathRegex)?.[1]

  if (tag) {
    return { kind: 'podcast', slug, tag: decodePercent(tag) }
  }

  return { kind: 'podcast', slug }
}

export const firesideHandler: PlatformHandler = {
  match: (url) => {
    return parseFiresideUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseFiresideUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.tag) {
      return [
        page.getFeedEntry('tag', { tag: parsed.tag }),
        page.getFeedEntry('podcast', { slug: parsed.slug }, 'rss'),
        page.getFeedEntry('podcast', { slug: parsed.slug }, 'json'),
        page.getFeedEntry('blog'),
      ]
    }

    return [
      page.getFeedEntry('podcast', { slug: parsed.slug }, 'rss'),
      page.getFeedEntry('podcast', { slug: parsed.slug }, 'json'),
      page.getFeedEntry('blog'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
