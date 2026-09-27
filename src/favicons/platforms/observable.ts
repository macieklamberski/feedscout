import { isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseObservableUrl } from '../../feeds/platforms/observable.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'observable'

// Observable pages answer 429 from a bot checkpoint, so the owner comes from the URL.
export const observableHandler: PlatformHandler = {
  match: (url) => {
    return parseObservableUrl(url) !== undefined
  },

  resolve: (url) => {
    const owner = parseObservableUrl(url)?.owner

    if (!owner) {
      return []
    }

    return [{ platform, id: owner, url }]
  },
}

export const observableEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const response = await context.fetchFn(`https://api.observablehq.com/user/@${ref.id}`)
  const data = parseResponseJson(response)

  if (isNonEmptyString(data?.avatar_url)) {
    return [data.avatar_url]
  }

  return []
}
