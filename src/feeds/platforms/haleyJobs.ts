import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers search (html).
// Handler needed for: board, job.

const boardRoutePrefix = '/index.smpl?arg=jb_'

// Haley's resource centers and admin pages come from the same servers, so the job board is told
// apart by its own `jb_` routes.
export const isHaleyJobsHtml = (content: string | undefined): boolean => {
  const boardLink = findElement(content, (element) => {
    return element.name === 'a' && (element.attribs.href ?? '').startsWith(boardRoutePrefix)
  })

  return boardLink !== undefined
}

export const isHaleyJobsHeaders = (headers: Headers): boolean => {
  return (headers.get('x-sasnode') ?? '').endsWith('.haleymarketing.com')
}

export const haleyJobsHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    if (!headers || !isHaleyJobsHeaders(headers)) {
      return false
    }

    return isHaleyJobsHtml(content)
  },

  // A search filter the board does not know falls back to every job, so no filter is carried.
  // `ff=1` serves the full job descriptions, which the bare feed cuts short.
  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss/rss.smpl?ff=1`, hint: composeHint('haley-jobs:jobs') }]
  },
}
