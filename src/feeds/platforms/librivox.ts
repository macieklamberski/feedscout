import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['librivox.org']

const audiobookRegex = /^\/[^/]+\/?$/
// An audiobook page links its feed by numeric id, which the slug does not carry.
const feedIdRegex = /href="(?:https?|itpc):\/\/librivox\.org\/rss\/(\d+)"/

export type LibrivoxPage = { audiobookId: string }

const getLibrivoxPage = (url: string, content: string | undefined): LibrivoxPage | undefined => {
  if (!audiobookRegex.test(new URL(url).pathname)) {
    return
  }

  const audiobookId = content?.match(feedIdRegex)?.[1]

  if (!audiobookId) {
    return
  }

  return { audiobookId }
}

export const librivoxHandler: PlatformHandler = {
  match: (url, content) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    return getLibrivoxPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getLibrivoxPage(url, content)

    if (!page) {
      return []
    }

    return [
      {
        uri: `https://librivox.org/rss/${page.audiobookId}`,
        hint: composeHint('librivox:audiobook'),
      },
    ]
  },
}
