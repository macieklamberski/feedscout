import { civicplus } from 'feedintel'
import { startsWithAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

// The module ids that serve an all-categories feed. A module id with no feed answers 200 with an
// empty body.
const moduleKeys = new Map<string, CivicplusFeedKey>([
  ['1', 'civicplus:news-flash'],
  ['51', 'civicplus:blog'],
  ['53', 'civicplus:photo-gallery'],
  ['58', 'civicplus:calendar'],
  ['63', 'civicplus:alert-center'],
  ['64', 'civicplus:real-estate'],
  ['65', 'civicplus:agenda-center'],
  ['66', 'civicplus:jobs'],
  ['92', 'civicplus:media-center'],
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

// Every module page prints its module id in a hidden `pageModuleID` input, left empty on the
// home page and on content pages. A page with no module feed gets the site-wide Pages feed.
const getCivicplusPage = (content: string | undefined): CivicplusPage => {
  const input = findElement(content, (element) => {
    return element.name === 'input' && element.attribs.id === 'pageModuleID'
  })

  return { kind: 'module', key: moduleKeys.get(input?.attribs.value ?? '') ?? 'civicplus:pages' }
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
