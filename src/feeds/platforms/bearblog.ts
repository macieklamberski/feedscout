import { bearblog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: discover.

export type BearblogUrl = { kind: 'discover' } | { kind: 'blog'; blog: string; tag?: string }

const domains = bearblog.hosts.tenants

const feeds = withHintLabels(bearblog.feeds)

export const parseBearblogUrl = (url: string): BearblogUrl | undefined => {
  const page = bearblog.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'discover') {
    return { kind: 'discover' }
  }

  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog, tag: page.params.tag }
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
