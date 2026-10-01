import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Unmeasured, no public page.

export type OmnystudioUrl = { kind: 'show'; show: string }

const hosts = ['omny.fm', 'www.omny.fm']
const showPathRegex = /^\/shows\/([^/]+)/i

export const parseOmnystudioUrl = (url: string): OmnystudioUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const show = parsedUrl.pathname.match(showPathRegex)?.[1]

  if (!show) {
    return
  }

  return { kind: 'show', show }
}

export const omnystudioHandler: PlatformHandler = {
  match: (url) => {
    return parseOmnystudioUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseOmnystudioUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}/shows/${parsed.show}/playlists/podcast.rss`,
        hint: composeHint('omnystudio:show'),
      },
    ]
  },
}
