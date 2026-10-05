import { getSubdomain, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type EklablogUrl = { kind: 'blog' }

const domains = [
  'blogg.org',
  'blogueuse.fr',
  'cd.st',
  'doremiblog.com',
  'ek.la',
  'eklablog.com',
  'eklablog.fr',
  'eklablog.net',
  'id.st',
  'jeblog.fr',
  'kazeo.com',
  'kif.fr',
  'lo.gs',
  'revolublog.com',
  'zic.fr',
]

// Only eklablog.com runs service hosts. On the other domains these names are blog hosts.
const excludedHosts = [
  'admin.eklablog.com',
  'assets.eklablog.com',
  'connect.eklablog.com',
  'image.eklablog.com',
  'www.eklablog.com',
]

export const parseEklablogUrl = (url: string): EklablogUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  // A nested subdomain like a.b.eklablog.com fails TLS, since the certificate covers one label.
  if (!subdomain || subdomain.includes('.')) {
    return
  }

  if (isHostOf(url, excludedHosts)) {
    return
  }

  return { kind: 'blog' }
}

export const eklablogHandler: PlatformHandler = {
  match: (url) => {
    return parseEklablogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseEklablogUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/rss`, hint: composeHint('eklablog:posts') })
    uris.push({ uri: `${origin}/rss/comments`, hint: composeHint('eklablog:comments') })

    return uris
  },
}
