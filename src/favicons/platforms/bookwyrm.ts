import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { isBookwyrmHtml } from '../../feeds/platforms/bookwyrm.js'
import type { FaviconEnricher } from '../types.js'
import { parseBodyJson } from '../utils.js'

const platform = 'bookwyrm'

// Profile page, the all-books page, and a single shelf.
const pageRegex = /^\/user\/([^/]+)(?:\/(?:shelf|books)(?:\/[^/]+)?)?\/?$/
const profileRegex = /^\/user\/[^/]+\/?$/
const avatarRegex = /<img(?=[^>]*\bclass=["'][^"']*\bavatar\b)[^>]*\bsrc=["']([^"']+)["']/i
// Served in place of an avatar to users who never uploaded one.
const defaultAvatarRegex = /\/images\/default_avi\.jpg$/

export const bookwyrmHandler: PlatformHandler = {
  match: (url, content) => {
    if (!content || !isBookwyrmHtml(content)) {
      return false
    }

    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return pageRegex.test(parsedUrl.pathname)
  },

  resolve: (url, content) => {
    const parsedUrl = parseUrl(url)
    const name = parsedUrl?.pathname.match(pageRegex)?.[1]

    if (!parsedUrl || !name) {
      return []
    }

    // Shelf pages carry no avatar, so they go to the actor JSON.
    const avatarSrc = profileRegex.test(parsedUrl.pathname)
      ? content?.match(avatarRegex)?.[1]
      : undefined

    if (!avatarSrc) {
      return [{ platform, id: name, url }]
    }

    if (defaultAvatarRegex.test(avatarSrc)) {
      return []
    }

    const avatarUrl = parseUrl(avatarSrc, parsedUrl)

    if (!avatarUrl) {
      return []
    }

    return [{ uri: avatarUrl.href }]
  },
}

export const bookwyrmEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  try {
    const { origin } = new URL(ref.url)
    const response = await context.fetchFn(`${origin}/user/${ref.id}.json`)
    const data = parseBodyJson(response.body)
    const iconUrl = data?.icon?.url

    if (isNonEmptyString(iconUrl) && !defaultAvatarRegex.test(iconUrl)) {
      return [iconUrl]
    }
  } catch {}

  return []
}
