import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  isProboardsHtml,
  type ProboardsUrl,
  parseProboardsUrl,
  proboardsHandler,
} from './proboards.js'

const coreScriptHtml = `
  <script
    type="text/javascript"
    src="//storage.proboards.com/forum/js/proboards.combined_1144.js"
  ></script>
`

describe('isProboardsHtml', () => {
  it('should return true for the core script on storage.proboards.com', () => {
    expect(isProboardsHtml(coreScriptHtml)).toBe(true)
  })

  it('should return true for the core script on storage.forums.net', () => {
    const value = `
      <script
        type="text/javascript"
        src="//storage.forums.net/forum/js/proboards.combined_1046.js"
      ></script>
    `

    expect(isProboardsHtml(value)).toBe(true)
  })

  it('should return false for another page', () => {
    expect(isProboardsHtml('<script src="https://example.com/app.js"></script>')).toBe(false)
  })
})

describe('parseProboardsUrl', () => {
  const forumUrls: Array<string> = [
    'https://example.proboards.com/',
    'https://example.proboards.com/board/15/general-board',
    'https://example.proboards.com/thread/71771/introductions',
    'https://example.freeforums.net/',
    'https://example.boards.net/',
  ]

  it.each(forumUrls)('should return the forum for %s', (value) => {
    const expected: ProboardsUrl = { kind: 'forum' }

    expect(parseProboardsUrl(value)).toEqual(expected)
  })

  const serviceUrls: Array<string> = [
    'https://www.proboards.com/',
    'https://www.freeforums.net/',
    'https://www.boards.net/',
    'https://login.proboards.com/login/1342496/1',
    'https://storage.proboards.com/forum/images/favicon.ico',
  ]

  it.each(serviceUrls)('should return undefined for the service host %s', (value) => {
    expect(parseProboardsUrl(value)).toBeUndefined()
  })

  it('should return the forum for a forum named like a service host', () => {
    const expected: ProboardsUrl = { kind: 'forum' }

    expect(parseProboardsUrl('https://login.freeforums.net/')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseProboardsUrl('https://proboards.com/')).toBeUndefined()
  })

  it('should return a custom domain for another host', () => {
    const expected: ProboardsUrl = { kind: 'customDomain' }

    expect(parseProboardsUrl('https://forum.example.com/')).toEqual(expected)
  })
})

describe('proboardsHandler', () => {
  describe('match', () => {
    it('should return true for a forum', () => {
      expect(proboardsHandler.match('https://example.proboards.com/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(proboardsHandler.match('https://example.com/')).toBe(false)
    })

    it('should return true for a custom domain carrying the core script', () => {
      expect(proboardsHandler.match('https://forum.example.com/', coreScriptHtml)).toBe(true)
    })

    it('should return false for www.proboards.com carrying the core script', () => {
      expect(proboardsHandler.match('https://www.proboards.com/', coreScriptHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a ProBoards service host', () => {
      expect(proboardsHandler.resolve('https://www.proboards.com/')).toEqual([])
    })

    it('should return the posts feed for a forum page', () => {
      const value = 'https://example.proboards.com/board/15/general-board'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.proboards.com/rss/public',
          hint: { key: 'proboards:posts', label: 'Posts' },
        },
      ]

      expect(proboardsHandler.resolve(value)).toEqual(expected)
    })

    it('should return the posts feed for a forum on a custom domain', () => {
      const value = 'https://forum.example.com/thread/71771/introductions'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://forum.example.com/rss/public',
          hint: { key: 'proboards:posts', label: 'Posts' },
        },
      ]

      expect(proboardsHandler.resolve(value, coreScriptHtml)).toEqual(expected)
    })
  })
})
