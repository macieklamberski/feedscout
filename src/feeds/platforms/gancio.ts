import { getPathSegments, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const customCssPathRegex = /\/custom_css$/
const trailingSlashesRegex = /\/+$/

// The default layout prints the `custom_css` stylesheet in every page head, at the install's root.
const getRootUrl = (url: string, content: string | undefined): string | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'link' && customCssPathRegex.test(element.attribs.href ?? '')
  })

  if (!link?.attribs.href) {
    return
  }

  const rootPath = new URL(link.attribs.href, url).pathname
    .replace(customCssPathRegex, '')
    .replace(trailingSlashesRegex, '')

  return `${new URL(url).origin}${rootPath}`
}

export const gancioHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && getRootUrl(url, content) !== undefined
  },

  resolve: (url, content) => {
    const rootUrl = getRootUrl(url, content)

    if (!rootUrl) {
      return []
    }

    const [section, value] = getPathSegments(url).slice(getPathSegments(rootUrl).length)

    // Gancio 1 ignores `?tags=` and `?places=` on an instance that sets a home collection,
    // and serves that collection in their place.
    if (value && isAnyOf(section, 'tag')) {
      return [{ uri: `${rootUrl}/feed/rss/tag/${value}`, hint: composeHint('gancio:tag') }]
    }

    // A place page is `/place/{id}/{name}`, and the feed takes the id.
    if (value && isAnyOf(section, 'place')) {
      return [{ uri: `${rootUrl}/feed/rss/place/${value}`, hint: composeHint('gancio:place') }]
    }

    if (value && isAnyOf(section, 'collection')) {
      return [
        {
          uri: `${rootUrl}/feed/rss/collection/${value}`,
          hint: composeHint('gancio:collection'),
        },
      ]
    }

    return [{ uri: `${rootUrl}/feed/rss`, hint: composeHint('gancio:site') }]
  },
}
