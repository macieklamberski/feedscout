import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OdooUrl = { kind: 'blog'; languagePath: string; blog: string }

// The blog segment is `{slug}-{id}`, after an optional language prefix such as `/fr` or `/en_GB`.
const blogRegex = /^((?:\/[a-z]+(?:_[a-z\d]+)?)?)\/blog\/([^/]+-\d+)(?:\/|$)/i

// Odoo's own site runs on www.odoo.com, and a database on its own domain is known only by its
// cookies, so feeds on either are built here but not claimed.
const domains = ['odoo.com']

const feeds = definePlatformFeeds(
  [
    { key: 'odoo:blog', template: '{scheme}://{host}/{language}/blog/{blog}/feed', format: 'atom' },
    { key: 'odoo:blog', template: '{scheme}://{host}/blog/{blog}/feed', format: 'atom' },
  ],
  { domains },
)

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

  const match = parsedUrl.pathname.match(blogRegex)

  if (!match?.[2]) {
    return
  }

  return { kind: 'blog', languagePath: match[1] ?? '', blog: match[2] }
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
    const page = feeds.forUrl(url)

    if (!odooUrl || !page) {
      return []
    }

    const { blog, languagePath } = odooUrl

    if (languagePath) {
      const language = languagePath.slice(1)

      return [page.getFeedEntry('odoo:blog', { language, blog }, 'atom')]
    }

    return [page.getFeedEntry('odoo:blog', { blog }, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
