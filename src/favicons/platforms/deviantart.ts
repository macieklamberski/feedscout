import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseDeviantartUrl } from '../../feeds/platforms/deviantart.js'

export const deviantartHandler: PlatformHandler = {
  match: (url) => {
    const kind = parseDeviantartUrl(url)?.kind

    return kind !== undefined && kind !== 'tag'
  },

  resolve: (url) => {
    const parsed = parseDeviantartUrl(url)

    if (!parsed || parsed.kind === 'tag' || parsed.username.length < 2) {
      return []
    }

    const username = parsed.username.toLowerCase()

    const uri: Array<string> = [
      `https://a.deviantart.net/avatars-big/${username[0]}/${username[1]}/${username}.jpg`,
      `https://a.deviantart.net/avatars-big/${username[0]}/${username[1]}/${username}.gif`,
      `https://a.deviantart.net/avatars-big/${username[0]}/${username[1]}/${username}.png`,
    ]

    return uri.map((value) => ({ uri: value }))
  },
}
