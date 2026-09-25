import { isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getMetaContent, hasClass } from '../../common/utils.js'
import { parseSteamUrl } from '../../feeds/platforms/steam.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'steam'

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
    return parseSteamUrl(url) !== undefined
  },

  // Age-gated store pages and store app news pages carry no app icon in their markup.
  resolve: (url, content) => {
    const appIcon = findAppIcon(content)

    if (appIcon) {
      return [{ uri: appIcon }]
    }

    const parsed = parseSteamUrl(url)

    // A group page carries the group avatar in its preview image.
    if (parsed?.kind === 'group') {
      const avatar = getMetaContent(content ?? '', 'og:image')

      if (!avatar) {
        return []
      }

      return [{ uri: avatar }]
    }

    if (parsed?.kind !== 'app') {
      return []
    }

    return [{ platform, id: parsed.appId, url }]
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
