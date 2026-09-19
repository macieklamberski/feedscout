import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Steam exposes RSS feeds for per-app news
// (`store.steampowered.com/feeds/news/app/{id}/`), the global news and
// daily-deals firehoses (`/feeds/news.xml`, `/feeds/daily_deals.xml`), and
// community groups (`steamcommunity.com/groups/{name}/rss`), but the SPA
// store and community pages emit no `<link rel="alternate">` and Steam
// silently aliases unknown `/feeds/*.xml` paths to the global news feed.
// The handler maps store app URLs and community group URLs onto the
// matching feed and emits the firehoses on the store root.

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
        {
          uri: 'https://store.steampowered.com/feeds/daily_deals.xml',
          hint: composeHint('steam:daily-deals'),
        },
      ]
    }

    return []
  },
}
