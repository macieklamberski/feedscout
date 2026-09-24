import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMetaContent } from '../../common/utils.js'
import type { FaviconEnricher } from '../types.js'
import { parseBodyJson } from '../utils.js'

const platform = 'mastodon'

const mastodonRegex = /mastodon/i

// Extracts the username from the path, stripping the .rss feed extension
// that Mastodon appends to profile URLs (e.g., /@user.rss).
const profileRegex = /^\/@([^/.]+(?:@[^/.]+\.[^/.]+)?)(?:\.rss)?\/?$/

export const isProfilePath = (pathname: string): boolean => {
  return profileRegex.test(pathname)
}

// Current Mastodon serves no generator meta, so the `<div id="mastodon">` app
// root is matched too.
export const isMastodonHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Mastodon') || content.includes('id="mastodon"')
}

export const isMastodonHeaders = (headers: Headers): boolean => {
  return mastodonRegex.test(headers.get('server') ?? '')
}

export const mastodonHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { pathname } = parsedUrl

    if (!isProfilePath(pathname)) {
      return false
    }

    if (content && isMastodonHtml(content)) {
      return true
    }

    if (headers && isMastodonHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)
    const username = parsedUrl?.pathname.match(profileRegex)?.[1]

    if (!username) {
      return []
    }

    return [{ platform, id: username, url }]
  },
}

export const mastodonEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  try {
    const { hostname } = new URL(ref.url)
    const apiUrl = `https://${hostname}/api/v1/accounts/lookup?acct=${ref.id}`
    const response = await context.fetchFn(apiUrl)
    const data = parseBodyJson(response.body)

    if (isNonEmptyString(data.avatar)) {
      return [data.avatar]
    }
  } catch {}

  return []
}
