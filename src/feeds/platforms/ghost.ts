import { ghost } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type GhostUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'author'; author: string }
  | { kind: 'blog' }

const domains = ghost.hosts.tenants

const tagRegex = /^\/tag\/([^/]+)/i
const authorRegex = /^\/author\/([^/]+)/i

const feeds = withHintLabels(ghost.feeds)

export const parseGhostUrl = (url: string): GhostUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const author = pathname.match(authorRegex)?.[1]

  if (author) {
    return { kind: 'author', author }
  }

  return { kind: 'blog' }
}

export const ghostHandler: PlatformHandler = {
  match: (url) => {
    return parseGhostUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGhostUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [page.getFeedEntry('tag', { tag: parsed.tag }), page.getFeedEntry('blog')]
    }

    if (parsed.kind === 'author') {
      return [page.getFeedEntry('author', { author: parsed.author }), page.getFeedEntry('blog')]
    }

    return [page.getFeedEntry('blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
