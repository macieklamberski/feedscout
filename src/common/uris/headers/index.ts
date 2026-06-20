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

  // LinkHeader.parse handles RFC 8288 quoting/escaping (so a decoy `rel=` inside a
  // quoted value can't be read as the rel) and throws on malformed input.
  let refs: ReturnType<typeof LinkHeader.parse>['refs']

  try {
    refs = LinkHeader.parse(linkHeader).refs
  } catch {
    return []
  }

  const uris = new Set<string>()

  for (const ref of refs) {
    if (ref.rel && matchesAnyOfLinkSelectors(ref.rel, ref.type, options.linkSelectors)) {
      uris.add(ref.uri)
    }
  }

  return [...uris]
}
