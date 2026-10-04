import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, findElements, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const templateStylesheetRegex = /^(?:https?:)?\/\/catalog\.wlimg\.com\/templates-images\//
const vacanciesFeedPathRegex = /^\/vacancy\.rss$/
const jobOpeningFeedPathRegex = /^\/vacancy_\d+\.rss$/

export type PlacementIndiaPage = { feedUrl: string; jobOpeningFeedUrl?: string }

// Every Weblink.In catalog site loads its template stylesheet from the shared asset host.
export const isPlacementIndiaHtml = (content: string): boolean => {
  const stylesheet = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'stylesheet' &&
      templateStylesheetRegex.test(element.attribs.href ?? '')
    )
  })

  return stylesheet !== undefined
}

// Weblink.In builds its exporter, real estate, travel and services sites on the same template, and
// there `/vacancy.rss` answers a blank HTML page, so only a page linking the feed has one.
const getPlacementIndiaPage = (
  url: string,
  content: string | undefined,
): PlacementIndiaPage | undefined => {
  if (!content) {
    return
  }

  const { host } = new URL(url)
  const anchors = findElements(content, (element) => element.name === 'a')
  let feedUrl: string | undefined
  let jobOpeningFeedUrl: string | undefined

  for (const anchor of anchors) {
    const target = parseUrl(anchor.attribs.href ?? '', url)

    if (target?.host !== host) {
      continue
    }

    if (vacanciesFeedPathRegex.test(target.pathname)) {
      feedUrl ??= target.href
    }

    // A `/vacancy_{id}.rss` with an id no opening has answers a blank HTML page, so the id comes
    // only from the job page's own link.
    if (jobOpeningFeedPathRegex.test(target.pathname)) {
      jobOpeningFeedUrl ??= target.href
    }
  }

  if (!feedUrl) {
    return
  }

  return { feedUrl, jobOpeningFeedUrl }
}

export const placementIndiaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isPlacementIndiaHtml })) {
      return false
    }

    return getPlacementIndiaPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getPlacementIndiaPage(url, content)

    if (!page) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (page.jobOpeningFeedUrl) {
      uris.push({
        uri: page.jobOpeningFeedUrl,
        hint: composeHint('placement-india:job-opening'),
      })
    }

    uris.push({ uri: page.feedUrl, hint: composeHint('placement-india:vacancy') })

    return uris
  },
}
