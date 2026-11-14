import { getPathSegments, isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WixUrl = { kind: 'freeSite'; site: string } | { kind: 'site' }

// Wix Studio serves its free sites the same way, under a path on `{account}.wixstudio.com`.
const domains = ['wixsite.com', 'wixstudio.com']
const assetHosts = ['static.parastorage.com']

// Wix answers a free site's feed under any one segment after the site path, such as a language.
const freeSiteFeeds = definePlatformFeeds(
  [
    { key: 'wix:blog', template: '{scheme}://{host}/{site}/blog-feed.xml' },
    {
      key: 'wix:blog',
      template: '{scheme}://{host}/{site}/{section}/blog-feed.xml',
      isAlias: true,
    },
  ],
  { domains },
)

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

// A free site lives under a path on `{account}.wixsite.com` or `{account}.wixstudio.com`, whose
// root answers 404.
export const parseWixUrl = (url: string): WixUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [site] = getPathSegments(parsedUrl)

  if (isSubdomainOf(parsedUrl, domains) && site) {
    return { kind: 'freeSite', site }
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
    const page = parsed?.kind === 'freeSite' ? freeSiteFeeds.forUrl(url) : siteFeeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'freeSite') {
      return [page.getFeedEntry('wix:blog', { site: parsed.site })]
    }

    return [page.getFeedEntry('wix:blog')]
  },

  getFeedHint: freeSiteFeeds.getFeedHint,
}
