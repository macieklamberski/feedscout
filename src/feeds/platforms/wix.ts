import { getPathSegments, getSubdomain, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WixUrl = { kind: 'freeSite'; account: string; site: string } | { kind: 'site' }

const domains = ['wixsite.com']
const assetHosts = ['static.parastorage.com']

// Wix answers a free site's feed under any one segment after the site path, such as a language.
const freeSiteFeeds = definePlatformFeeds([
  { key: 'wix:blog', template: 'https://{account}.wixsite.com/{site}/blog-feed.xml' },
  { key: 'wix:blog', template: 'https://{account}.wixsite.com/{site}/{section}/blog-feed.xml' },
])

// A site on its own domain is known only by its markers, so its feed is built but not claimed.
const siteFeeds = definePlatformFeeds(
  [{ key: 'wix:blog', template: '{scheme}://{host}/blog-feed.xml' }],
  { domains },
)

export const isWixHtml = (content: string): boolean => {
  if (hasMetaContent(content, 'generator', 'Wix.com')) {
    return true
  }

  const script = findElement(content, (element) => {
    return element.name === 'script' && isHostOf(element.attribs.src ?? '', assetHosts)
  })

  return script !== undefined
}

export const isWixHeaders = (headers: Headers): boolean => {
  return headers.has('x-wix-request-id')
}

// A free site lives under a path on `{account}.wixsite.com`, whose root answers 404.
export const parseWixUrl = (url: string): WixUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const account = getSubdomain(parsedUrl, domains)
  const [site] = getPathSegments(parsedUrl)

  if (account && site) {
    return { kind: 'freeSite', account, site }
  }

  return { kind: 'site' }
}

export const wixHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isWixHtml, headers: isWixHeaders })) {
      return false
    }

    return parseWixUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseWixUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'freeSite') {
      return [
        freeSiteFeeds.getFeedEntry('wix:blog', { account: parsed.account, site: parsed.site }),
      ]
    }

    const { protocol, host } = new URL(url)

    return [siteFeeds.getFeedEntry('wix:blog', { scheme: protocol.slice(0, -1), host })]
  },

  getFeedHint: freeSiteFeeds.getFeedHint,
}
