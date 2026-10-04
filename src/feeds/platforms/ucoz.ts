import { getAnyOf, getPathSegments, getSubdomain, isAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

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

// The company site answers on `www`, and user sites never do.
const excludedSubdomains = ['www']
const modules = ['blog', 'board', 'dir', 'forum', 'load', 'news', 'photo', 'publ', 'stuff'] as const

type UcozModule = (typeof modules)[number]

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

export type UcozUrl =
  | { kind: 'home' }
  | { kind: 'module'; module: UcozModule }
  | { kind: 'forumSection'; sectionId: string }

export const isUcozHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => cookieNameRegex.test(name))
}

export const parseUcozUrl = (url: string): UcozUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
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
    const subdomain = getSubdomain(url, domains)
    const isUcozHost = subdomain !== undefined && !isAnyOf(subdomain, excludedSubdomains)

    if (!isUcozHost && !hasMarker(content, headers, { headers: isUcozHeaders })) {
      return false
    }

    return parseUcozUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseUcozUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'forumSection') {
      uris.push(
        {
          uri: `${origin}/forum/${parsed.sectionId}-0-0-37`,
          hint: composeHint('ucoz:forum-section'),
        },
        { uri: `${origin}/forum/rss`, hint: composeHint('ucoz:forum') },
      )

      return uris
    }

    if (parsed.kind === 'module') {
      uris.push({
        uri: `${origin}/${parsed.module}/rss`,
        hint: composeHint(moduleHints[parsed.module]),
      })

      return uris
    }

    // Every site runs the news module, and the home page lists its news.
    uris.push({ uri: `${origin}/news/rss`, hint: composeHint('ucoz:news') })

    return uris
  },
}
