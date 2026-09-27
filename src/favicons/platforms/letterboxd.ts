import { escapeRegex, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findDescendant, findElement, hasClass } from '../../common/utils.js'
import { parseLetterboxdUrl } from '../../feeds/platforms/letterboxd.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'letterboxd'

const gravatarHosts = ['gravatar.com', 'secure.gravatar.com']

// Resized avatars carry the crop box in the file name, e.g. `-0-48-0-48-crop.jpg`.
const cropRegex = /-0-\d+-0-\d+-crop\./

// Member pages link the member's own avatar to their profile root, while avatars of other
// members on the same page link elsewhere.
const getAvatarSrc = (content: string, username: string): string | undefined => {
  const profileRegex = new RegExp(`^/${escapeRegex(username)}/?$`, 'i')
  const link = findElement(content, (element) => {
    return (
      element.name === 'a' &&
      hasClass(element, 'avatar') &&
      profileRegex.test(element.attribs.href ?? '')
    )
  })

  if (!link) {
    return
  }

  const image = findDescendant(link, (element) => element.name === 'img')

  return image?.attribs.src
}

// Members without an avatar get a placeholder from s.ltrbxd.com, which neither branch accepts.
const getLargeAvatarUri = (src: string): string | undefined => {
  if (cropRegex.test(src)) {
    return src.replace(cropRegex, '-0-1000-0-1000-crop.')
  }

  const parsedSrc = parseUrl(src)

  if (!parsedSrc || !isHostOf(src, gravatarHosts)) {
    return
  }

  // The `default` parameter points at the placeholder, so a missing Gravatar answers 404.
  parsedSrc.searchParams.set('size', '500')
  parsedSrc.searchParams.set('default', '404')

  return parsedSrc.href
}

export const letterboxdHandler: PlatformHandler = {
  match: (url) => {
    return parseLetterboxdUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseLetterboxdUrl(url)

    if (!parsed) {
      return []
    }

    const { username } = parsed

    // The profile root and the diary answer 403 to non-browser clients, so their content
    // carries no avatar.
    const src = content ? getAvatarSrc(content, username) : undefined

    if (!src) {
      return [{ platform, id: username, url }]
    }

    const uri = getLargeAvatarUri(src)

    if (!uri) {
      return []
    }

    return [{ uri }]
  },
}

// The films page answers non-browser clients where the profile root does not.
export const letterboxdEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const response = await context.fetchFn(`https://letterboxd.com/${ref.id}/films/`)

  const src = getAvatarSrc(getResponseText(response), ref.id)
  const uri = src ? getLargeAvatarUri(src) : undefined

  if (uri) {
    return [uri]
  }

  return []
}
