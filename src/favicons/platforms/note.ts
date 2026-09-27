import { getPathSegments, isAnyOf, isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { excludedPaths, parseNoteUrl } from '../../feeds/platforms/note.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'note'

// The page payload is a JSON string inside `self.__next_f.push`, so its quotes arrive escaped.
const profileImageUrlRegex = /profileImageUrl\\?":\\?"((?:[^"\\]|\\u[\da-f]{4})+)/i

const getOwner = (url: string): string | undefined => {
  const parsed = parseNoteUrl(url)

  if (parsed?.kind === 'user') {
    return parsed.username
  }

  // A magazine page under a reserved path names no owner.
  if (parsed?.kind === 'magazine' && !isAnyOf(parsed.username, excludedPaths)) {
    return parsed.username
  }
}

const parseProfileImageUrl = (content: string): string | undefined => {
  const match = content.match(profileImageUrlRegex)

  if (!match?.[1]) {
    return
  }

  // A broken page payload must not hide the creators API, which the ref falls back to.
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

    // A magazine or article page payload describes the magazine or article, not its owner.
    const isProfile = getPathSegments(url).length === 1

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

  const response = await context.fetchFn(`https://note.com/api/v2/creators/${ref.id}`)
  const profileImageUrl = parseResponseJson(response)?.data?.profileImageUrl

  if (isNonEmptyString(profileImageUrl)) {
    return [profileImageUrl]
  }

  return []
}
