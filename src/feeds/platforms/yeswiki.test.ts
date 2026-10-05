import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isYeswikiHeaders, yeswikiHandler } from './yeswiki.js'

const rootHeaders = new Headers({
  'set-cookie':
    'YesWiki-main=0dc6fc2d07d67f79dbe824fa9153cfc3; path=/; secure; HttpOnly; SameSite=Lax',
})
const subPathHeaders = new Headers({
  'set-cookie': 'YesWiki-33.bordeaux=isl29ctq7oa663a1gkurht6atf; path=/33.bordeaux/; HttpOnly',
})
const otherHeaders = new Headers({
  'set-cookie': 'PHPSESSID=2cbc7c88dc7ef858e833faabe3da5758; path=/',
})
const entryHtml = `
  <div class="page">
    <div class="BAZ_cadre_fiche id3">
      <h1 class="BAZ_fiche_titre">Formation à distance : avril à juin 2026</h1>
    </div>
  </div>
`
const entriesHtml = `
  <div class="page">
    <div class="BAZ_cadre_fiche id3"></div>
    <div class="BAZ_cadre_fiche id3"></div>
    <div class="BAZ_cadre_fiche id5"></div>
  </div>
`
const pageHtml = `
  <div class="page">
    <h1>Page principale</h1>
  </div>
`

const staticListHtml = `
  <div class="bazar-list">
    <a
      class="nom bazar-entry modalbox"
      data-id_typeannonce="38"
      href="https://example.com/?AdrienDevos"
    >Adrien Devos</a>
    <a
      class="nom bazar-entry modalbox"
      data-id_typeannonce="38"
      href="https://example.com/?AudreyAuriault"
    >Audrey Auriault</a>
  </div>
`
const dynamicListHtml = `
  <div
    class="bazar-list-dynamic-container no-dblclick"
    data-params="{&quot;id&quot;:&quot;32&quot;,&quot;template&quot;:&quot;card&quot;,&quot;idtypeannonce&quot;:&quot;32&quot;}"
  ></div>
`
const dynamicListArrayHtml = `
  <div
    class="bazar-list-dynamic-container"
    data-params="{&quot;id&quot;:&quot;2,7&quot;,&quot;idtypeannonce&quot;:[&quot;2&quot;,&quot;7&quot;],&quot;externalModeActivated&quot;:false}"
  ></div>
`
const externalListHtml = `
  <div
    class="bazar-list-dynamic-container"
    data-params="{&quot;id&quot;:&quot;2&quot;,&quot;idtypeannonce&quot;:[&quot;2&quot;],&quot;externalModeActivated&quot;:true}"
  ></div>
`
const syndicationHtml = '<div class="bazar-entry panel panel-default collapsed"></div>'
const suffixClassHtml = '<div class="BAZ_cadre_fiche xid3"></div>'

describe('isYeswikiHeaders', () => {
  it('should return true for the session cookie of a root install', () => {
    expect(isYeswikiHeaders(rootHeaders)).toBe(true)
  })

  it('should return true for the session cookie of a sub-path install', () => {
    expect(isYeswikiHeaders(subPathHeaders)).toBe(true)
  })

  it('should return false for another session cookie', () => {
    expect(isYeswikiHeaders(otherHeaders)).toBe(false)
  })

  it('should return false for a cookie that only contains the name', () => {
    const value = new Headers({ 'set-cookie': 'MyYesWiki-x=1; path=/' })

    expect(isYeswikiHeaders(value)).toBe(false)
  })

  it('should return false without cookies', () => {
    expect(isYeswikiHeaders(new Headers())).toBe(false)
  })
})

