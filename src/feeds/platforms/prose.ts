import { prose } from 'feedintel'
import { getSubdomain } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ProseUrl =
  | { kind: 'home' }
  | { kind: 'tag'; username: string; tag: string }
  | { kind: 'blog'; username: string }

const domains = prose.hosts.tenants

const feeds = withHintLabels(prose.feeds)

export const parseProseUrl = (url: string): ProseUrl | undefined => {
  const page = prose.pages.read(url)

  if (!page) {
    return
  }

  // Apex prose.sh is the platform-wide discovery firehose, not a per-blog feed.
  if (page.key === 'home') {
    return { kind: 'home' }
  }

  // `www` is a Prose user like any other, so `www.prose.sh` is a blog.
  const username = getSubdomain(url, domains)

  if (!username) {
    return
  }

  if (page.key === 'tag') {
    return { kind: 'tag', username, tag: page.params.tag }
  }

  return { kind: 'blog', username }
}

export const proseHandler: PlatformHandler = {
  match: (url) => {
    return parseProseUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseProseUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'home') {
      return [feeds.getFeedEntry('discovery')]
    }

    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [page.getFeedEntry('tag', { tag: parsed.tag })]
    }

    return [page.getFeedEntry('blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
