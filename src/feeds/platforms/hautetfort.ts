import { getSubdomain, isAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HautetfortUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

const domains = ['hautetfort.com', 'blogspirit.com', 'blogspirit-business.com']

const categoryRegex = /^\/([^/.]+)\/?$/
const archivesCategoryRegex = /^\/archives\/category\/([^/]+)(?:\/|$)/

const excludedSubdomains = ['starter', 'static', 'www']
const excludedPaths = [
  'admin',
  'album',
  'apps',
  'archive',
  'archives',
  'backend',
  'files',
  'media',
  'tag',
]

export const parseHautetfortUrl = (url: string): HautetfortUrl | undefined => {
  const pathname = parseUrl(url)?.pathname

  if (!pathname) {
    return
  }

  const blog = getSubdomain(url, domains)

  if (!blog || isAnyOf(blog, excludedSubdomains)) {
    return
  }

  const archivesCategory = pathname.match(archivesCategoryRegex)?.[1]

  if (archivesCategory) {
    return { kind: 'category', blog, category: archivesCategory }
  }

  const category = pathname.match(categoryRegex)?.[1]

  if (category && !isAnyOf(category, excludedPaths)) {
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
