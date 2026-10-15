import { isHostOf, isHostOrSubdomainOf, resolveUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, customDomain.

export type EklablogUrl = { kind: 'blog' } | { kind: 'customDomain' }

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
const connectHosts = ['connect.eklablog.com']

const isConnectScript = (src: string | undefined): boolean => {
  return isHostOf(resolveUrl(src ?? '') ?? '', connectHosts)
}

// Every blog page loads the login ping script from connect.eklablog.com, on a custom domain too.
export const isEklablogHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && isConnectScript(element.attribs.src)
  })

  return script !== undefined
}

export const parseEklablogUrl = (url: string): EklablogUrl | undefined => {
  if (!isHostOrSubdomainOf(url, domains)) {
    return { kind: 'customDomain' }
  }

  const subdomain = getTenantSubdomain(url, domains)

  if (!subdomain) {
    return
  }

  return { kind: 'blog' }
}

export const eklablogHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseEklablogUrl(url)

    if (parsed?.kind === 'customDomain') {
      return hasMarker(content, headers, { html: isEklablogHtml })
    }

    return parsed !== undefined
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
