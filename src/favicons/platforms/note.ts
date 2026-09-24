import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { excludedPaths, hosts, magazineRegex } from '../../feeds/platforms/note.js'
import type { FaviconEnricher } from '../types.js'
import { parseBodyJson } from '../utils.js'

const platform = 'note'

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

  resolve: (url, content) => {
    const owner = getOwner(url)

    if (!owner) {
      return []
    }

    // A magazine page payload describes the magazine, not its owner.
    const isProfile = profileRegex.test(new URL(url).pathname)

    if (isProfile && content) {
      const profileImageUrl = parseProfileImageUrl(content)

      if (isNonEmptyString(profileImageUrl)) {
        return [{ uri: profileImageUrl }]
      }
    }

    return [{ platform, id: owner, url }]
  },
}

// An unknown creator returns `data` as a string, so it yields no avatar.
export const noteEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  try {
    const response = await context.fetchFn(`https://note.com/api/v2/creators/${ref.id}`)
    const profileImageUrl = parseBodyJson(response.body)?.data?.profileImageUrl

    if (isNonEmptyString(profileImageUrl)) {
      return [profileImageUrl]
    }
  } catch {}

  return []
}
