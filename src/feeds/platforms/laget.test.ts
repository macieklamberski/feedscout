import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isLagetHtml, type LagetUrl, lagetHandler, parseLagetUrl } from './laget.js'

const classicPage = `
  <link
    rel="preload"
    as="font"
    href="https://g-content.laget.se/Public/Font/fontawesome-webfont.woff?v=3.2.1"
    type="font/woff2"
    crossorigin
  />
  <link
    rel="stylesheet"
    href="https://g-content.laget.se/Public/Css/site-blessed-702adedac2.css"
  >
  <script src="https://g-content.laget.se/Public/Scripts/vendor/lazysizes.min.js" async></script>
`

const scriptShellPage = `
  <script>
    window.initialData = {
      "clubUrlName": "ExempelIK",
      "isCustomDomain": true
    };
  </script>
  <script
    type="module"
    src="https://g-content.laget.se/Public/Frontend/index-c1d1486059.js"
  ></script>
  <link
    rel="stylesheet"
    href="https://g-content.laget.se/Public/Frontend/index-dda9261ce6.css"
  />
  <div id="root"></div>
`

describe('isLagetHtml', () => {
  it('should return true for a classic club page', () => {
    expect(isLagetHtml(classicPage)).toBe(true)
  })

  it('should return true for a script shell club page', () => {
    expect(isLagetHtml(scriptShellPage)).toBe(true)
  })

  it('should return false for a page with an ad linking a domain ending in laget.se', () => {
    const value = `
      <a
        class="sa-ad-sidebar__item sa-ad-sidebar__item--framed"
        href="https://www.snickeribolaget.se"
        target="_blank"
        rel="noopener"
        title="Snickeribolaget"
      ></a>
    `

    expect(isLagetHtml(value)).toBe(false)
  })

  it('should return false for a stylesheet on a domain ending in laget.se', () => {
    const value = '<link rel="stylesheet" href="https://www.snickeribolaget.se/css/site.css">'

    expect(isLagetHtml(value)).toBe(false)
  })

  it('should return false for a page with an image from the asset host', () => {
    const value = '<img src="https://g-content.laget.se/Images/Global/defaultAlbum_large.gif">'

    expect(isLagetHtml(value)).toBe(false)
  })
})

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

    it('should match a club page on its own domain', () => {
      expect(lagetHandler.match('https://example.com/', classicPage)).toBe(true)
    })

    it('should not match a laget.se site path carrying the marker', () => {
      expect(lagetHandler.match('https://www.laget.se/Login', classicPage)).toBe(false)
    })

    it('should not match a laget.se subdomain carrying the marker', () => {
      expect(lagetHandler.match('https://api.laget.se/', classicPage)).toBe(false)
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

    it('should return the news feed at the root of a club on its own domain', () => {
      const value = 'https://www.example.com/News/1234567/Valkomna-till-traningen'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.example.com/Home/NewsRss',
          hint: { key: 'laget:news', label: 'News' },
        },
      ]

      expect(lagetHandler.resolve(value, scriptShellPage)).toEqual(expected)
    })

    it('should return empty array for a laget.se site path', () => {
      expect(lagetHandler.resolve('https://www.laget.se/Login')).toEqual([])
    })

    it('should return empty array for a laget.se subdomain', () => {
      expect(lagetHandler.resolve('https://api.laget.se/')).toEqual([])
    })
  })
})
