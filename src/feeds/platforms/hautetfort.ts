import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HautetfortUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

// Business blogs sit under blog.blogspirit-business.com, which comes before its parent so their
// name reads as one label.
const domains = [
  'hautetfort.com',
  'blogspirit.com',
  'blog.blogspirit-business.com',
  'blogspirit-business.com',
]

const categoryRegex = /^\/([^/.]+)\/?$/
const archivesCategoryRegex = /^\/archives\/category\/([^/]+)(?:\/|$)/

export const parseHautetfortUrl = (url: string): HautetfortUrl | undefined => {
  const pathname = parseUrl(url)?.pathname

  if (!pathname) {
    return
  }

  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  const archivesCategory = pathname.match(archivesCategoryRegex)?.[1]

  if (archivesCategory) {
    return { kind: 'category', blog, category: archivesCategory }
  }

  const category = pathname.match(categoryRegex)?.[1]

  if (category) {
    return { kind: 'category', blog, category }
  }

  return { kind: 'blog', blog }
}

export const hautetfortHandler: PlatformHandler = {
  match: (url) => {
    return parseHautetfortUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHautetfortUrl(url)

    if (!parsed) {
      return []
    }

    // Blog subdomains serve no certificate for their own name, so the feeds stay on http.
    const origin = `http://${new URL(url).hostname}`
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'category') {
      uris.push({
        uri: `${origin}/${parsed.category}/index.rss`,
        hint: composeHint('hautetfort:category'),
      })
    }

    uris.push({ uri: `${origin}/atom.xml`, hint: composeHint('hautetfort:posts', 'atom') })
    uris.push({ uri: `${origin}/index.rss`, hint: composeHint('hautetfort:posts', 'rss') })

    return uris
  },
}
