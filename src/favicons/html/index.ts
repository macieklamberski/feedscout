import { Parser } from 'htmlparser2'
import type { DiscoverNormalizeUrlFn } from '../../common/types.js'
import { anyWordMatchesAnyOf, normalizeUrl } from '../../common/utils.js'
import { defaultIconRels } from '../defaults.js'
import type { FaviconResult } from '../types.js'

const getIconRel = (rel: string): string => {
  return rel.toLowerCase().trim()
}

export const discoverFaviconsFromHtml = (
  content: string,
  baseUrl: string,
  normalizeUrlFn: DiscoverNormalizeUrlFn = normalizeUrl,
): Array<FaviconResult> => {
  const results: Array<FaviconResult> = []

  const parser = new Parser(
    {
      onopentag: (name, attribs) => {
        // Handle <link> tags with icon-related rel values.
        if (name === 'link' && attribs.href && attribs.rel) {
          const rel = attribs.rel

          if (anyWordMatchesAnyOf(rel, defaultIconRels)) {
            results.push({
              url: normalizeUrlFn(attribs.href, baseUrl),
              method: 'html',
              rel: getIconRel(rel),
              ...(attribs.type ? { type: attribs.type } : {}),
              ...(attribs.sizes ? { sizes: attribs.sizes } : {}),
            })
          }
        }
      },
    },
    { decodeEntities: true },
  )

  parser.write(content)
  parser.end()

  return results
}
