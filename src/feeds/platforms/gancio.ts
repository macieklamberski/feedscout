import { getAnyOf, getPathSegments, isAnyOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const customCssPathRegex = /\/custom_css$/i
const trailingSlashesRegex = /(?<!\/)\/+$/
const eventsScriptRegex = /\/gancio-events\.es\.js$/

export type GancioPage =
  | { kind: 'tag' | 'place' | 'collection'; rootUrl: string; value: string }
  | { kind: 'site'; rootUrl: string }

const sections = ['tag', 'place', 'collection'] as const

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
    return element.name === 'script' && eventsScriptRegex.test(element.attribs.src ?? '')
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

    const { rootUrl } = page

    // Gancio 1 ignores `?tags=` and `?places=` on an instance that sets a home collection,
    // and serves that collection in their place.
    if (page.kind === 'tag') {
      return [{ uri: `${rootUrl}/feed/rss/tag/${page.value}`, hint: composeHint('gancio:tag') }]
    }

    if (page.kind === 'place') {
      return [{ uri: `${rootUrl}/feed/rss/place/${page.value}`, hint: composeHint('gancio:place') }]
    }

    if (page.kind === 'collection') {
      return [
        {
          uri: `${rootUrl}/feed/rss/collection/${page.value}`,
          hint: composeHint('gancio:collection'),
        },
      ]
    }

    return [{ uri: `${rootUrl}/feed/rss`, hint: composeHint('gancio:site') }]
  },
}
