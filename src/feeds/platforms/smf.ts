import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: board.
// Handler needed for: posts.

export type SmfPage = { scriptUrl: string; boardId?: string }

const scriptUrlRegex = /var smf_scripturl = "([^"]+)"/
const boardIdRegex = /[?;&]board=(\d+)/i

// A forum of any domain is known only by its marker, so its feeds are built here but not claimed.
// The feed arguments are joined by semicolons into the one `action` value.
const feeds = definePlatformFeeds([
  { key: 'smf:board', main: '{root}?action=.xml;type=rss2;board={board}', format: 'rss' },
  { key: 'smf:board', main: '{root}?action=.xml;type=atom;board={board}', format: 'atom' },
  { key: 'smf:posts', main: '{root}?action=.xml;type=rss2', format: 'rss' },
  { key: 'smf:posts', main: '{root}?action=.xml;type=atom', format: 'atom' },
])

// Core prints both script variables in every page head whatever the theme, from SMF 1.1 to 2.1.
export const isSmfHtml = (content: string): boolean => {
  return scriptUrlRegex.test(content) && content.includes('var smf_theme_url = "')
}

// A board page and a topic page both link their board as `rel="index"`.
const getBoardId = (url: string, content: string): string | undefined => {
  const urlBoardId = boardIdRegex.exec(url)?.[1]

  if (urlBoardId) {
    return urlBoardId
  }

  const indexLink = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'index'
  })

  return indexLink?.attribs.href?.match(boardIdRegex)?.[1]
}

const getSmfPage = (url: string, content: string | undefined): SmfPage | undefined => {
  const scriptUrl = content?.match(scriptUrlRegex)?.[1]

  if (!content || !scriptUrl) {
    return
  }

  // A guest without cookies gets the script URL with a `PHPSESSID` query appended.
  const { origin, pathname } = new URL(scriptUrl, url)

  return { scriptUrl: `${origin}${pathname}`, boardId: getBoardId(url, content) }
}

export const smfHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isSmfHtml })
  },

  resolve: (url, content) => {
    const page = getSmfPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const root = page.scriptUrl

    if (page.boardId) {
      const params = { root, board: page.boardId }

      return [
        pageFeeds.getFeedEntry('smf:board', params, 'rss'),
        pageFeeds.getFeedEntry('smf:board', params, 'atom'),
        pageFeeds.getFeedEntry('smf:posts', { root }, 'rss'),
        pageFeeds.getFeedEntry('smf:posts', { root }, 'atom'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('smf:posts', { root }, 'rss'),
      pageFeeds.getFeedEntry('smf:posts', { root }, 'atom'),
    ]
  },
}
