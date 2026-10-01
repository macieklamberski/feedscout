import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers author.

export type SyosetuUrl = { kind: 'writer'; writerId: string }

const hosts = ['mypage.syosetu.com']
const writerIdRegex = /^\/(\d+)/

export const parseSyosetuUrl = (url: string): SyosetuUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const writerId = parsedUrl.pathname.match(writerIdRegex)?.[1]

  if (!writerId) {
    return
  }

  return { kind: 'writer', writerId }
}

export const syosetuHandler: PlatformHandler = {
  match: (url) => {
    return parseSyosetuUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSyosetuUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://api.syosetu.com/writernovel/${parsed.writerId}.Atom`,
        hint: composeHint('syosetu:author'),
      },
      {
        uri: `https://api.syosetu.com/writer/${parsed.writerId}.Atom`,
        hint: composeHint('syosetu:activity'),
      },
    ]
  },
}
