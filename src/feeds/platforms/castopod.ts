import { castopod } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getSiteParams, getSiteUrl, isRootOfPage } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CastopodPage = { rootUrl: string; handle: string }

const feeds = withHintLabels(castopod.feeds)

// The install's root, read from the theme colors stylesheet a page links.
const getColorsRoot = (url: string, href: string | undefined): string | undefined => {
  const linkUrl = parseUrl(href, url)

  if (!linkUrl) {
    return
  }

  const link = castopod.pages.readUrl(linkUrl.href, { isAnyHost: true })

  if (link?.key !== 'colors') {
    return
  }

  return getSiteUrl(link.values)
}

const getCastopodPage = (url: string, content: string | undefined): CastopodPage | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'link' && getColorsRoot(url, element.attribs.href) !== undefined
  })
  const root = getColorsRoot(url, link?.attribs.href)

  if (!root || !isRootOfPage(root, url)) {
    return
  }

  const page = castopod.pages.readUrl(url, { base: getSiteParams(root)?.base })

  if (page?.key !== 'podcast') {
    return
  }

  return { rootUrl: getSiteUrl(page.values), handle: page.values.handle }
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

    return [feeds.getFeedEntry('podcast', { ...getSiteParams(page.rootUrl), handle: page.handle })]
  },
}
