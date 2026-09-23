import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { excludedPaths, hosts, magazineRegex } from '../../../feeds/platform/handlers/note.js'
import { parseBodyJson } from '../../utils.js'

const profileRegex = /^\/([^/]+)\/?$/
// The page payload is a JSON string inside `self.__next_f.push`, so its quotes arrive escaped.
const profileImageUrlRegex = /profileImageUrl\\?":\\?"((?:[^"\\]|\\u[\da-f]{4})+)/i

const getOwner = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const owner = pathname.match(magazineRegex)?.[1] ?? pathname.match(profileRegex)?.[1]

  if (!owner || isAnyOf(owner, excludedPaths)) {
    return
  }

  return owner
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
    return !!getOwner(url)
  },

  resolve: async (url, content, _headers, fetchFn) => {
    const owner = getOwner(url)

    if (!owner) {
      return []
    }

    const isProfile = profileRegex.test(new URL(url).pathname)

    if (isProfile && content) {
      const profileImageUrl = parseProfileImageUrl(content)

      if (isNonEmptyString(profileImageUrl)) {
        return [{ uri: profileImageUrl }]
      }
    }

    if (!fetchFn) {
      return []
    }

    try {
      const response = await fetchFn(`https://note.com/api/v2/creators/${owner}`)
      const profileImageUrl = parseBodyJson(response.body)?.data?.profileImageUrl

      if (isNonEmptyString(profileImageUrl)) {
        return [{ uri: profileImageUrl }]
      }
    } catch {}

    return []
  },
}
