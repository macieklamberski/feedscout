import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type SteamUrl = { kind: 'app'; appId: string } | { kind: 'group'; group: string }

// An age-gated store page redirects to /agecheck/app/{id}.
const appRegex = /^\/(?:agecheck\/|news\/)?app\/(\d+)/
const groupRegex = /^\/groups\/([^/]+)/

export const hosts = ['store.steampowered.com', 'steamcommunity.com']

export const parseSteamUrl = (url: string): SteamUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const appId = parsedUrl.pathname.match(appRegex)?.[1]

  if (appId) {
    return { kind: 'app', appId }
  }

  const group = parsedUrl.pathname.match(groupRegex)?.[1]

  if (group && isHostOf(parsedUrl, 'steamcommunity.com')) {
    return { kind: 'group', group }
  }
}

export const steamHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const parsed = parseSteamUrl(url)

    if (parsed?.kind === 'app') {
      return [
        {
          uri: `https://store.steampowered.com/feeds/news/app/${parsed.appId}/`,
          hint: composeHint('steam:news'),
        },
      ]
    }

    if (parsed?.kind === 'group') {
      return [
        {
          uri: `https://steamcommunity.com/groups/${parsed.group}/rss`,
          hint: composeHint('steam:group'),
        },
      ]
    }

    // Global news feed on store root or /news/
    if (
      isHostOf(url, 'store.steampowered.com') &&
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
