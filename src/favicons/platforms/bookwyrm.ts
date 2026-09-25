import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasClass } from '../../common/utils.js'
import {
  bookwyrmHandler as bookwyrmFeedHandler,
  parseBookwyrmUrl,
} from '../../feeds/platforms/bookwyrm.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

// Served in place of an avatar to users who never uploaded one.
const defaultAvatarRegex = /\/images\/default_avi\.jpg$/

const platform = 'bookwyrm'

const findAvatarSrc = (content: string | undefined): string | undefined => {
  const avatar = findElement(content, (element) => {
    return element.name === 'img' && hasClass(element, 'avatar') && Boolean(element.attribs.src)
  })

  return avatar?.attribs.src
}

export const bookwyrmHandler: PlatformHandler = {
  match: bookwyrmFeedHandler.match,

  resolve: (url, content) => {
    const parsed = parseBookwyrmUrl(url)

    if (!parsed) {
      return []
    }

    // Only the profile page carries the avatar, so other user pages go to the actor JSON.
    const avatarSrc = parsed.kind === 'profile' ? findAvatarSrc(content) : undefined

    if (!avatarSrc) {
      return [{ platform, id: parsed.username, url }]
    }

    if (defaultAvatarRegex.test(avatarSrc)) {
      return []
    }

    const avatarUrl = parseUrl(avatarSrc, url)

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

  const { origin } = new URL(ref.url)
  const response = await context.fetchFn(`${origin}/user/${ref.id}.json`)
  const data = parseResponseJson(response)
  const iconUrl = data?.icon?.url

  if (isNonEmptyString(iconUrl) && !defaultAvatarRegex.test(iconUrl)) {
    return [iconUrl]
  }

  return []
}
