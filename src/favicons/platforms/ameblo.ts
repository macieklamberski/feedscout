import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseAmebloUrl } from '../../feeds/platforms/ameblo.js'

const initDataPrefix = 'window.INIT_DATA='

const getProfileImage = (initData: string, username: string): unknown => {
  try {
    return JSON.parse(initData)?.bloggerState?.bloggerMap?.[username]?.profile?.image_filepath
  } catch {}
}

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

    const image = getProfileImage(content.slice(start + initDataPrefix.length, end), username)

    if (!isNonEmptyString(image)) {
      return []
    }

    // The uploaded profile image keeps its original aspect ratio. The `cpd` parameter makes
    // the image server return a square crop of the given size.
    const icon = parseUrl(image)

    if (!icon) {
      return []
    }

    icon.searchParams.set('cpd', '200')

    return [{ uri: icon.href }]
  },
}
