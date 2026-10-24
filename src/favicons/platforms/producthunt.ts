import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { type ProducthuntUrl, parseProducthuntUrl } from '../../feeds/platforms/producthunt.js'

// The topics index and a missing topic carry the generic ph-static.imgix.net share image.
const topicImageHosts = ['ph-files.imgix.net']

const braceRegex = /[{}]/
const logoUuidRegex = /"logoUuid":"(?<logoUuid>[^"]+)"/

// The kinds that name a product or a topic, while the rest of the site has no image of its own.
const handledKinds: Array<ProducthuntUrl['kind']> = ['product', 'topic']

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
    const parsed = parseProducthuntUrl(url)

    if (!parsed) {
      return false
    }

    return handledKinds.includes(parsed.kind)
  },

  resolve: (url, content) => {
    const parsed = parseProducthuntUrl(url)

    if (parsed?.kind === 'topic') {
      const image = parseUrl(getMetaContent(content ?? '', 'og:image') ?? '')

      if (!image || !isHostOf(image.href, topicImageHosts)) {
        return []
      }

      // The topic image comes in any shape, and imgix crops it to a square.
      return [{ uri: `https://ph-files.imgix.net${image.pathname}?fit=crop&w=256&h=256` }]
    }

    if (parsed?.kind !== 'product' || !content) {
      return []
    }

    const logoUuid = findLogoUuid(content, parsed.slug)

    if (!logoUuid) {
      return []
    }

    return [{ uri: `https://ph-files.imgix.net/${logoUuid}` }]
  },
}
