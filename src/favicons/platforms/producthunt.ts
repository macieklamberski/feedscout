import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { hosts } from '../../feeds/platforms/producthunt.js'

// The topics index and a missing topic carry the generic ph-static.imgix.net share image.
const topicImageHosts = ['ph-files.imgix.net']

const productRegex = /^\/products\/([\w-]+)(?:\/|$)/i
const topicRegex = /^\/topics\/[\w-]+\/?$/i
const braceRegex = /[{}]/
const logoUuidRegex = /"logoUuid":"(?<logoUuid>[^"]+)"/

// Related products on the page carry a `logoUuid` too, so only the JSON object holding this
// product's slug is read, cut at its braces.
const findLogoUuid = (content: string, slug: string): string | undefined => {
  const slugField = `"slug":"${slug}","name":"`

  for (const fields of content.split(braceRegex)) {
    const slugIndex = fields.indexOf(slugField)

    if (slugIndex === -1) {
      continue
    }

    const nameEnd = fields.indexOf('"', slugIndex + slugField.length)
    const logoUuid = fields.slice(nameEnd + 1).match(logoUuidRegex)?.groups?.logoUuid

    if (nameEnd !== -1 && logoUuid) {
      return logoUuid
    }
  }
}

export const producthuntHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHostOf(url, hosts)) {
      return false
    }

    return productRegex.test(parsedUrl.pathname) || topicRegex.test(parsedUrl.pathname)
  },

  resolve: (url, content) => {
    const { pathname } = new URL(url)

    if (topicRegex.test(pathname)) {
      const image = parseUrl(getMetaContent(content ?? '', 'og:image') ?? '')

      if (!image || !isHostOf(image.href, topicImageHosts)) {
        return []
      }

      // The topic image comes in any shape, and imgix crops it to a square.
      return [{ uri: `https://ph-files.imgix.net${image.pathname}?fit=crop&w=256&h=256` }]
    }

    if (!content) {
      return []
    }

    const slug = pathname.match(productRegex)?.[1]

    if (!slug) {
      return []
    }

    const logoUuid = findLogoUuid(content, slug)

    if (!logoUuid) {
      return []
    }

    return [{ uri: `https://ph-files.imgix.net/${logoUuid}` }]
  },
}
