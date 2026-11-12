import { isHostOrSubdomainOf, isSubdomainOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers label, newspage, publication.

export type NoticeableUrl = { kind: 'newspage' } | { kind: 'label'; label: string }

const domains = ['noticeable.news']

// A page combining labels, `/labels/{a},{b}`, has no feed of its own: `/{a},{b}.rss` answers 404.
const labelPathRegex = /^\/labels\/([^/,]+)\/?$/i

// A newspage serves its feeds on its own host, custom domains too. The `feed.*` rows read before
// the label rows, so a label named feed reads as the newspage feed.
const feeds = definePlatformFeeds(
  [
    { key: 'noticeable:posts', template: '{scheme}://{host}/feed.rss', format: 'rss' },
    { key: 'noticeable:posts', template: '{scheme}://{host}/feed.atom', format: 'atom' },
    { key: 'noticeable:posts', template: '{scheme}://{host}/feed.json', format: 'json' },
    { key: 'noticeable:label', template: '{scheme}://{host}/{label}.rss', format: 'rss' },
    { key: 'noticeable:label', template: '{scheme}://{host}/{label}.atom', format: 'atom' },
    { key: 'noticeable:label', template: '{scheme}://{host}/{label}.json', format: 'json' },
  ],
  { domains },
)

// Every newspage template loads its styles from the Noticeable asset host, custom domains too.
export const isNoticeableHtml = (content: string): boolean => {
  return content.includes('assets.noticeable.news/templates/')
}

export const parseNoticeableUrl = (url: string): NoticeableUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (isHostOrSubdomainOf(parsedUrl, domains) && !getTenantSubdomain(parsedUrl, domains)) {
    return
  }

  const label = parsedUrl.pathname.match(labelPathRegex)?.[1]

  if (label) {
    return { kind: 'label', label }
  }

  return { kind: 'newspage' }
}

export const noticeableHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!isSubdomainOf(url, domains) && !hasMarker(content, headers, { html: isNoticeableHtml })) {
      return false
    }

    return parseNoticeableUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNoticeableUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'label') {
      const labelParams = { label: parsed.label }

      uris.push(
        page.getFeedEntry('noticeable:label', labelParams, 'rss'),
        page.getFeedEntry('noticeable:label', labelParams, 'atom'),
        page.getFeedEntry('noticeable:label', labelParams, 'json'),
      )
    }

    uris.push(
      page.getFeedEntry('noticeable:posts', {}, 'rss'),
      page.getFeedEntry('noticeable:posts', {}, 'atom'),
      page.getFeedEntry('noticeable:posts', {}, 'json'),
    )

    return uris
  },

  // A feed on a custom domain carries no marker in its URL, so only a tenant host is read, never
  // the noticeable.news site itself.
  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
