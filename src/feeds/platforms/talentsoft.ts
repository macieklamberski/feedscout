import { isAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasClass, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers search (html).
// Handler needed for: home.

const cookiesScriptPath = '/client/dist/talentsoft-cookies.iife.js'
const offerFeedPath = '/handlers/offerRss.ashx'

const offerFeedPathRegex = /^\/handlers\/offerRss\.ashx$/i
const lcidRegex = /^\d+$/

export type TalentsoftPage =
  | { kind: 'search'; origin: string; lcid?: string; searchFeedUrl: string }
  | { kind: 'site'; origin: string; lcid?: string }

// Every career site loads the cookie banner script from this path, on every page and theme.
export const isTalentsoftHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && element.attribs.src === cookiesScriptPath
  })

  return script !== undefined
}

// A search links its own feed, whose criteria the server renames from the page's facets, such as
// `facet_Contract` to `Rss_JobDescription_Contract`, so the feed is read from that link.
const getTalentsoftPage = (url: string, content: string | undefined): TalentsoftPage => {
  const { origin, searchParams } = new URL(url)
  let lcid: string | undefined

  for (const [key, value] of searchParams) {
    if (isAnyOf(key, 'lcid') && lcidRegex.test(value)) {
      lcid = value
      break
    }
  }

  // The feed list page names no language in its url and links the all offers feed with one.
  if (!lcid) {
    const offersLink = findElement(content, (element) => {
      if (element.name !== 'a') {
        return false
      }

      const feedUrl = parseUrl(element.attribs.href ?? '', url)

      return (
        feedUrl?.origin === origin &&
        offerFeedPathRegex.test(feedUrl.pathname) &&
        [...feedUrl.searchParams.keys()].join() === 'LCID'
      )
    })

    if (offersLink) {
      lcid = parseUrl(offersLink.attribs.href ?? '', url)?.searchParams.get('LCID') ?? undefined
    }
  }

  const searchLink = findElement(content, (element) => {
    return element.name === 'a' && hasClass(element, 'ts-ol-criterias-keep__link--rss')
  })
  const searchFeedUrl = parseUrl(searchLink?.attribs.href ?? '', url)

  if (searchFeedUrl?.origin === origin && offerFeedPathRegex.test(searchFeedUrl.pathname)) {
    return { kind: 'search', origin, lcid, searchFeedUrl: searchFeedUrl.href }
  }

  return { kind: 'site', origin, lcid }
}

export const talentsoftHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isTalentsoftHtml })
  },

  resolve: (url, content) => {
    const page = getTalentsoftPage(url, content)
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'search') {
      uris.push({ uri: page.searchFeedUrl, hint: composeHint('talentsoft:search') })
    }

    // The site's own feed list spells the language as `LCID`, and the feed answers without it.
    const query = page.lcid ? `?${new URLSearchParams({ LCID: page.lcid })}` : ''

    uris.push({
      uri: `${page.origin}${offerFeedPath}${query}`,
      hint: composeHint('talentsoft:offers'),
    })

    return uris
  },
}
