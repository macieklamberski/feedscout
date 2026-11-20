import { placementIndia } from 'feedintel'
import { isAnyOf, isHostOf, isPresent, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, findElements, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PlacementIndiaPage = {
  vacancyRoot: string
  jobOpeningRoot?: string
  jobOpeningId?: string
}

const templateStylesheetRegex = /^(?:https?:)?\/\/catalog\.wlimg\.com\/templates-images\//i
const jobOpeningFeedPathRegex = /^\/vacancy_(\d+)\.rss$/i

const feeds = withHintLabels(placementIndia.feeds)

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

  const { hostname } = new URL(url)
  const anchors = findElements(content, (element) => element.name === 'a')
  let vacancyRoot: string | undefined
  let jobOpeningRoot: string | undefined
  let jobOpeningId: string | undefined

  for (const anchor of anchors) {
    const target = parseUrl(anchor.attribs.href, url)

    if (!target || !isHostOf(target, hostname)) {
      continue
    }

    if (isAnyOf(target.pathname, '/vacancy.rss') && vacancyRoot === undefined) {
      vacancyRoot = target.origin
    }

    // A `/vacancy_{id}.rss` with an id no opening has answers a blank HTML page, so the id comes
    // only from the job page's own link.
    const linkedJobOpeningId = jobOpeningFeedPathRegex.exec(target.pathname)?.[1]

    if (linkedJobOpeningId && jobOpeningId === undefined) {
      jobOpeningRoot = target.origin
      jobOpeningId = linkedJobOpeningId
    }
  }

  if (!vacancyRoot) {
    return
  }

  return { vacancyRoot, jobOpeningRoot, jobOpeningId }
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

    return [
      feeds.getFeedEntry('job-opening', { root: page.jobOpeningRoot, id: page.jobOpeningId }),
      feeds.getFeedEntry('vacancy', { root: page.vacancyRoot }),
    ].filter(isPresent)
  },
}
