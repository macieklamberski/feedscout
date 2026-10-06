import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type LagetUrl, lagetHandler, parseLagetUrl } from './laget.js'

describe('parseLagetUrl', () => {
  it('should return the team for a team home page', () => {
    const expected: LagetUrl = { kind: 'team', team: 'ExempelIF' }

    expect(parseLagetUrl('https://www.laget.se/ExempelIF')).toEqual(expected)
  })

  it('should return the team for a news page', () => {
    const expected: LagetUrl = { kind: 'team', team: 'ExempelIF-P14' }
    const value = 'https://www.laget.se/ExempelIF-P14/News/1234567/Valkomna-till-traningen'

    expect(parseLagetUrl(value)).toEqual(expected)
  })

  it('should return the team for the apex host', () => {
    const expected: LagetUrl = { kind: 'team', team: 'exempelif' }

    expect(parseLagetUrl('https://laget.se/exempelif')).toEqual(expected)
  })

  it('should keep the case of the team', () => {
    const expected: LagetUrl = { kind: 'team', team: 'EXEMPELIF_F12' }

    expect(parseLagetUrl('https://www.laget.se/EXEMPELIF_F12/')).toEqual(expected)
  })

  const sitePaths = [
    'https://www.laget.se/Login',
    'https://www.laget.se/cupguiden',
    'https://www.laget.se/cupguide',
    'https://www.laget.se/Content/',
    'https://www.laget.se/Common/Images/logo.png',
    'https://www.laget.se/Handlers/Image.ashx',
    'https://www.laget.se/Price.html',
    'https://www.laget.se/Search.html',
  ]

  it.each(sitePaths)('should return undefined for site path %s', (value) => {
    expect(parseLagetUrl(value)).toBeUndefined()
  })

  it('should return undefined for the host root', () => {
    expect(parseLagetUrl('https://www.laget.se/')).toBeUndefined()
  })

  const otherHosts = [
    'https://bloggen.laget.se/exempelif',
    'https://www.exempelif.laget.se/exempelif',
    'https://example.com/exempelif',
  ]

  it.each(otherHosts)('should return undefined for %s', (value) => {
    expect(parseLagetUrl(value)).toBeUndefined()
  })
})

describe('lagetHandler', () => {
  describe('match', () => {
    it('should match a team page', () => {
      expect(lagetHandler.match('https://www.laget.se/ExempelIF')).toBe(true)
    })

    it('should not match another host', () => {
      expect(lagetHandler.match('https://example.com/ExempelIF')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the news feed for a team page', () => {
      const value = 'https://laget.se/ExempelIF-P14/News/1234567/Valkomna-till-traningen'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.laget.se/ExempelIF-P14/Home/NewsRss',
          hint: { key: 'laget:news', label: 'News' },
        },
      ]

      expect(lagetHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside laget.se', () => {
      expect(lagetHandler.resolve('https://example.com/ExempelIF')).toEqual([])
    })
  })
})
