import { isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseAmebloUrl } from '../../feeds/platforms/ameblo.js'

const initDataPrefix = 'window.INIT_DATA='

export const amebloHandler: PlatformHandler = {
  match: (url) => {
    return parseAmebloUrl(url) !== undefined
  },

  resolve: (url, content) => {
    if (!content) {
      return []
    }

    const username = parseAmebloUrl(url)?.username
    const start = content.indexOf(initDataPrefix)
    // The same inline script assigns more globals right after INIT_DATA.
    const end = content.indexOf(';window.', start)

    if (!username || start === -1 || end === -1) {
      return []
    }

    const initData = JSON.parse(content.slice(start + initDataPrefix.length, end))
    const image = initData?.bloggerState?.bloggerMap?.[username]?.profile?.image_filepath

    if (!isNonEmptyString(image)) {
      return []
    }

    // The uploaded profile image keeps its original aspect ratio. The `cpd` parameter makes
    // the image server return a square crop of the given size.
    const icon = new URL(image)
    icon.searchParams.set('cpd', '200')

    return [{ uri: icon.href }]
  },
}
