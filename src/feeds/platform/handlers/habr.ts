import { isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Habr serves feeds under a language segment: `/{lang}/rss/articles/`, plus hub,
// user and company variants. The language segment is required and mirrors the
// page URL, and every one of these paths needs its trailing slash.

const hosts = ['habr.com', 'www.habr.com']
const languages = ['ru', 'en']
const hubRegex = /\/hubs?\/([^/]+)/
const userRegex = /\/users\/([^/]+)/
const companyRegex = /\/compan(?:y|ies)\/([^/]+)/

const getLanguage = (pathname: string): string => {
  const [first] = pathname.split('/').filter(Boolean)

  return first && languages.includes(first) ? first : 'ru'
}

export const habrHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const base = `${origin}/${getLanguage(pathname)}/rss`
      const uris: Array<DiscoverUriEntry> = []
      const hub = pathname.match(hubRegex)?.[1]
      const user = pathname.match(userRegex)?.[1]
      const company = pathname.match(companyRegex)?.[1]

      if (hub) {
        uris.push({ uri: `${base}/hub/${hub}/`, hint: composeHint('habr:hub') })
      }

      if (user) {
        uris.push({ uri: `${base}/users/${user}/posts/`, hint: composeHint('habr:user') })
      }

      if (company) {
        uris.push({
          uri: `${base}/companies/${company}/articles/`,
          hint: composeHint('habr:company'),
        })
      }

      uris.push({ uri: `${base}/articles/`, hint: composeHint('habr:articles') })

      return uris
    } catch {}

    return []
  },
}
