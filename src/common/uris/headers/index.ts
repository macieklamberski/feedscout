import LinkHeader from 'http-link-header'
import { matchesAnyOfLinkSelectors } from '../../../common/utils.js'
import type { HeadersMethodOptions } from './types.js'

export const discoverUrisFromHeaders = (
  headers: Headers,
  options: HeadersMethodOptions,
): Array<string> => {
  const linkHeader = headers.get('link')

  if (!linkHeader) {
    return []
  }

  const uris = new Set<string>()

  // LinkHeader.parse handles RFC 8288 quoting/escaping (so a decoy `rel=` inside a
  // quoted value can't be read as the rel) and throws on malformed input.
  try {
    for (const ref of LinkHeader.parse(linkHeader).refs) {
      if (ref.rel && matchesAnyOfLinkSelectors(ref.rel, ref.type, options.linkSelectors)) {
        uris.add(ref.uri)
      }
    }
  } catch {}

  return [...uris]
}
