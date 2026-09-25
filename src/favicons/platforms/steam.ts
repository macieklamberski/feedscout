import { isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasClass } from '../../common/utils.js'
import { appRegex, hosts } from '../../feeds/platforms/steam.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'steam'

const getAppId = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return
  }

  return parsedUrl.pathname.match(appRegex)?.[1]
}

const findAppIcon = (content: string | undefined): string | undefined => {
  const image = findElement(content, (element) => {
    return (
      element.name === 'img' &&
      hasClass(element.parent, 'apphub_AppIcon') &&
      Boolean(element.attribs.src)
    )
  })

  return image?.attribs.src
}

export const steamHandler: PlatformHandler = {
  match: (url) => {
    return getAppId(url) !== undefined
  },

  // Age-gated store pages and store app news pages carry no app icon in their markup.
  resolve: (url, content) => {
    const appIcon = findAppIcon(content)

    if (appIcon) {
      return [{ uri: appIcon }]
    }

    const appId = getAppId(url)

    if (!appId) {
      return []
    }

    return [{ platform, id: appId, url }]
  },
}

export const steamEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const apiUrl = `https://api.steampowered.com/ICommunityService/GetApps/v1/?appids[0]=${ref.id}`
  const response = await context.fetchFn(apiUrl)
  const icon = parseResponseJson(response)?.response?.apps?.[0]?.icon

  if (isNonEmptyString(icon)) {
    return [
      `https://shared.fastly.steamstatic.com/community_assets/images/apps/${ref.id}/${icon}.jpg`,
    ]
  }

  return []
}
