import { isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { appRegex, hosts } from '../../../feeds/platform/handlers/steam.js'
import { parseBodyJson } from '../../utils.js'

const appIconRegex = /class="apphub_AppIcon">\s*<img src="([^"]+)"/

export const steamHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return isHostOf(url, hosts) && appRegex.test(parsedUrl.pathname)
  },

  resolve: async (url, content, _headers, fetchFn) => {
    const appIconMatch = content?.match(appIconRegex)

    if (appIconMatch?.[1]) {
      return [{ uri: appIconMatch[1] }]
    }

    if (!fetchFn) {
      return []
    }

    try {
      const { pathname } = new URL(url)
      const appId = pathname.match(appRegex)?.[1]

      if (!appId) {
        return []
      }

      // Age-gated store pages and news pages carry no app icon in their markup.
      const apiUrl = `https://api.steampowered.com/ICommunityService/GetApps/v1/?appids[0]=${appId}`
      const response = await fetchFn(apiUrl)
      const data = parseBodyJson(response.body)
      const icon = data?.response?.apps?.[0]?.icon

      if (!isNonEmptyString(icon)) {
        return []
      }

      const iconUrl = `https://shared.fastly.steamstatic.com/community_assets/images/apps/${appId}/${icon}.jpg`

      return [{ uri: iconUrl }]
    } catch {}

    return []
  },
}
