import { Parser } from 'htmlparser2'
import type { DiscoverFetchFn, DiscoverNormalizeUrlFn } from '../../common/types.js'
import { normalizeUrl } from '../../common/utils.js'
import type { FaviconResult } from '../discover/types.js'

type ManifestIcon = {
  src?: string
  sizes?: string
  type?: string
}

const findManifestHref = (html: string): string | undefined => {
  let href: string | undefined

  const parser = new Parser(
    {
      onopentag: (name, attribs) => {
        if (name === 'link' && attribs.rel?.toLowerCase() === 'manifest' && attribs.href) {
          href = attribs.href
        }
      },
    },
    { decodeEntities: true },
  )

  parser.write(html)
  parser.end()

  return href
}

const parseManifestIcons = (content: string): Array<ManifestIcon> => {
  try {
    const manifest = JSON.parse(content)
    const icons = manifest?.icons

    if (!Array.isArray(icons)) {
      return []
    }

    return icons.filter((icon: ManifestIcon) => {
      return icon?.src
    })
  } catch {
    return []
  }
}

export const discoverFaviconsFromManifest = async (
  content: string,
  baseUrl: string,
  fetchFn: DiscoverFetchFn,
  normalizeUrlFn: DiscoverNormalizeUrlFn = normalizeUrl,
): Promise<Array<FaviconResult>> => {
  const manifestHref = findManifestHref(content)

  if (!manifestHref) {
    return []
  }

  const manifestUrl = normalizeUrlFn(manifestHref, baseUrl)

  try {
    const response = await fetchFn(manifestUrl)
    const body = typeof response.body === 'string' ? response.body : ''
    const icons = parseManifestIcons(body)

    return icons.map((icon) => ({
      url: normalizeUrlFn(icon.src as string, manifestUrl),
      method: 'manifest' as const,
      ...(icon.type ? { type: icon.type } : {}),
      ...(icon.sizes ? { sizes: icon.sizes } : {}),
    }))
  } catch {
    return []
  }
}
