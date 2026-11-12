import { getAnyOf, getPathSegments, isHostOrSubdomainOf, parseUrl } from 'trousse'
import {
  definePlatformFeeds,
  type PlatformFeedParams,
  type PlatformFeedTemplate,
} from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

type UcozModule = (typeof modules)[number]

export type UcozUrl =
  | { kind: 'home' }
  | { kind: 'module'; module: UcozModule }
  | { kind: 'forumSection'; sectionId: string }

const domains = [
  '3dn.ru',
  'at.ua',
  'clan.su',
  'do.am',
  'moy.su',
  'my1.ru',
  'narod.ru',
  'ucoz.ae',
  'ucoz.club',
  'ucoz.co.uk',
  'ucoz.com',
  'ucoz.com.br',
  'ucoz.de',
  'ucoz.es',
  'ucoz.hu',
  'ucoz.kz',
  'ucoz.lv',
  'ucoz.net',
  'ucoz.org',
  'ucoz.pl',
  'ucoz.ru',
  'ucoz.site',
  'ucoz.ua',
  'usite.pro',
]

// uCoz names its cookie `{cluster}{site}uCoz` after the site's system subdomain, custom domains too,
// where the cluster is a digit or, on narod.ru, a letter.
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

const getFeedTemplates = (origin: string): Array<PlatformFeedTemplate> => {
  return [
    ...modules.map((module) => ({ key: moduleHints[module], template: `${origin}/${module}/rss` })),
    // uCoz serves the forum feed as section 0 too.
    { key: 'ucoz:forum', template: `${origin}/forum/0-0-0-37` },
    { key: 'ucoz:forum-section', template: `${origin}/forum/{sectionId}-0-0-37` },
  ]
}

const tenantFeeds = definePlatformFeeds(getFeedTemplates('{scheme}://{site}.{domain}'), {
  domains,
})
// A site on its own domain is known only by its markers, so its feeds are built but not claimed.
const siteFeeds = definePlatformFeeds(getFeedTemplates('{scheme}://{host}'), { domains })

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

    const { protocol, host, hostname } = new URL(url)
    const site = getTenantSubdomain(url, domains)
    const feeds = site ? tenantFeeds : siteFeeds
    const params: PlatformFeedParams = { scheme: protocol.slice(0, -1), host }

    if (site) {
      params.site = site
      params.domain = hostname.slice(site.length + 1)
    }

    if (parsed.kind === 'forumSection') {
      return [
        feeds.getFeedEntry('ucoz:forum-section', { ...params, sectionId: parsed.sectionId }),
        feeds.getFeedEntry('ucoz:forum', params),
      ]
    }

    if (parsed.kind === 'module') {
      return [feeds.getFeedEntry(moduleHints[parsed.module], params)]
    }

    // Every site runs the news module, and the home page lists its news.
    return [feeds.getFeedEntry('ucoz:news', params)]
  },

  getFeedHint: tenantFeeds.getFeedHint,
}
