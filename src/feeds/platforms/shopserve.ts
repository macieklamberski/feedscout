import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const generatedPathRegex = /^\/hpgen\/hpb\//i

const isGeneratedPath = (value: string | undefined): boolean => {
  return generatedPathRegex.test(value ?? '')
}

// Every desktop page Shopserve generates links its news entries, categories and theme images
// under /hpgen/HPB/ by root-relative paths, on a shop's own domain too. The /smp/ pages do not.
export const isShopserveHtml = (content: string): boolean => {
  const element = findElement(content, (element) => {
    return isGeneratedPath(element.attribs.href) || isGeneratedPath(element.attribs.src)
  })

  return element !== undefined
}

export const shopserveHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isShopserveHtml })
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/hpgen/HPB/rss.xml`, hint: composeHint('shopserve:news') }]
  },
}
