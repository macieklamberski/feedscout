import { getSubdomain, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OverblogUrl = { kind: 'blog' }

const domains = [
  'over-blog.com',
  'over-blog.de',
  'over-blog.es',
  'over-blog.fr',
  'over-blog.it',
  'over-blog.net',
  'over-blog.org',
  'over.blog',
  'overblog.com',
  'overblog.fr',
]

// Service hosts resolve off the blog farm. The same names on the other domains are blog hosts.
const excludedHosts = [
  'admin.over-blog.com',
  'admin.overblog.com',
  'api.over-blog.com',
  'api2.over-blog.com',
  'app.over-blog.com',
  'assets.over-blog.com',
  'beta.over-blog.com',
  'beta.overblog.com',
  'connect.over-blog.com',
  'de.over-blog.com',
  'de.overblog.com',
  'en.over-blog.com',
  'en.overblog.com',
  'es.over-blog.com',
  'es.overblog.com',
  'fdata.over-blog.com',
  'fdata.over-blog.net',
  'fonts.over-blog.com',
  'forum.over-blog.de',
  'forums.over-blog.de',
  'fr.over-blog.com',
  'fr.overblog.com',
  'idata.over-blog.com',
  'image.over-blog.com',
  'img.over-blog.com',
  'img2.over-blog.com',
  'it.over-blog.com',
  'it.overblog.com',
  'media.over-blog.com',
  'my.over-blog.com',
  'my.overblog.com',
  'newsletter.over-blog.com',
  'pay.over-blog.com',
  'premium.over-blog.com',
  'shop.over-blog.com',
]

export const parseOverblogUrl = (url: string): OverblogUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  // A nested subdomain like a.b.over-blog.com fails TLS, since the certificate covers one label.
  // No blog serves the www host: it redirects to the portal or answers 404.
  if (!subdomain || subdomain.includes('.') || subdomain === 'www') {
    return
  }

  if (isHostOf(url, excludedHosts)) {
    return
  }

  return { kind: 'blog' }
}

export const overblogHandler: PlatformHandler = {
  match: (url) => {
    return parseOverblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseOverblogUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/rss`, hint: composeHint('overblog:posts') })

    return uris
  },
}
