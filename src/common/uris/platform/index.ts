import { isHttpUrl, normalizeUrl } from 'trousse'
import { reportError } from '../../discover/utils.js'
import type { DiscoverOnErrorFn, DiscoverRef, DiscoverUriEntry, FetchFn } from '../../types.js'
import type { PlatformMethodOptions } from './types.js'

export type PlatformResolution = {
  entries: Array<DiscoverUriEntry>
  guessExclusionRegexes: Array<RegExp>
}

export const resolveFromPlatform = async (
  content: string | undefined,
  headers: Headers | undefined,
  options: PlatformMethodOptions,
  fetchFn?: FetchFn,
  onError?: DiscoverOnErrorFn,
): Promise<PlatformResolution> => {
  const { baseUrl, handlers, enrichFn } = options
  const entries: Array<DiscoverUriEntry> = []
  const refs: Array<DiscoverRef> = []
  const guessExclusionRegexes: Array<RegExp> = []

  // Host checks pass a `foo://` URL on a platform host, whose empty pathname no handler expects.
  if (!isHttpUrl(baseUrl)) {
    return { entries, guessExclusionRegexes }
  }

  const pageUrl = normalizeUrl(baseUrl, { collapseSlashes: true })

  for (const handler of handlers) {
    try {
      if (!handler.match(pageUrl, content, headers)) {
        continue
      }

      // A match puts the page on the handler's host even when resolve finds nothing there.
      if (handler.guessExclusionRegex) {
        guessExclusionRegexes.push(handler.guessExclusionRegex)
      }

      const resolved = await handler.resolve(pageUrl, content, headers, fetchFn)

      // A handler that matched but found nothing leaves the page to the handlers after it.
      if (resolved.length === 0) {
        continue
      }

      for (const item of resolved) {
        if ('uri' in item) {
          entries.push(item)
          continue
        }

        refs.push(item)
      }

      break
    } catch (error) {
      reportError(onError, error, { phase: 'platformHandler', url: pageUrl })
    }
  }

  if (!enrichFn) {
    return { entries, guessExclusionRegexes }
  }

  // Each ref is enriched on its own, so one that fails leaves the URIs of the others.
  for (const ref of refs) {
    try {
      const uris = await enrichFn(ref)

      for (const uri of uris ?? []) {
        entries.push({ uri, hint: ref.hint })
      }
    } catch (error) {
      reportError(onError, error, { phase: 'enrichFn', url: baseUrl })
    }
  }

  return { entries, guessExclusionRegexes }
}

export const discoverUrisFromPlatform = async (
  content: string | undefined,
  headers: Headers | undefined,
  options: PlatformMethodOptions,
  fetchFn?: FetchFn,
  onError?: DiscoverOnErrorFn,
): Promise<Array<DiscoverUriEntry>> => {
  const { entries } = await resolveFromPlatform(content, headers, options, fetchFn, onError)

  return entries
}
