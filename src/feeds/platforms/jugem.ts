import { getPathSegments, isHostOf, isHostOrSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JugemUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'theme'; category: string; theme: string }
  | { kind: 'customDomain' }

const domains = ['jugem.cc', 'jugem.jp']
const assetHosts = ['imaging.jugem.jp']
const cookieScriptPath = './template/js/cookie.js'
const portalHosts = ['jugem.jp']
const themeCategoryRegex = /^c\d+$/

// A custom domain is known only by its markers, so its feeds are built here but not claimed. An
// older template links the same feeds at /index.rdf and /atom.xml.
const feeds = definePlatformFeeds(
  [
    { key: 'jugem:posts', template: '{scheme}://{host}/?mode=rss', format: 'rdf' },
    { key: 'jugem:posts', template: '{scheme}://{host}/?mode=atom', format: 'atom' },
    { key: 'jugem:posts', template: '{scheme}://{host}/index.rdf', format: 'rdf' },
    { key: 'jugem:posts', template: '{scheme}://{host}/atom.xml', format: 'atom' },
    // The portal answers https with a redirect to http, which the theme feed names as its own URL.
    {
      key: 'jugem:theme',
      template: 'http://jugem.jp/theme/{category}/{theme}/rss',
      format: 'rdf',
    },
  ],
  { domains },
)

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
      return [
        page.getFeedEntry('jugem:theme', { category: parsed.category, theme: parsed.theme }, 'rdf'),
      ]
    }

    return [
      page.getFeedEntry('jugem:posts', {}, 'rdf'),
      page.getFeedEntry('jugem:posts', {}, 'atom'),
    ]
  },

  // The table ignores www, so it would read www.{blog}.jugem.jp, a host with no DNS record, as a
  // blog. The page parser refuses it first.
  getFeedHint: (url) => {
    const parsed = parseJugemUrl(url)

    if (!parsed || parsed.kind === 'customDomain') {
      return
    }

    return feeds.getFeedHint(url)
  },
}
