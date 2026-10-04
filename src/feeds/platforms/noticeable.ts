import { isSubdomainOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers label, newspage, publication.

export type NoticeableUrl = { kind: 'newspage' } | { kind: 'label'; label: string }

const domains = ['noticeable.news']

// A page combining labels, `/labels/{a},{b}`, has no feed of its own: `/{a},{b}.rss` answers 404.
const labelPathRegex = /^\/labels\/([^/,]+)\/?$/i

// Every newspage template loads its styles from the Noticeable asset host, custom domains too.
export const isNoticeableHtml = (content: string): boolean => {
  return content.includes('assets.noticeable.news/templates/')
}

export const parseNoticeableUrl = (url: string): NoticeableUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
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

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'label') {
      const { label } = parsed

      uris.push({ uri: `${origin}/${label}.rss`, hint: composeHint('noticeable:label', 'rss') })
      uris.push({ uri: `${origin}/${label}.atom`, hint: composeHint('noticeable:label', 'atom') })
      uris.push({ uri: `${origin}/${label}.json`, hint: composeHint('noticeable:label', 'json') })
    }

    uris.push({ uri: `${origin}/feed.rss`, hint: composeHint('noticeable:posts', 'rss') })
    uris.push({ uri: `${origin}/feed.atom`, hint: composeHint('noticeable:posts', 'atom') })
    uris.push({ uri: `${origin}/feed.json`, hint: composeHint('noticeable:posts', 'json') })

    return uris
  },
}
