import { laget } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: news.

export type LagetUrl = { kind: 'team'; team: string }

// A bare `laget.se` also matches other domains, such as `snickeribolaget.se`.
const lagetAssetRegex = /^(?:https?:)?\/\/[a-z]-content\.laget\.se\//i

const assetTags = ['link', 'script']

const feeds = withHintLabels(laget.feeds)

// Both club templates load their stylesheets and scripts from the asset host, on an own domain too.
export const isLagetHtml = (content: string): boolean => {
  const asset = findElement(content, (element) => {
    const source = element.attribs.href ?? element.attribs.src ?? ''

    return assetTags.includes(element.name) && lagetAssetRegex.test(source)
  })

  return asset !== undefined
}

export const parseLagetUrl = (url: string): LagetUrl | undefined => {
  const page = laget.pages.read(url)

  if (page?.key !== 'team') {
    return
  }

  return { kind: 'team', team: page.params.team }
}

export const lagetHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (laget.pages.read(url)) {
      return parseLagetUrl(url) !== undefined
    }

    return hasMarker(content, headers, { html: isLagetHtml })
  },

  resolve: (url) => {
    const parsed = parseLagetUrl(url)

    if (parsed) {
      // The team page links its feed with the team spelled as the request spelled it.
      return [feeds.getFeedEntry('news', { team: parsed.team })]
    }

    const page = feeds.forUrl(url)

    if (laget.pages.read(url) || !page) {
      return []
    }

    return [page.getFeedEntry('news')]
  },

  getFeedHint: feeds.getFeedHint,
}
