import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type ProboardsUrl, parseProboardsUrl, proboardsHandler } from './proboards.js'

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

  it('should return undefined for another host', () => {
    expect(parseProboardsUrl('https://example.com/')).toBeUndefined()
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
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside ProBoards', () => {
      expect(proboardsHandler.resolve('https://example.com/')).toEqual([])
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
  })
})
