import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

const hosts = ['jandan.net', 'i.jandan.net']

export const jandanHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: () => {
    return [
      {
        uri: 'https://jandan.net/?feed=rss2',
        hint: composeHint('jandan:feed'),
      },
    ]
  },
}
