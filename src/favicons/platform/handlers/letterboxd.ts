import { escapeRegex, getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/letterboxd.js'

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

  resolve: async (url, content, _headers, fetchFn) => {
    const username = getUsername(url)

    if (!username) {
      return []
    }

    let src = content ? getAvatarSrc(content, username) : undefined

    // The profile root and some subpages answer 403 to non-browser clients, the films page does not.
    if (!src && fetchFn) {
      try {
        const response = await fetchFn(`https://letterboxd.com/${username}/films/`)

        if (typeof response.body === 'string') {
          src = getAvatarSrc(response.body, username)
        }
      } catch {}
    }

    const uri = src ? getLargeAvatarUri(src) : undefined

    if (!uri) {
      return []
    }

    return [{ uri }]
  },
}
