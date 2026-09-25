import { isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseNebulaUrl } from '../../feeds/platforms/nebula.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const queryDataRegex = /window\.__QUERY_DATA__\s*=\s*(\{.*?\});?\s*<\/script>/s

const platform = 'nebula'

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

  // A broken page payload must not hide the content API, which the ref falls back to.
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
    return parseNebulaUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const slug = parseNebulaUrl(url)?.slug

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

  const response = await context.fetchFn(`https://content.api.nebula.app/content/${ref.id}/`)
  const avatar = getAvatar(parseResponseJson(response))

  if (avatar) {
    return [avatar]
  }

  return []
}
