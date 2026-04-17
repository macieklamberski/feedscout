import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

const appRegex = /^\/(?:news\/)?app\/(\d+)/
const groupRegex = /^\/groups\/([^/]+)/

const hosts = ['store.steampowered.com', 'steamcommunity.com']

export const steamHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { hostname, pathname } = new URL(url)

    const appMatch = pathname.match(appRegex)

    if (appMatch?.[1]) {
      return [
        {
          uri: `https://store.steampowered.com/feeds/news/app/${appMatch[1]}/`,
          hint: composeHint('steam:news'),
        },
      ]
    }

    if (hostname === 'steamcommunity.com') {
      const groupMatch = pathname.match(groupRegex)

      if (groupMatch?.[1]) {
        return [
          {
            uri: `https://steamcommunity.com/groups/${groupMatch[1]}/rss`,
            hint: composeHint('steam:group'),
          },
        ]
      }
    }

    // Global news feed on store root or /news/
    if (
      hostname === 'store.steampowered.com' &&
      (pathname === '/' || pathname === '' || pathname.startsWith('/news'))
    ) {
      return [
        {
          uri: 'https://store.steampowered.com/feeds/news.xml',
          hint: composeHint('steam:news-global'),
        },
      ]
    }

    return []
  },
}
