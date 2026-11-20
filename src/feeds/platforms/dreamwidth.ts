import { dreamwidth } from 'feedintel'
import { decodeSegment } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts, posts-tag.
// Handler needed for: userpics.

export type DreamwidthUrl = { kind: 'journal'; username?: string; tag?: string }

const domains = dreamwidth.hosts.tenants

const feeds = withHintLabels(dreamwidth.feeds)

export const parseDreamwidthUrl = (url: string): DreamwidthUrl | undefined => {
  const page = dreamwidth.pages.read(url)

  if (!page) {
    return
  }

  const { username, tag } = page.params

  return { kind: 'journal', username, tag }
}

export const dreamwidthHandler: PlatformHandler = {
  match: (url) => {
    return parseDreamwidthUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDreamwidthUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // A username with `_` is served on a hostname with `-`.
    const origin = parsed.username
      ? getHostOrigin(`${parsed.username.replaceAll('_', '-')}.dreamwidth.org`)
      : url

    if (!origin) {
      return []
    }

    const journal = getTenantSubdomain(origin, domains)

    if (!journal) {
      return []
    }

    // A journal named in the path lives on its own host, a journal page serves from its own.
    const host = parsed.username ? `${journal}.dreamwidth.org` : undefined

    if (parsed.tag) {
      const tag = decodeSegment(parsed.tag) ?? parsed.tag

      return [
        page.getFeedEntry('posts-tag', { host, tag }, 'rss'),
        page.getFeedEntry('posts-tag', { host, tag }, 'atom'),
        page.getFeedEntry('posts', { host }, 'rss'),
        page.getFeedEntry('posts', { host }, 'atom'),
        page.getFeedEntry('userpics', { host }, 'atom'),
      ]
    }

    return [
      page.getFeedEntry('posts', { host }, 'rss'),
      page.getFeedEntry('posts', { host }, 'atom'),
      page.getFeedEntry('userpics', { host }, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
