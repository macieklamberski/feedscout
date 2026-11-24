import { transistor } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TransistorUrl = { kind: 'show'; slug: string }
export type TransistorPage = TransistorUrl

const feeds = withHintLabels(transistor.feeds)

export const parseTransistorUrl = (url: string): TransistorUrl | undefined => {
  const page = transistor.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'show', slug: page.params.slug }
}

export const getTransistorPage = (
  url: string,
  content: string | undefined,
): TransistorPage | undefined => {
  const parsed = parseTransistorUrl(url)

  if (!parsed) {
    return
  }

  // The show page links its feed, and the feed slug is not always the subdomain.
  const link = findElement(content, (element) => {
    return transistor.feeds.read(element.attribs.href ?? '') !== undefined
  })
  const linkedSlug = transistor.feeds.read(link?.attribs.href ?? '')?.params.slug

  return { kind: 'show', slug: linkedSlug ?? parsed.slug }
}

export const transistorHandler: PlatformHandler = {
  match: (url) => {
    return parseTransistorUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getTransistorPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { slug: page.slug })]
  },

  getFeedHint: feeds.getFeedHint,
}
