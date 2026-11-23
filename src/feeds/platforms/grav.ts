import { grav } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: page.

export type GravUrl = { kind: 'home' } | { kind: 'page'; path: string }

const gravAssetRegex = /\/user\/(?:themes|plugins)\//i
const gravCookieRegex = /^grav-site-[0-9a-f]+$/

const feeds = withHintLabels(grav.feeds)

// `GravCMS` in full, since the value is compared as a prefix and `Grav` matches `Gravity Forms`.
export const isGravHtml = (content: string): boolean => {
  if (hasMetaContent(content, 'generator', 'GravCMS')) {
    return true
  }

  const asset = findElement(content, (element) => {
    if (element.name === 'link') {
      return gravAssetRegex.test(element.attribs.href ?? '')
    }

    if (element.name === 'script') {
      return gravAssetRegex.test(element.attribs.src ?? '')
    }

    return false
  })

  return asset !== undefined
}

export const isGravHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => gravCookieRegex.test(name))
}

export const parseGravUrl = (url: string): GravUrl | undefined => {
  const page = grav.pages.read(url, { root: parseUrl(url)?.origin ?? '' })

  if (!page) {
    return
  }

  if (page.key === 'home') {
    return { kind: 'home' }
  }

  return { kind: 'page', path: `/${page.params.path.join('/')}` }
}

export const gravHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isGravHtml, headers: isGravHeaders })) {
      return false
    }

    return parseGravUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGravUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const path = parsed.kind === 'page' ? parsed.path.slice(1) : undefined

    return [page.getFeedEntry('page', { path }, 'rss'), page.getFeedEntry('page', { path }, 'atom')]
  },
}
