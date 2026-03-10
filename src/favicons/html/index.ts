import { Parser } from 'htmlparser2'
import type { DiscoverNormalizeUrlFn } from '../../common/types.js'
import { normalizeUrl } from '../../common/utils.js'
import { matchesIconRel } from '../defaults.js'
import type { FaviconResult } from '../discover/types.js'

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

          if (matchesIconRel(rel)) {
            results.push({
              url: normalizeUrlFn(attribs.href, baseUrl),
              method: 'html',
              rel: getIconRel(rel),
              ...(attribs.type ? { type: attribs.type } : {}),
              ...(attribs.sizes ? { sizes: attribs.sizes } : {}),
            })
          }
        }

        // Handle <meta name="msapplication-TileImage"> tags.
        if (name === 'meta' && attribs.content) {
          const metaName = attribs.name?.toLowerCase()

          if (metaName === 'msapplication-tileimage') {
            results.push({
              url: normalizeUrlFn(attribs.content, baseUrl),
              method: 'html',
              sizes: '144x144',
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
