import { endsWithAnyOf, getAnyOf, getPathSegments, isAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const customCssPathRegex = /\/custom_css$/i
const trailingSlashesRegex = /(?<!\/)\/+$/

export type GancioPage =
  | { kind: 'tag' | 'place' | 'collection'; rootUrl: string; value: string }
  | { kind: 'site'; rootUrl: string }

const sections = ['tag', 'place', 'collection'] as const

// An instance is self-hosted on any domain, so the table only builds its feeds.
const feeds = definePlatformFeeds([
  { key: 'gancio:tag', template: '{root}/feed/rss/tag/{tag}' },
  { key: 'gancio:place', template: '{root}/feed/rss/place/{place}' },
  { key: 'gancio:collection', template: '{root}/feed/rss/collection/{collection}' },
  { key: 'gancio:site', template: '{root}/feed/rss' },
])

// The default layout prints the `custom_css` stylesheet in every page head, at the install's root.
const getGancioPage = (url: string, content: string | undefined): GancioPage | undefined => {
  const link = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      isAnyOf(element.attribs.rel, 'stylesheet') &&
      customCssPathRegex.test(element.attribs.href ?? '')
    )
  })

  // The layout also loads the events web component, which a theme cannot drop.
  const script = findElement(content, (element) => {
    return element.name === 'script' && endsWithAnyOf(element.attribs.src, '/gancio-events.es.js')
  })

  if (!link?.attribs.href || !script) {
    return
  }

  const stylesheetUrl = parseUrl(link.attribs.href, url)
  const { origin, pathname } = new URL(url)

  if (!stylesheetUrl || stylesheetUrl.origin !== origin) {
    return
  }

  const rootPath = stylesheetUrl.pathname
    .replace(customCssPathRegex, '')
    .replace(trailingSlashesRegex, '')

  // The stylesheet counts only when its root holds the page.
  if (!`${pathname}/`.startsWith(`${rootPath}/`)) {
    return
  }

  const rootUrl = `${origin}${rootPath}`
  const [section, value] = getPathSegments(url).slice(getPathSegments(rootUrl).length)
  const kind = getAnyOf(section, sections)

  // A place page is `/place/{id}/{name}`, and the feed takes the id.
  if (value && kind) {
    return { kind, rootUrl, value }
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
      return [feeds.getFeedEntry('gancio:tag', { root, tag: page.value })]
    }

    if (page.kind === 'place') {
      return [feeds.getFeedEntry('gancio:place', { root, place: page.value })]
    }

    if (page.kind === 'collection') {
      return [feeds.getFeedEntry('gancio:collection', { root, collection: page.value })]
    }

    return [feeds.getFeedEntry('gancio:site', { root })]
  },
}
