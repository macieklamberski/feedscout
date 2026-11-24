import { smf } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: board.
// Handler needed for: posts.

export type SmfPage = { scriptUrl: string; boardId?: string }

const scriptUrlRegex = /var smf_scripturl = "([^"]+)"/

const feeds = withHintLabels(smf.feeds)

// Core prints both script variables in every page head whatever the theme, from SMF 1.1 to 2.1.
export const isSmfHtml = (content: string): boolean => {
  return scriptUrlRegex.test(content) && content.includes('var smf_theme_url = "')
}

const readBoardId = (url: string | undefined, root: string): string | undefined => {
  const page = smf.pages.read(url ?? '', { root })

  if (page?.key !== 'board') {
    return
  }

  return page.params.board
}

// A board page and a topic page both link their board as `rel="index"`.
const getBoardId = (url: string, content: string, root: string): string | undefined => {
  const indexLink = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'index'
  })

  return readBoardId(url, root) ?? readBoardId(parseUrl(indexLink?.attribs.href, url)?.href, root)
}

const getSmfPage = (url: string, content: string | undefined): SmfPage | undefined => {
  const scriptUrl = parseUrl(content?.match(scriptUrlRegex)?.[1], url)
  const script = scriptUrl ? smf.pages.read(scriptUrl.href, { isAnyHost: true }) : undefined

  if (!content || !script) {
    return
  }

  const { root } = script.params

  return { scriptUrl: root, boardId: getBoardId(url, content, root) }
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
        pageFeeds.getFeedEntry('board', params, 'rss'),
        pageFeeds.getFeedEntry('board', params, 'atom'),
        pageFeeds.getFeedEntry('posts', { root }, 'rss'),
        pageFeeds.getFeedEntry('posts', { root }, 'atom'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('posts', { root }, 'rss'),
      pageFeeds.getFeedEntry('posts', { root }, 'atom'),
    ]
  },
}
