import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['librivox.org']

const audiobookRegex = /^\/[^/]+\/?$/
// An audiobook page links its feed by numeric id, which the slug does not carry.
const feedIdRegex = /href="(?:https?|itpc):\/\/librivox\.org\/rss\/(\d+)"/

const getAudiobookId = (url: string, content: string | undefined): string | undefined => {
  if (!audiobookRegex.test(new URL(url).pathname)) {
    return
  }

  return content?.match(feedIdRegex)?.[1]
}

export const librivoxHandler: PlatformHandler = {
  match: (url, content) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    return getAudiobookId(url, content) !== undefined
  },

  resolve: (url, content) => {
    const audiobookId = getAudiobookId(url, content)

    if (!audiobookId) {
      return []
    }

    return [
      {
        uri: `https://librivox.org/rss/${audiobookId}`,
        hint: composeHint('librivox:audiobook'),
      },
    ]
  },
}
