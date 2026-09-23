import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { excludedPaths, globalPaths, hosts } from '../../../feeds/platform/handlers/nebula.js'
import { parseBodyJson } from '../../utils.js'

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

// biome-ignore lint/suspicious/noExplicitAny: Channel JSON from the page or the content API.
const getAvatar = (channel: any): string | undefined => {
  const avatar = channel?.assets?.avatar?.['512']?.original

  if (isNonEmptyString(avatar)) {
    return avatar
  }
}

const getPageAvatar = (content: string | undefined): string | undefined => {
  const match = content?.match(queryDataRegex)

  if (!match?.[1]) {
    return
  }

  try {
    const queryData = JSON.parse(match[1])

    for (const query of queryData?.queries ?? []) {
      if (query?.queryKey?.[0] === 'content') {
        return getAvatar(query.state?.data)
      }
    }
  } catch {}
}

export const nebulaHandler: PlatformHandler = {
  match: (url) => {
    return getChannelSlug(url) !== undefined
  },

  resolve: async (url, content, _headers, fetchFn) => {
    const slug = getChannelSlug(url)

    if (!slug) {
      return []
    }

    const pageAvatar = getPageAvatar(content)

    if (pageAvatar) {
      return [{ uri: pageAvatar }]
    }

    if (!fetchFn) {
      return []
    }

    try {
      const response = await fetchFn(`https://content.api.nebula.app/content/${slug}/`)
      const apiAvatar = getAvatar(parseBodyJson(response.body))

      if (apiAvatar) {
        return [{ uri: apiAvatar }]
      }
    } catch {}

    return []
  },
}
