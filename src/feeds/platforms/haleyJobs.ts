import { haleyJobs } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: jobs.

const boardRoutePrefix = '/index.smpl?arg=jb_'

const feeds = withHintLabels(haleyJobs.feeds)

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
  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    return [page.getFeedEntry('jobs')]
  },
}
