import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { excludedPaths, globalPaths, hosts } from '../../../feeds/platform/handlers/nebula.js'

const queryDataRegex = /window\.__QUERY_DATA__\s*=\s*(\{.*?\});?\s*<\/script>/s

const getChannelSlug = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return
  }

  const slug = parsedUrl.pathname.split('/').find(Boolean)

  if (!slug || globalPaths.has(slug) || isAnyOf(slug, excludedPaths)) {
    return
  }

  return slug
}

const getPageAvatar = (content: string | undefined): string | undefined => {
  const match = content?.match(queryDataRegex)

  if (!match?.[1]) {
    return
  }

  try {
    const queryData = JSON.parse(match[1])

    for (const query of queryData?.queries ?? []) {
      if (query?.queryKey?.[0] !== 'content') {
        continue
      }

      const avatar = query.state?.data?.assets?.avatar?.['512']?.original

      if (isNonEmptyString(avatar)) {
        return avatar
      }
    }
  } catch {}
}

export const nebulaHandler: PlatformHandler = {
  match: (url) => {
    return getChannelSlug(url) !== undefined
  },

  resolve: (url, content) => {
    if (!getChannelSlug(url)) {
      return []
    }

    const avatar = getPageAvatar(content)

    if (!avatar) {
      return []
    }

    return [{ uri: avatar }]
  },
}
