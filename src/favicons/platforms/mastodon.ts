import { isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  isMastodonHeaders,
  isMastodonHtml,
  parseMastodonUrl,
} from '../../feeds/platforms/mastodon.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'mastodon'

export const mastodonHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseMastodonUrl(url)

    if (!parsed || parsed.kind === 'tag') {
      return false
    }

    if (content && isMastodonHtml(content)) {
      return true
    }

    if (headers && isMastodonHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
    const parsed = parseMastodonUrl(url)

    if (!parsed || parsed.kind === 'tag') {
      return []
    }

    return [{ platform, id: parsed.username, url }]
  },
}

export const mastodonEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const { hostname } = new URL(ref.url)
  const apiUrl = `https://${hostname}/api/v1/accounts/lookup?acct=${ref.id}`
  const response = await context.fetchFn(apiUrl)
  const data = parseResponseJson(response)

  if (isNonEmptyString(data.avatar)) {
    return [data.avatar]
  }

  return []
}
