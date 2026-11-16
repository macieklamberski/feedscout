import { decodeSegment, getOrigin, getPathSegments, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, isRootOfPage } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CastopodPage = { rootUrl: string; handle: string }

const colorsPathRegex = /\/themes\/colors$/i
const handleRegex = /^@(\w+)$/

// An install runs on its own domain, under the root its stylesheet names, and is known only by its
// marker, so its feed is built here but not claimed.
const feeds = definePlatformFeeds([{ key: 'castopod:podcast', main: '{root}/@{handle}/feed.xml' }])

// Core prints the theme colors stylesheet in every page head, at the install's root. Every page
// under `/@{handle}` belongs to that podcast, and a remote actor's `@user@domain` has no feed here.
const getCastopodPage = (url: string, content: string | undefined): CastopodPage | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'link' && colorsPathRegex.test(element.attribs.href ?? '')
  })

  const linkUrl = link?.attribs.href ? parseUrl(link.attribs.href, url) : undefined
  const linkOrigin = getOrigin(linkUrl)

  if (!linkUrl || !linkOrigin) {
    return
  }

  const rootPath = linkUrl.pathname.replace(colorsPathRegex, '')

  if (!isRootOfPage(`${linkOrigin}${rootPath}`, url)) {
    return
  }

  const rootUrl = `${new URL(url).origin}${rootPath}`
  const [handleSegment] = getPathSegments(url).slice(getPathSegments(rootUrl).length)
  const handle = decodeSegment(handleSegment)?.match(handleRegex)?.[1]

  if (!handle) {
    return
  }

  return { rootUrl, handle }
}

export const castopodHandler: PlatformHandler = {
  match: (url, content) => {
    return getCastopodPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getCastopodPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('castopod:podcast', { root: page.rootUrl, handle: page.handle })]
  },
}
