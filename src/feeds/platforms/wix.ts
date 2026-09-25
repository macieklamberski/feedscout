import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['wixsite.com']

export const isWixHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'Wix.com') || content.includes('static.parastorage.com')
  )
}

export const isWixHeaders = (headers: Headers): boolean => {
  return headers.has('x-wix-request-id')
}

// A free site lives under a path on `{account}.wixsite.com`, whose root answers 404.
const getSiteUrl = (url: string): string => {
  const { origin, pathname } = new URL(url)
  const [site] = pathname.split('/').filter(Boolean)

  return isSubdomainOf(url, domains) && site ? `${origin}/${site}` : origin
}

export const wixHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!URL.canParse(url)) {
      return false
    }

    if (content && isWixHtml(content)) {
      return true
    }

    if (headers && isWixHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
    return [{ uri: `${getSiteUrl(url)}/blog-feed.xml`, hint: composeHint('wix:blog') }]
  },
}
