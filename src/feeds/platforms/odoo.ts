import { odoo } from 'feedintel'
import { isLocale, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OdooUrl = { kind: 'blog'; blog: string }

// The blog segment is `{slug}-{id}`, after an optional language prefix such as `/fr` or `/en_GB`.
const blogRegex = /^(?:\/([^/]+))?\/blog\/([^/]+-\d+)(?:\/|$)/i

const feeds = withHintLabels(odoo.feeds)

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

  const [, language, blog] = parsedUrl.pathname.match(blogRegex) ?? []

  if (!blog || (language && !isLocale(language, { underscore: true }))) {
    return
  }

  return { kind: 'blog', blog }
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

    return [page.getFeedEntry('blog', { blog: odooUrl.blog }, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
