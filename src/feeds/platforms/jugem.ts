import { isHostOf, isHostOrSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JugemUrl = { kind: 'blog'; blog: string } | { kind: 'customDomain' }

const domains = ['jugem.cc', 'jugem.jp']
const assetHosts = ['imaging.jugem.jp']
const cookieScriptPath = './template/js/cookie.js'

// A custom domain is known only by its markers, so its feeds are built here but not claimed. An
// older template links the same feeds at /index.rdf and /atom.xml.
const feeds = definePlatformFeeds(
  [
    { key: 'jugem:posts', template: '{scheme}://{host}/?mode=rss', format: 'rdf' },
    { key: 'jugem:posts', template: '{scheme}://{host}/?mode=atom', format: 'atom' },
    { key: 'jugem:posts', template: '{scheme}://{host}/index.rdf', format: 'rdf' },
    { key: 'jugem:posts', template: '{scheme}://{host}/atom.xml', format: 'atom' },
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

    if (!parsed) {
      return []
    }

    const { protocol, host } = new URL(url)
    const params = { scheme: protocol.slice(0, -1), host }

    return [
      feeds.getFeedEntry('jugem:posts', params, 'rdf'),
      feeds.getFeedEntry('jugem:posts', params, 'atom'),
    ]
  },

  // The table reads any host under the domains, so the page parser refuses the portal and a nested
  // subdomain first.
  getFeedKey: (url) => {
    if (parseJugemUrl(url)?.kind !== 'blog') {
      return
    }

    return feeds.getFeedKey(url)
  },
}
