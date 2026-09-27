import { isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseDevtoUrl } from '../../feeds/platforms/devto.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'devto'

export const devtoHandler: PlatformHandler = {
  match: (url) => {
    return parseDevtoUrl(url)?.kind === 'profile'
  },

  resolve: (url) => {
    const parsed = parseDevtoUrl(url)

    if (parsed?.kind !== 'profile') {
      return []
    }

    return [{ platform, id: parsed.owner, url }]
  },
}

export const devtoEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const name = encodeURIComponent(ref.id)
  let response = await context.fetchFn(`https://dev.to/api/users/by_username?url=${name}`)

  // An organization's name answers 404 from the users API, and the organizations API has it.
  if (response.status === 404) {
    response = await context.fetchFn(`https://dev.to/api/organizations/${name}`)
  }

  const profileImage = parseResponseJson(response)?.profile_image

  if (isNonEmptyString(profileImage)) {
    return [profileImage]
  }

  return []
}
