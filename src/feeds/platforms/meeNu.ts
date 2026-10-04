import { getSubdomain, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type MeeNuUrl = { kind: 'blog' }

const domains = ['mee.nu']

const baseHrefRegex = /<base\s[^>]*href="([^"]+)"/i

// Service hosts: files, images and mail resolve off the blog farm, scripts and smilies serve
// assets, and www serves the platform's portal.
const excludedSubdomains = ['files', 'images', 'mail', 'scripts', 'smilies', 'www']

export const parseMeeNuUrl = (url: string): MeeNuUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  // A nested subdomain like a.b.mee.nu fails TLS and answers "No site matching" over http.
  if (!subdomain || subdomain.includes('.') || isAnyOf(subdomain, excludedSubdomains)) {
    return
  }

  return { kind: 'blog' }
}

export const meeNuHandler: PlatformHandler = {
  match: (url) => {
    return parseMeeNuUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseMeeNuUrl(url)

    if (!parsed) {
      return []
    }

    const pageUrl = new URL(url)
    const baseHref = content?.match(baseHrefRegex)?.[1]
    let origin = pageUrl.origin

    // The page's <base href> names the blog over http even when the page is served over https,
    // and its feed links resolve against it, so the feeds take its scheme to dedupe against them.
    if (baseHref && isHostOf(baseHref, [pageUrl.hostname])) {
      origin = new URL(baseHref).origin
    }

    return [
      { uri: `${origin}/feed/rss`, hint: composeHint('mee-nu:posts', 'rss') },
      { uri: `${origin}/feed/atom`, hint: composeHint('mee-nu:posts', 'atom') },
    ]
  },
}
