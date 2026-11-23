import { gancio } from 'feedintel'
import { endsWithAnyOf, isAnyOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type GancioPage =
  | { kind: 'tag' | 'place' | 'collection'; rootUrl: string; value: string }
  | { kind: 'site'; rootUrl: string }

const feeds = withHintLabels(gancio.feeds)

// The default layout prints the `custom_css` stylesheet in every page head, at the install's root.
const getGancioPage = (url: string, content: string | undefined): GancioPage | undefined => {
  const link = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      isAnyOf(element.attribs.rel, 'stylesheet') &&
      gancio.pages.read(parseUrl(element.attribs.href ?? '', url)?.href ?? '', { isAnyHost: true })
        ?.key === 'stylesheet'
    )
  })

  // The layout also loads the events web component, which a theme cannot drop.
  const script = findElement(content, (element) => {
    return element.name === 'script' && endsWithAnyOf(element.attribs.src, '/gancio-events.es.js')
  })

  if (!link?.attribs.href || !script) {
    return
  }

  const stylesheetUrl = parseUrl(link.attribs.href, url)?.href ?? ''
  const stylesheet = gancio.pages.read(stylesheetUrl, { isAnyHost: true })
  // The stylesheet counts only when its root holds the page.
  const page = gancio.pages.read(url, { root: stylesheet?.params.root ?? '' })

  if (!page) {
    return
  }

  const { root: rootUrl, tag, place, collection } = page.params

  if (page.key === 'tag') {
    return { kind: 'tag', rootUrl, value: tag }
  }

  if (page.key === 'place') {
    return { kind: 'place', rootUrl, value: place }
  }

  if (page.key === 'collection') {
    return { kind: 'collection', rootUrl, value: collection }
  }

  return { kind: 'site', rootUrl }
}

export const gancioHandler: PlatformHandler = {
  match: (url, content) => {
    return getGancioPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getGancioPage(url, content)

    if (!page) {
      return []
    }

    const root = page.rootUrl

    // Gancio 1 ignores `?tags=` and `?places=` on an instance that sets a home collection,
    // and serves that collection in their place.
    if (page.kind === 'tag') {
      return [feeds.getFeedEntry('tag', { root, tag: page.value })]
    }

    if (page.kind === 'place') {
      return [feeds.getFeedEntry('place', { root, place: page.value })]
    }

    if (page.kind === 'collection') {
      return [feeds.getFeedEntry('collection', { root, collection: page.value })]
    }

    return [feeds.getFeedEntry('site', { root })]
  },
}
