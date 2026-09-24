import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hosts } from '../../feeds/platforms/producthunt.js'

const productRegex = /^\/products\/([\w-]+)(?:\/|$)/

export const producthuntHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHostOf(url, hosts)) {
      return false
    }

    return productRegex.test(parsedUrl.pathname)
  },

  resolve: (url, content) => {
    if (!content) {
      return []
    }

    const { pathname } = new URL(url)
    const slug = pathname.match(productRegex)?.[1]

    if (!slug) {
      return []
    }

    // Related products on the page carry a `logoUuid` too, so only the JSON object
    // holding this product's slug is read.
    const logoRegex = new RegExp(`"slug":"${slug}","name":"[^"]*"[^{}]*?"logoUuid":"([^"]+)"`)
    const logoUuid = content.match(logoRegex)?.[1]

    if (!logoUuid) {
      return []
    }

    return [{ uri: `https://ph-files.imgix.net/${logoUuid}` }]
  },
}
