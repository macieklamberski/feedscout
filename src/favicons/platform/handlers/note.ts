import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/note.js'

const profileRegex = /^\/([^/]+)\/?$/
// The page payload is a JSON string inside `self.__next_f.push`, so its quotes arrive escaped.
const profileImageUrlRegex = /profileImageUrl\\?":\\?"((?:[^"\\]|\\u[\da-f]{4})+)/i

const isProfileUrl = (url: string): boolean => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return false
  }

  const owner = parsedUrl.pathname.match(profileRegex)?.[1]

  return !!owner && !isAnyOf(owner, excludedPaths)
}

const parseProfileImageUrl = (content: string): string | undefined => {
  const match = content.match(profileImageUrlRegex)

  if (!match?.[1]) {
    return
  }

  try {
    return JSON.parse(`"${match[1]}"`)
  } catch {}
}

export const noteHandler: PlatformHandler = {
  match: (url) => {
    return isProfileUrl(url)
  },

  resolve: (url, content) => {
    if (!content || !isProfileUrl(url)) {
      return []
    }

    const profileImageUrl = parseProfileImageUrl(content)

    if (!isNonEmptyString(profileImageUrl)) {
      return []
    }

    return [{ uri: profileImageUrl }]
  },
}
