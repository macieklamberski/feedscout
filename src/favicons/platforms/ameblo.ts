import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { excludedPaths, hosts } from '../../feeds/platforms/ameblo.js'

const initDataPrefix = 'window.INIT_DATA='

const getUsername = (pathname: string): string | undefined => {
  return pathname.split('/').find(Boolean)
}

export const amebloHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHostOf(url, hosts)) {
      return false
    }

    const username = getUsername(parsedUrl.pathname)

    return !!username && !isAnyOf(username, excludedPaths)
  },

  resolve: (url, content) => {
    if (!content) {
      return []
    }

    const username = getUsername(new URL(url).pathname)
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
