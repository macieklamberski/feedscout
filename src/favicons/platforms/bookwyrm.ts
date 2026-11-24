import {
  endsWithAnyOf,
  getAnyOf,
  getPathSegments,
  isAnyOf,
  isNonEmptyString,
  parseUrl,
} from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasClass, hasMarker, hasMetaContent } from '../../common/utils.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'bookwyrm'

export type BookwyrmUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'shelf'; username: string; section: string; shelf: string }
  | { kind: 'subpage'; username: string }

// The trailing boundary keeps sibling repositories such as `bookwyrm-docs` out.
const sourceLinkRegex = /github\.com\/bookwyrm-social\/bookwyrm(?![\w-])/i

const shelfSections = ['shelf', 'books']

export const isBookwyrmHtml = (content: string): boolean => {
  return sourceLinkRegex.test(content) || hasMetaContent(content, 'generator', 'BookWyrm')
}

export const parseBookwyrmUrl = (url: string): BookwyrmUrl | undefined => {
  const [prefix, username, section, shelf] = getPathSegments(url)

  if (!isAnyOf(prefix, 'user') || !username) {
    return
  }

  if (!section) {
    return { kind: 'profile', username }
  }

  const shelfSection = getAnyOf(section, shelfSections)

  if (shelfSection && shelf) {
    return { kind: 'shelf', username, section: shelfSection, shelf }
  }

  return { kind: 'subpage', username }
}

// Served in place of an avatar to users who never uploaded one.
const defaultAvatarPath = '/images/default_avi.jpg'

const findAvatarSrc = (content: string | undefined): string | undefined => {
  const avatar = findElement(content, (element) => {
    return element.name === 'img' && hasClass(element, 'avatar') && Boolean(element.attribs.src)
  })

  return avatar?.attribs.src
}

export const bookwyrmHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isBookwyrmHtml })) {
      return false
    }

    return parseBookwyrmUrl(url) !== undefined
  },

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

    if (endsWithAnyOf(avatarSrc, defaultAvatarPath)) {
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

  if (isNonEmptyString(iconUrl) && !endsWithAnyOf(iconUrl, defaultAvatarPath)) {
    return [iconUrl]
  }

  return []
}
