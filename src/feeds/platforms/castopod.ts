import { castopod } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CastopodPage = { rootUrl: string; handle: string }

const feeds = withHintLabels(castopod.feeds)

// The install's root, read from the theme colors stylesheet a page links.
const getColorsRoot = (url: string, href: string | undefined): string | undefined => {
  const linkUrl = parseUrl(href, url)

  if (!linkUrl) {
    return
  }

  const link = castopod.pages.read(linkUrl.href, { isAnyHost: true })

  if (link?.key !== 'colors') {
    return
  }

  return link.params.root
}

const getCastopodPage = (url: string, content: string | undefined): CastopodPage | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'link' && getColorsRoot(url, element.attribs.href) !== undefined
  })
  const root = getColorsRoot(url, link?.attribs.href)

  if (!root) {
    return
  }

  const page = castopod.pages.read(url, { root })

  if (page?.key !== 'podcast') {
    return
  }

  return { rootUrl: page.params.root, handle: page.params.handle }
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

    return [feeds.getFeedEntry('podcast', { root: page.rootUrl, handle: page.handle })]
  },
}
