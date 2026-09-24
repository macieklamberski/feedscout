import { escapeRegex, getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { excludedPaths, hosts } from '../../feeds/platforms/letterboxd.js'
import type { FaviconEnricher } from '../types.js'

const platform = 'letterboxd'

// Resized avatars carry the crop box in the file name, e.g. `-0-48-0-48-crop.jpg`.
const cropRegex = /-0-\d+-0-\d+-crop\./

const getUsername = (url: string): string | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return username
}

// Member pages link the member's own avatar to their profile root, while avatars of other
// members on the same page link elsewhere.
const getAvatarSrc = (content: string, username: string): string | undefined => {
  const avatarRegex = new RegExp(
    `<a(?=[^>]*class="avatar[\\s"])(?=[^>]*href="/${escapeRegex(username)}/")[^>]*>\\s*<img[^>]*\\ssrc="([^"]+)"`,
    'i',
  )

  return content.match(avatarRegex)?.[1]?.replaceAll('&amp;', '&')
}

// Members without an avatar get a placeholder from s.ltrbxd.com, which neither branch accepts.
const getLargeAvatarUri = (src: string): string | undefined => {
  if (cropRegex.test(src)) {
    return src.replace(cropRegex, '-0-1000-0-1000-crop.')
  }

  const parsedSrc = parseUrl(src)

  if (!parsedSrc || !isHostOf(src, ['gravatar.com', 'secure.gravatar.com'])) {
    return
  }

  // The `default` parameter points at the placeholder, so a missing Gravatar answers 404.
  parsedSrc.searchParams.set('size', '500')
  parsedSrc.searchParams.set('default', '404')

  return parsedSrc.href
}

export const letterboxdHandler: PlatformHandler = {
  match: (url) => {
    return !!getUsername(url)
  },

  resolve: (url, content) => {
    const username = getUsername(url)

    if (!username) {
      return []
    }

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

  try {
    const response = await context.fetchFn(`https://letterboxd.com/${ref.id}/films/`)

    if (typeof response.body !== 'string') {
      return []
    }

    const src = getAvatarSrc(response.body, ref.id)
    const uri = src ? getLargeAvatarUri(src) : undefined

    if (uri) {
      return [uri]
    }
  } catch {}

  return []
}
