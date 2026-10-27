import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OdooUrl = { kind: 'blog'; languagePath: string; blog: string }

// The blog segment is `{slug}-{id}`, after an optional language prefix such as `/fr` or `/en_GB`.
const blogRegex = /^(?<languagePath>(?:\/[a-z]+(?:_[a-z\d]+)?)?)\/blog\/(?<blog>[^/]+-\d+)(?:\/|$)/i

// Odoo 11 and later set both cookies on a first visit to any website page.
export const isOdooHeaders = (headers: Headers): boolean => {
  const cookieNames = getCookieNames(headers)

  return cookieNames.includes('frontend_lang') && cookieNames.includes('session_id')
}

export const parseOdooUrl = (url: string): OdooUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { languagePath, blog } = parsedUrl.pathname.match(blogRegex)?.groups ?? {}

  if (!blog) {
    return
  }

  return { kind: 'blog', languagePath: languagePath ?? '', blog }
}

export const odooHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isOdooHeaders })) {
      return false
    }

    return parseOdooUrl(url) !== undefined
  },

  resolve: (url) => {
    const odooUrl = parseOdooUrl(url)

    if (!odooUrl) {
      return []
    }

    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}${odooUrl.languagePath}/blog/${odooUrl.blog}/feed`,
        hint: composeHint('odoo:blog', 'atom'),
      },
    ]
  },
}
