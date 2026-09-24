import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { excludedPaths, globalPaths, hosts } from '../../../feeds/platform/handlers/nebula.js'
import type { FaviconEnricher } from '../../types.js'
import { parseBodyJson } from '../../utils.js'

const platform = 'nebula'

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
      if (query?.queryKey?.[0] !== 'content') {
        continue
      }

      const avatar = getAvatar(query.state?.data)

      if (avatar) {
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
    const slug = getChannelSlug(url)

    if (!slug) {
      return []
    }

    const avatar = getPageAvatar(content)

    if (!avatar) {
      return [{ platform, id: slug, url }]
    }

    return [{ uri: avatar }]
  },
}

export const nebulaEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  try {
    const response = await context.fetchFn(`https://content.api.nebula.app/content/${ref.id}/`)
    const avatar = getAvatar(parseBodyJson(response.body))

    if (avatar) {
      return [avatar]
    }
  } catch {}

  return []
}
