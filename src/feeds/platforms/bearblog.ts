import { bearblog } from 'feedintel'
import { getQueryParam, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: discover.

export type BearblogUrl = { kind: 'discover' } | { kind: 'blog'; blog: string; tag?: string }

const domains = bearblog.hosts.tenants
const apexHosts = ['bearblog.dev', 'www.bearblog.dev']

const feeds = withHintLabels(bearblog.feeds)

export const parseBearblogUrl = (url: string): BearblogUrl | undefined => {
  // Apex bearblog.dev exposes the platform-wide trending discovery feed.
  if (isHostOf(url, apexHosts)) {
    return { kind: 'discover' }
  }

  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  // Tag filter via ?q= query param.
  const tag = getQueryParam(new URL(url).searchParams, 'q')

  return { kind: 'blog', blog, tag }
}

export const bearblogHandler: PlatformHandler = {
  match: (url) => {
    return parseBearblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBearblogUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'discover') {
      return [page.getFeedEntry('discover', {}, 'atom'), page.getFeedEntry('discover', {}, 'rss')]
    }

    if (parsed.tag) {
      const params = { tag: parsed.tag }

      return [
        page.getFeedEntry('tag', params, 'atom'),
        page.getFeedEntry('tag', params, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
        page.getFeedEntry('posts', {}, 'rss'),
      ]
    }

    return [page.getFeedEntry('posts', {}, 'atom'), page.getFeedEntry('posts', {}, 'rss')]
  },

  getFeedHint: feeds.getFeedHint,
}
