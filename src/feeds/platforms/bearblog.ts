import { getQueryParam, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: discover.

export type BearblogUrl = { kind: 'discover' } | { kind: 'blog'; blog: string; tag?: string }

const domains = ['bearblog.dev']
const apexHosts = ['bearblog.dev', 'www.bearblog.dev']

const feeds = definePlatformFeeds(
  [
    { key: 'bearblog:discover', main: 'https://bearblog.dev/discover/feed/', format: 'atom' },
    {
      key: 'bearblog:discover',
      main: 'https://bearblog.dev/discover/feed/?type=rss',
      format: 'rss',
    },
    {
      key: 'bearblog:tag',
      main: '{scheme}://{host}/feed/?q={tag}',
      format: 'atom',
      aliases: [
        // A tag feed answers under these paths of the posts feed too, which the page does not link.
        '{scheme}://{host}/atom/?q={tag}',
        '{scheme}://{host}/atom.xml?q={tag}',
        '{scheme}://{host}/feed.xml?q={tag}',
        '{scheme}://{host}/index.xml?q={tag}',
      ],
    },
    {
      key: 'bearblog:tag',
      main: '{scheme}://{host}/feed/?type=rss&q={tag}',
      format: 'rss',
      aliases: ['{scheme}://{host}/rss/?q={tag}', '{scheme}://{host}/rss.xml?q={tag}'],
    },
    {
      key: 'bearblog:posts',
      main: '{scheme}://{host}/feed/',
      format: 'atom',
      aliases: [
        // Every blog serves the same two feeds under these paths too, which the page does not link.
        '{scheme}://{host}/atom/',
        '{scheme}://{host}/atom.xml',
        '{scheme}://{host}/feed.xml',
        '{scheme}://{host}/index.xml',
      ],
    },
    {
      key: 'bearblog:posts',
      main: '{scheme}://{host}/feed/?type=rss',
      format: 'rss',
      aliases: ['{scheme}://{host}/rss/', '{scheme}://{host}/rss.xml'],
    },
  ],
  { hosts: { tenants: domains } },
)

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
      return [
        page.getFeedEntry('bearblog:discover', {}, 'atom'),
        page.getFeedEntry('bearblog:discover', {}, 'rss'),
      ]
    }

    if (parsed.tag) {
      const params = { tag: parsed.tag }

      return [
        page.getFeedEntry('bearblog:tag', params, 'atom'),
        page.getFeedEntry('bearblog:tag', params, 'rss'),
        page.getFeedEntry('bearblog:posts', {}, 'atom'),
        page.getFeedEntry('bearblog:posts', {}, 'rss'),
      ]
    }

    return [
      page.getFeedEntry('bearblog:posts', {}, 'atom'),
      page.getFeedEntry('bearblog:posts', {}, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
