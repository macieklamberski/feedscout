import { getAnyOf, getPathSegments, isHostOrSubdomainOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  getBrandDomainRegex,
  getCookieNames,
  getTenantSubdomain,
  hasMarker,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

type UcozModule = (typeof modules)[number]

export type UcozUrl =
  | { kind: 'home' }
  | { kind: 'module'; module: UcozModule }
  | { kind: 'forumSection'; sectionId: string }

// uCoz's own `ucoz.*` domains. A site on uCoz's free domains, such as at.ua or narod.ru, or on its
// own domain is known only by its marker, so its feeds are built but not claimed.
const domains = [getBrandDomainRegex('ucoz')]

// uCoz names its cookie `{cluster}{site}uCoz` after the site's system subdomain, custom domains
// too, where the cluster is a digit or, on narod.ru, a letter.
const cookieNameRegex = /^[\da-z][\w-]*uCoz$/
// A forum page is `/forum/{section}-{topic}-{page}`, and section 0 is the forum index.
const forumSectionRegex = /^([1-9]\d*)(?:-|$)/

const modules = ['blog', 'board', 'dir', 'forum', 'load', 'news', 'photo', 'publ', 'stuff'] as const

const moduleHints: Record<UcozModule, string> = {
  blog: 'ucoz:blog',
  board: 'ucoz:board',
  dir: 'ucoz:dir',
  forum: 'ucoz:forum',
  load: 'ucoz:load',
  news: 'ucoz:news',
  photo: 'ucoz:photo',
  publ: 'ucoz:publ',
  stuff: 'ucoz:stuff',
}

const feeds = definePlatformFeeds(
  [
    ...modules.map((module) => ({
      key: moduleHints[module],
      template: `{scheme}://{host}/${module}/rss`,
    })),
    // uCoz serves the forum feed as section 0 too.
    { key: 'ucoz:forum', template: '{scheme}://{host}/forum/0-0-0-37' },
    { key: 'ucoz:forum-section', template: '{scheme}://{host}/forum/{sectionId}-0-0-37' },
  ],
  { domains, isWwwTenantPrefix: true },
)

export const isUcozHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => cookieNameRegex.test(name))
}

export const parseUcozUrl = (url: string): UcozUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (isHostOrSubdomainOf(parsedUrl, domains) && !getTenantSubdomain(parsedUrl, domains)) {
    return
  }

  const [segment, subsegment] = getPathSegments(parsedUrl)
  const module = getAnyOf(segment, modules)

  if (module === 'forum') {
    const sectionId = subsegment?.match(forumSectionRegex)?.[1]

    if (sectionId) {
      return { kind: 'forumSection', sectionId }
    }
  }

  if (module) {
    return { kind: 'module', module }
  }

  return { kind: 'home' }
}

export const ucozHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (
      !getTenantSubdomain(url, domains) &&
      !hasMarker(content, headers, { headers: isUcozHeaders })
    ) {
      return false
    }

    return parseUcozUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseUcozUrl(url)

    if (!parsed) {
      return []
    }

    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    if (parsed.kind === 'forumSection') {
      return [
        pageFeeds.getFeedEntry('ucoz:forum-section', { sectionId: parsed.sectionId }),
        pageFeeds.getFeedEntry('ucoz:forum'),
      ]
    }

    if (parsed.kind === 'module') {
      return [pageFeeds.getFeedEntry(moduleHints[parsed.module])]
    }

    // Every site runs the news module, and the home page lists its news.
    return [pageFeeds.getFeedEntry('ucoz:news')]
  },

  getFeedHint: feeds.getFeedHint,
}
