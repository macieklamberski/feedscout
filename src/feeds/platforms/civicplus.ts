import { civicplus } from 'feedintel'
import { startsWithAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: agenda-center, alert-center, blog, calendar, jobs, media-center, news-flash, pages, photo-gallery, real-estate.

// CivicPlus numbers its modules. A module page prints its number in a hidden `pageModuleID` input,
// and the module's feed carries the same number as `ModID`. A number with no feed answers 200 with
// an empty body, so only the modules that serve an all-categories feed are listed.
const moduleKeys = new Map<string, CivicplusFeedKey>([
  ['1', 'news-flash'],
  ['51', 'blog'],
  ['53', 'photo-gallery'],
  ['58', 'calendar'],
  ['63', 'alert-center'],
  ['64', 'real-estate'],
  ['65', 'agenda-center'],
  ['66', 'jobs'],
  ['92', 'media-center'],
])

const feeds = withHintLabels(civicplus.feeds)

type CivicplusFeedKey = Parameters<typeof feeds.getFeedEntry>[0]

export type CivicplusPage = { kind: 'module'; key: CivicplusFeedKey }

export const isCivicplusHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return (
      element.name === 'script' && startsWithAnyOf(element.attribs.src, '/Areas/Layout/Assets/')
    )
  })

  return script !== undefined
}

export const isCivicplusHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('CP_IsMobile')
}

// The `pageModuleID` input is left empty on the home page and on content pages. A page with no
// module feed gets the site-wide Pages feed.
const getCivicplusPage = (content: string | undefined): CivicplusPage => {
  const input = findElement(content, (element) => {
    return element.name === 'input' && element.attribs.id === 'pageModuleID'
  })

  return { kind: 'module', key: moduleKeys.get(input?.attribs.value ?? '') ?? 'pages' }
}

export const civicplusHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isCivicplusHtml, headers: isCivicplusHeaders })
  },

  resolve: (url, content) => {
    const page = getCivicplusPage(content)
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry(page.key)]
  },
}
