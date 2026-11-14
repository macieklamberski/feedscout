import { getQueryParam, isAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasClass, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers search.
// Handler needed for: home.

export type TalentsoftPage =
  | { kind: 'search'; origin: string; lcid?: string; searchFeedUrl: string }
  | { kind: 'site'; origin: string; lcid?: string }

const cookiesScriptPath = '/client/dist/talentsoft-cookies.iife.js'
const domains = ['profils.org', 'talent-soft.com']

const offerFeedPathRegex = /^\/handlers\/offerRss\.ashx$/i

// A career site on a custom domain is known only by its marker, so its feeds are built here but
// claimed only on Talentsoft's own domains. The site's own feed list spells the language as `LCID`,
// and the feed answers without it. The feed list page's own link serves the same offers.
const feeds = definePlatformFeeds(
  [
    { key: 'talentsoft:offers', template: '{scheme}://{host}/handlers/offerRss.ashx?LCID={lcid}' },
    { key: 'talentsoft:offers', template: '{scheme}://{host}/handlers/offerRss.ashx' },
    { key: 'talentsoft:offers', template: '{scheme}://{host}/offre-de-emploi/flux-rss.ashx' },
  ],
  { domains },
)

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
    if (isAnyOf(key, 'lcid') && value) {
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

      const feedUrl = parseUrl(element.attribs.href, url)

      return (
        feedUrl?.origin === origin &&
        offerFeedPathRegex.test(feedUrl.pathname) &&
        isAnyOf([...feedUrl.searchParams.keys()].join(), 'lcid')
      )
    })

    if (offersLink) {
      lcid = getQueryParam(parseUrl(offersLink.attribs.href, url)?.searchParams, 'lcid')
    }
  }

  const searchLink = findElement(content, (element) => {
    return element.name === 'a' && hasClass(element, 'ts-ol-criterias-keep__link--rss')
  })
  const searchFeedUrl = parseUrl(searchLink?.attribs.href, url)

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
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    if (page.kind === 'search') {
      return [
        { uri: page.searchFeedUrl, hint: composeHint('talentsoft:search') },
        pageFeeds.getFeedEntry('talentsoft:offers', { lcid: page.lcid }),
      ]
    }

    return [pageFeeds.getFeedEntry('talentsoft:offers', { lcid: page.lcid })]
  },

  // A criterion beyond the language makes it a search feed.
  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)

    if (!hint) {
      return
    }

    for (const name of new URL(url).searchParams.keys()) {
      if (!isAnyOf(name, 'lcid')) {
        return composeHint('talentsoft:search')
      }
    }

    return hint
  },
}
