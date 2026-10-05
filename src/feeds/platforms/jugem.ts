import { getSubdomain, isHostOf, isHostOrSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JugemUrl = { kind: 'blog'; blog: string } | { kind: 'customDomain' }

const domains = ['jugem.cc', 'jugem.jp']
const assetHosts = ['imaging.jugem.jp']
const cookieScriptPath = './template/js/cookie.js'

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

  const blog = getSubdomain(url, domains)

  // Only {blog}.jugem.jp and {blog}.jugem.cc name a blog, www and the apex are the portal.
  if (!blog || blog.includes('.') || blog === 'www') {
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

    const { origin } = new URL(url)

    return [
      { uri: `${origin}/?mode=rss`, hint: composeHint('jugem:posts', 'rdf') },
      { uri: `${origin}/?mode=atom`, hint: composeHint('jugem:posts', 'atom') },
    ]
  },
}
