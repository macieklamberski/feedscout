import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  getTischtennislivePage,
  parseTischtennisliveUrl,
  type TischtennislivePage,
  type TischtennisliveUrl,
  tischtennisliveHandler,
} from './tischtennislive.js'

const groupHtml = `
  <td>Die Spiele der letzten 10 Tage</td>
  <td align="right">
    <a href="/Export/Tischtennis/RSS.aspx?Typ=Gruppe&ID=1234&Next=0">
      <img src="Resource/img/Icon_RSS_Small.gif" title="RSS-Feed von Spielen der letzten 10 Tage">
    </a>
    <a href="/Ajax/Tischtennis/Verband_Spiele.aspx?Typ=Gruppe&ID=1234&Next=0">
      <img src="Resource/img/Icon_HTML.gif" title="HTML-Export von Spielen der letzten 10 Tage">
    </a>
  </td>
  <td align="right">
    <a href="/Export/Tischtennis/RSS.aspx?Typ=Gruppe&ID=1234&Next=1">
      <img src="Resource/img/Icon_RSS_Small.gif" title="RSS-Feed von Spielen der nächsten 10 Tage">
    </a>
  </td>
`

const leagueHtml = `
  <td align="right">
    <a href="/Export/Tischtennis/RSS.aspx?Typ=Wett&ID=56789&Next=0">
      <img src="Resource/img/Icon_RSS_Small.gif" title="RSS-Feed von Spielen der letzten 10 Tage">
    </a>
  </td>
  <td align="right">
    <a href="/Export/Tischtennis/RSS.aspx?Typ=Wett&ID=56789&Next=1">
      <img src="Resource/img/Icon_RSS_Small.gif" title="RSS-Feed von Spielen der nächsten 10 Tage">
    </a>
  </td>
`

const homeHtml = `
  <link rel="alternate" type="application/rss+xml" title="RDF-Datei" href="/Export/RSS.aspx" />
  <a href="?L1=Ergebnisse&L2=TTStaffeln&L2P=56789">1. Bezirksliga</a>
`