describe('yeswikiHandler', () => {
  describe('match', () => {
    it('should match a page with the session cookie', () => {
      expect(
        yeswikiHandler.match('https://example.com/?PagePrincipale', pageHtml, rootHeaders),
      ).toBe(true)
    })

    it('should not match a page without the session cookie', () => {
      expect(
        yeswikiHandler.match('https://example.com/?PagePrincipale', pageHtml, otherHeaders),
      ).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the site feeds for a page without entries', () => {
      const value = 'https://example.com/?PagePrincipale'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, pageHtml, rootHeaders)).toEqual(expected)
    })

    it('should return the form feed of an entry page', () => {
      const value = 'https://example.com/?FormationADistanceAvrilAJuin2026'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?BazaR/rss&id=3',
          hint: { key: 'yeswiki:form-entries', label: 'Form entries' },
        },
        {
          uri: 'https://example.com/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, entryHtml, rootHeaders)).toEqual(expected)
    })

    it('should return one feed per form of a page listing entries', () => {
      const value = 'https://example.com/?BazaR&vue=consulter'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?BazaR/rss&id=3',
          hint: { key: 'yeswiki:form-entries', label: 'Form entries' },
        },
        {
          uri: 'https://example.com/?BazaR/rss&id=5',
          hint: { key: 'yeswiki:form-entries', label: 'Form entries' },
        },
        {
          uri: 'https://example.com/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, entriesHtml, rootHeaders)).toEqual(expected)
    })

    it('should not return a form feed for a form id only the URL names', () => {
      const value = 'https://example.com/?BazaR&vue=consulter&id=99999'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, pageHtml, rootHeaders)).toEqual(expected)
    })

    it('should return the feeds under the install path of a sub-path wiki', () => {
      const value = 'https://example.com/33.bordeaux/?PagePrincipale'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/33.bordeaux/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/33.bordeaux/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, pageHtml, subPathHeaders)).toEqual(expected)
    })

    it('should return the form feed of a static list', () => {
      const value = 'https://example.com/?MembreS'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?BazaR/rss&id=38',
          hint: { key: 'yeswiki:form-entries', label: 'Form entries' },
        },
        {
          uri: 'https://example.com/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, staticListHtml, rootHeaders)).toEqual(expected)
    })

    it('should return the form feed of a dynamic list', () => {
      const value = 'https://example.com/?IlsUtilisentYesWiki'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?BazaR/rss&id=32',
          hint: { key: 'yeswiki:form-entries', label: 'Form entries' },
        },
        {
          uri: 'https://example.com/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, dynamicListHtml, rootHeaders)).toEqual(expected)
    })

    it('should return the form feeds of a dynamic list of several forms', () => {
      const value = 'https://example.com/?VueAgenda'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?BazaR/rss&id=2',
          hint: { key: 'yeswiki:form-entries', label: 'Form entries' },
        },
        {
          uri: 'https://example.com/?BazaR/rss&id=7',
          hint: { key: 'yeswiki:form-entries', label: 'Form entries' },
        },
        {
          uri: 'https://example.com/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, dynamicListArrayHtml, rootHeaders)).toEqual(expected)
    })

    it('should skip a dynamic list of another wiki', () => {
      const value = 'https://example.com/?VueAgenda'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, externalListHtml, rootHeaders)).toEqual(expected)
    })

    it('should ignore a class that only ends with a form id', () => {
      const value = 'https://example.com/?PagePrincipale'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, suffixClassHtml, rootHeaders)).toEqual(expected)
    })

    it('should skip a syndication entry, which names no form', () => {
      const value = 'https://example.com/?PagePrincipale'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, syndicationHtml, rootHeaders)).toEqual(expected)
    })

    it('should return the root feeds when the cookie names no path', () => {
      const value = 'https://example.com/?PagePrincipale'
      const headers = new Headers({
        'set-cookie': 'YesWiki-main=0dc6fc2d07d67f79dbe824fa9153cfc3; HttpOnly',
      })
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/?BazaR/rss',
          hint: { key: 'yeswiki:entries', label: 'All entries' },
        },
        {
          uri: 'https://example.com/?DerniersChangementsRSS/xml',
          hint: { key: 'yeswiki:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(yeswikiHandler.resolve(value, pageHtml, headers)).toEqual(expected)
    })
  })
})
