import { getQueryParam, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (guess, html).
// Handler needed for: home.

export type BearblogUrl = { kind: 'discover' } | { kind: 'blog'; blog: string; tag?: string }

const domains = ['bearblog.dev']
const apexHosts = ['bearblog.dev', 'www.bearblog.dev']

const feeds = definePlatformFeeds([
  { key: 'bearblog:discover', template: 'https://bearblog.dev/discover/feed/', format: 'atom' },
  {
    key: 'bearblog:discover',
    template: 'https://bearblog.dev/discover/feed/?type=rss',
    format: 'rss',
  },
  { key: 'bearblog:tag', template: 'https://{blog}.bearblog.dev/feed/?q={tag}', format: 'atom' },
  {
    key: 'bearblog:tag',
    template: 'https://{blog}.bearblog.dev/feed/?type=rss&q={tag}',
    format: 'rss',
  },
  // A tag feed answers under these paths of the posts feed too, which the page does not link.
  { key: 'bearblog:tag', template: 'https://{blog}.bearblog.dev/atom/?q={tag}', format: 'atom' },
  { key: 'bearblog:tag', template: 'https://{blog}.bearblog.dev/atom.xml?q={tag}', format: 'atom' },
  { key: 'bearblog:tag', template: 'https://{blog}.bearblog.dev/rss/?q={tag}', format: 'rss' },
  { key: 'bearblog:tag', template: 'https://{blog}.bearblog.dev/feed.xml?q={tag}', format: 'atom' },
  {
    key: 'bearblog:tag',
    template: 'https://{blog}.bearblog.dev/index.xml?q={tag}',
    format: 'atom',
  },
  { key: 'bearblog:tag', template: 'https://{blog}.bearblog.dev/rss.xml?q={tag}', format: 'rss' },
  { key: 'bearblog:posts', template: 'https://{blog}.bearblog.dev/feed/', format: 'atom' },
  { key: 'bearblog:posts', template: 'https://{blog}.bearblog.dev/feed/?type=rss', format: 'rss' },
  // Every blog serves the same two feeds under these paths too, which the page does not link.
  { key: 'bearblog:posts', template: 'https://{blog}.bearblog.dev/atom/', format: 'atom' },
  { key: 'bearblog:posts', template: 'https://{blog}.bearblog.dev/atom.xml', format: 'atom' },
  { key: 'bearblog:posts', template: 'https://{blog}.bearblog.dev/feed.xml', format: 'atom' },
  { key: 'bearblog:posts', template: 'https://{blog}.bearblog.dev/index.xml', format: 'atom' },
  { key: 'bearblog:posts', template: 'https://{blog}.bearblog.dev/rss/', format: 'rss' },
  { key: 'bearblog:posts', template: 'https://{blog}.bearblog.dev/rss.xml', format: 'rss' },
])

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

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'discover') {
      return [
        feeds.getFeedEntry('bearblog:discover', {}, 'atom'),
        feeds.getFeedEntry('bearblog:discover', {}, 'rss'),
      ]
    }

    const { blog } = parsed
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.tag) {
      const params = { blog, tag: parsed.tag }

      uris.push(
        feeds.getFeedEntry('bearblog:tag', params, 'atom'),
        feeds.getFeedEntry('bearblog:tag', params, 'rss'),
      )
    }

    uris.push(
      feeds.getFeedEntry('bearblog:posts', { blog }, 'atom'),
      feeds.getFeedEntry('bearblog:posts', { blog }, 'rss'),
    )

    return uris
  },

  getFeedHint: feeds.getFeedHint,
}