describe('parseTischtennisliveUrl', () => {
  it('should return the association for an association subdomain', () => {
    const expected: TischtennisliveUrl = { kind: 'association' }

    expect(parseTischtennisliveUrl('https://musterkreis.tischtennislive.de/')).toEqual(expected)
  })

  it('should return the association for a page of the association', () => {
    const value = 'https://musterkreis.tischtennislive.de/?L1=Ergebnisse&L2=TTStaffeln&L2P=56789'
    const expected: TischtennisliveUrl = { kind: 'association' }

    expect(parseTischtennisliveUrl(value)).toEqual(expected)
  })

  it('should return undefined for the www product page', () => {
    expect(parseTischtennisliveUrl('https://www.tischtennislive.de/')).toBeUndefined()
  })

  it('should return undefined for a dotted subdomain', () => {
    expect(parseTischtennisliveUrl('https://www.musterkreis.tischtennislive.de/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseTischtennisliveUrl('https://tischtennislive.de/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseTischtennisliveUrl('https://example.com/')).toBeUndefined()
  })
})

describe('getTischtennislivePage', () => {
  it('should return the group a match overview links', () => {
    const value =
      'https://musterkreis.tischtennislive.de/?L1=Ergebnisse&L2=TTStaffeln&L3=SpielUebersicht&Gruppe=1234'
    const expected: TischtennislivePage = { kind: 'group', group: '1234' }

    expect(getTischtennislivePage(value, groupHtml)).toEqual(expected)
  })

  it('should return the league a league overview links', () => {
    const value = 'https://musterkreis.tischtennislive.de/?L1=Ergebnisse&L2=TTStaffeln&L2P=56789'
    const expected: TischtennislivePage = { kind: 'league', league: '56789' }

    expect(getTischtennislivePage(value, leagueHtml)).toEqual(expected)
  })

  it('should return the group the page links over the one its url names', () => {
    const value =
      'https://musterkreis.tischtennislive.de/?L1=Ergebnisse&L2=TTStaffeln&L3=SpielUebersicht&Gruppe=9999'
    const expected: TischtennislivePage = { kind: 'group', group: '1234' }

    expect(getTischtennislivePage(value, groupHtml)).toEqual(expected)
  })

  it('should return the association for a league url whose page links no feed', () => {
    const value = 'https://musterkreis.tischtennislive.de/?L1=Ergebnisse&L2=TTStaffeln&L2P=56789'
    const expected: TischtennislivePage = { kind: 'association' }

    expect(getTischtennislivePage(value, homeHtml)).toEqual(expected)
  })

  it('should return the association for a results link on another association', () => {
    const value = 'https://musterkreis.tischtennislive.de/'
    const content = `
      <a href="https://musterland.tischtennislive.de/Export/Tischtennis/RSS.aspx?Typ=Wett&ID=56789&Next=0">
        RSS
      </a>
    `
    const expected: TischtennislivePage = { kind: 'association' }

    expect(getTischtennislivePage(value, content)).toEqual(expected)
  })

  it('should return the association for a results link of an unknown type', () => {
    const value = 'https://musterkreis.tischtennislive.de/'
    const content = '<a href="/Export/Tischtennis/RSS.aspx?Typ=Verein&ID=56789&Next=0">RSS</a>'
    const expected: TischtennislivePage = { kind: 'association' }

    expect(getTischtennislivePage(value, content)).toEqual(expected)
  })

  it('should skip a same-host link outside the results feed path', () => {
    const value = 'https://musterkreis.tischtennislive.de/'
    const content = `
      <a href="/Ajax/Tischtennis/Verband_Spiele.aspx?Typ=Gruppe&ID=1111&Next=0">HTML</a>
      <a href="/Export/Tischtennis/RSS.aspx?Typ=Gruppe&ID=1234&Next=0">RSS</a>
    `
    const expected: TischtennislivePage = { kind: 'group', group: '1234' }

    expect(getTischtennislivePage(value, content)).toEqual(expected)
  })

  it('should return the association for a results link without an id', () => {
    const value = 'https://musterkreis.tischtennislive.de/'
    const content = '<a href="/Export/Tischtennis/RSS.aspx?Typ=Wett&Next=0">RSS</a>'
    const expected: TischtennislivePage = { kind: 'association' }

    expect(getTischtennislivePage(value, content)).toEqual(expected)
  })

  it('should return the association for a results link with a non-numeric id', () => {
    const value = 'https://musterkreis.tischtennislive.de/'
    const content = '<a href="/Export/Tischtennis/RSS.aspx?Typ=Wett&ID=abc&Next=0">RSS</a>'
    const expected: TischtennislivePage = { kind: 'association' }

    expect(getTischtennislivePage(value, content)).toEqual(expected)
  })

  it('should return the association without content', () => {
    const value = 'https://musterkreis.tischtennislive.de/'
    const expected: TischtennislivePage = { kind: 'association' }

    expect(getTischtennislivePage(value, undefined)).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(getTischtennislivePage('https://example.com/', leagueHtml)).toBeUndefined()
  })
})

describe('tischtennisliveHandler', () => {
  describe('match', () => {
    it('should return true for an association', () => {
      expect(tischtennisliveHandler.match('https://musterkreis.tischtennislive.de/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(tischtennisliveHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the group feeds for a match overview', () => {
      const value =
        'https://musterkreis.tischtennislive.de/?L1=Ergebnisse&L2=TTStaffeln&L3=SpielUebersicht&Gruppe=1234'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://musterkreis.tischtennislive.de/Export/Tischtennis/RSS.aspx?Typ=Gruppe&ID=1234&Next=0',
          hint: { key: 'tischtennislive:group-results', label: 'Group results' },
        },
        {
          uri: 'https://musterkreis.tischtennislive.de/Export/Tischtennis/RSS.aspx?Typ=Gruppe&ID=1234&Next=1',
          hint: { key: 'tischtennislive:group-fixtures', label: 'Group fixtures' },
        },
      ]

      expect(tischtennisliveHandler.resolve(value, groupHtml)).toEqual(expected)
    })

    it('should return the league feeds for a league overview', () => {
      const value = 'https://musterkreis.tischtennislive.de/?L1=Ergebnisse&L2=TTStaffeln&L2P=56789'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://musterkreis.tischtennislive.de/Export/Tischtennis/RSS.aspx?Typ=Wett&ID=56789&Next=0',
          hint: { key: 'tischtennislive:league-results', label: 'League results' },
        },
        {
          uri: 'https://musterkreis.tischtennislive.de/Export/Tischtennis/RSS.aspx?Typ=Wett&ID=56789&Next=1',
          hint: { key: 'tischtennislive:league-fixtures', label: 'League fixtures' },
        },
      ]

      expect(tischtennisliveHandler.resolve(value, leagueHtml)).toEqual(expected)
    })

    it('should return the association feeds for the home page', () => {
      const value = 'https://musterkreis.tischtennislive.de/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://musterkreis.tischtennislive.de/Export/RSS.aspx',
          hint: { key: 'tischtennislive:news', label: 'News' },
        },
        {
          uri: 'https://musterkreis.tischtennislive.de/Export/RSS_Termine.aspx',
          hint: { key: 'tischtennislive:dates', label: 'Dates' },
        },
        {
          uri: 'https://musterkreis.tischtennislive.de/Export/RSS_Dokumente.aspx',
          hint: { key: 'tischtennislive:documents', label: 'Documents' },
        },
        {
          uri: 'https://musterkreis.tischtennislive.de/Export/Tischtennis/RSS_Turniere.aspx',
          hint: { key: 'tischtennislive:tournaments', label: 'Tournaments' },
        },
      ]

      expect(tischtennisliveHandler.resolve(value, homeHtml)).toEqual(expected)
    })

    it('should return empty array for a URL outside TischtennisLive', () => {
      expect(tischtennisliveHandler.resolve('https://example.com/', leagueHtml)).toEqual([])
    })
  })
})
