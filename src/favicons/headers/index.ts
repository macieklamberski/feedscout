import type { DiscoverNormalizeUrlFn } from '../../common/types.js'
import { anyWordMatchesAnyOf, normalizeUrl } from '../../common/utils.js'
import { defaultIconRels } from '../defaults.js'
import type { FaviconResult } from '../discover/types.js'

const urlRegex = /<([^<>]+)>/
const relRegex = /rel\s*=\s*["']?([^"';,]+)["']?/i
const typeRegex = /type\s*=\s*["']?([^"';,]+)["']?/i
const sizesRegex = /sizes\s*=\s*["']?([^"';,]+)["']?/i

export const discoverFaviconsFromHeaders = (
  headers: Headers,
  baseUrl: string,
  normalizeUrlFn: DiscoverNormalizeUrlFn = normalizeUrl,
): Array<FaviconResult> => {
  const results: Array<FaviconResult> = []
  const linkHeader = headers.get('link')

  if (!linkHeader) {
    return []
  }

  const links = linkHeader.split(/,(?=\s*<)/)

  for (const link of links) {
    const urlMatch = link.match(urlRegex)
    const relMatch = link.match(relRegex)

    if (!urlMatch || !relMatch) {
      continue
    }

    const url = urlMatch[1]
    const rel = relMatch[1]

    if (!anyWordMatchesAnyOf(rel, defaultIconRels)) {
      continue
    }

    const typeMatch = link.match(typeRegex)
    const sizesMatch = link.match(sizesRegex)

    results.push({
      url: normalizeUrlFn(url, baseUrl),
      method: 'headers',
      rel: rel.toLowerCase().trim(),
      ...(typeMatch?.[1] ? { type: typeMatch[1] } : {}),
      ...(sizesMatch?.[1] ? { sizes: sizesMatch[1] } : {}),
    })
  }

  return results
}
