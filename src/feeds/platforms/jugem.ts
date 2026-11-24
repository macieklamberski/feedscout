import { jugem } from 'feedintel'
import { getPathSegments, isHostOf, isHostOrSubdomainOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JugemUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'theme'; category: string; theme: string }
  | { kind: 'customDomain' }

const domains = jugem.hosts.tenants
const assetHosts = ['imaging.jugem.jp']
const cookieScriptPath = './template/js/cookie.js'
const portalHosts = ['jugem.jp']
const themeCategoryRegex = /^c\d+$/

const feeds = withHintLabels(jugem.feeds)

const isJugemAsset = (assetUrl: string | undefined): boolean => {
  if (!assetUrl) {
    return false
  }

  return assetUrl === cookieScriptPath || isHostOf(assetUrl, assetHosts)
}

// Every blog template loads its favicon or scripts from imaging.jugem.jp, or the cookie script by
// its relative path, on a custom domain too.
export const isJugemHtml = (content: string): boolean => {
  const asset = findElement(content, (element) => {
    if (element.name === 'link') {
      return isJugemAsset(element.attribs.href)
    }

    if (element.name === 'script') {
      return isJugemAsset(element.attribs.src)
    }

    return false
  })

  return asset !== undefined
}

export const parseJugemUrl = (url: string): JugemUrl | undefined => {
  if (!isHostOrSubdomainOf(url, domains)) {
    return { kind: 'customDomain' }
  }

  // A portal theme page, /theme/c{n}/{id}/, lists posts from many blogs under one theme.
  if (isHostOf(url, portalHosts)) {
    const [route, category, theme] = getPathSegments(url)

    if (
      route !== 'theme' ||
      !category ||
      !theme ||
      !themeCategoryRegex.test(category) ||
      !digitsRegex.test(theme)
    ) {
      return
    }

    return { kind: 'theme', category, theme }
  }

  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const jugemHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseJugemUrl(url)

    if (parsed?.kind === 'customDomain') {
      return hasMarker(content, headers, { html: isJugemHtml })
    }

    return parsed !== undefined
  },

  resolve: (url) => {
    const parsed = parseJugemUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'theme') {
      return [page.getFeedEntry('theme', { category: parsed.category, theme: parsed.theme }, 'rdf')]
    }

    return [page.getFeedEntry('posts', {}, 'rdf'), page.getFeedEntry('posts', {}, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
