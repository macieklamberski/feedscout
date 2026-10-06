import { describe, expect, it } from 'bun:test'
import { isTalentsoftHtml, talentsoftHandler } from './talentsoft.js'

const homeHtml = `
  <html>
    <head>
      <script
        type="text/javascript"
        data-id="cookies"
        data-product="fo_recruiting"
        src="/client/dist/talentsoft-cookies.iife.js"
      ></script>
      <script src="/client/dist/tscookies.11949e98a9958816.js"></script>
    </head>
    <body>
      <a href="/offre-de-emploi/tous-les-flux-rss.aspx">Flux RSS</a>
    </body>
  </html>
`
const frenchFeedListHtml = `
  <html>
    <head>
      <script src="/client/dist/talentsoft-cookies.iife.js"></script>
    </head>
    <body>
      <div class="lstLiensRSS">
        <a
          id="lienRSS"
          class="lienimage"
          href="/handlers/offerRss.ashx?LCID=1036&amp;Rss_JobFamily=2757"
          title="Afficher le flux Rss des offres pour le crit&#232;re: Admissions (nouvelle fen&#234;tre)"
        >
          <span class="left">Admissions</span>
        </a>
      </div>
      <div class="lstLiensRSS">
        <a
          id="lienRSS"
          class="lienimage"
          href="/handlers/offerRss.ashx?LCID=1036"
          title="Afficher le flux Rss des offres pour le crit&#232;re: Toutes les offres (nouvelle fen&#234;tre)"
        >
          <span class="left">Toutes les offres</span>
        </a>
      </div>
    </body>
  </html>
`
const englishFeedListHtml = `
  <html>
    <head>
      <script src="/client/dist/talentsoft-cookies.iife.js"></script>
    </head>
    <body>
      <div class="lstLiensRSS">
        <a
          id="lienRSS"
          class="lienimage"
          href="/handlers/offerRss.ashx?LCID=2057"
          title="Display the vacancy RSS feed for the criterion: All vacancies (new window)."
        >
          <span class="left">All vacancies</span>
        </a>
      </div>
      <div class="lstLiensRSS">
        <a
          id="lienRSS"
          class="lienimage"
          href="/handlers/offerRss.ashx?LCID=2057&amp;Rss_CustomCodeTableItem=4051"
          title="Display the vacancy RSS feed for the criterion: Administration (new window)."
        >
          <span class="left">Administration</span>
        </a>
      </div>
    </body>
  </html>
`
const searchHtml = `
  <html>
    <head>
      <script
        type="text/javascript"
        data-id="cookies"
        data-product="fo_recruiting"
        src="/client/dist/talentsoft-cookies.iife.js"
      ></script>
    </head>
    <body>
      <a
        id="ctl00_ctl00_corpsRoot_corps_AfficheMoteur_linkRss"
        title="Je m&#39;abonne au flux RSS :Contrat : CDI"
        class="ts-ol-criterias-keep__link ts-ol-criterias-keep__link--rss"
        href="../handlers/offerRss.ashx?lcid=1036&amp;Rss_JobDescription_Contract=1269"
        target="_blank"
      >Flux <abbr title="Really Simple Syndication">RSS</abbr></a>
    </body>
  </html>
`
const offsiteSearchHtml = `
  <html>
    <head>
      <script src="/client/dist/talentsoft-cookies.iife.js"></script>
    </head>
    <body>
      <a
        class="ts-ol-criterias-keep__link ts-ol-criterias-keep__link--rss"
        href="https://example.org/handlers/offerRss.ashx?lcid=1036&amp;Rss_JobDescription_Contract=1269"
      >RSS</a>
    </body>
  </html>
`

describe('isTalentsoftHtml', () => {
  it('should return true for the cookie banner script', () => {
    expect(isTalentsoftHtml(homeHtml)).toBe(true)
  })

  it('should return false for the script path in text', () => {
    const value = '<p>/client/dist/talentsoft-cookies.iife.js</p>'

    expect(isTalentsoftHtml(value)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isTalentsoftHtml('')).toBe(false)
  })
})

describe('talentsoftHandler', () => {
  describe('match', () => {
    it('should match a Talentsoft page', () => {
      const value = 'https://example.com/accueil.aspx?LCID=1036'

      expect(talentsoftHandler.match(value, homeHtml)).toBe(true)
    })

    it('should not match without content', () => {
      const value = 'https://example.com/accueil.aspx?LCID=1036'

      expect(talentsoftHandler.match(value)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the offers feed in the language of the page', () => {
      const value = 'https://example.com/accueil.aspx?LCID=1036'
      const expected = [
        {
          uri: 'https://example.com/handlers/offerRss.ashx?LCID=1036',
          hint: { key: 'talentsoft:offers', label: 'Job offers' },
        },
      ]

      expect(talentsoftHandler.resolve(value, homeHtml)).toEqual(expected)
    })

    it('should read a lowercase lcid from the page url', () => {
      const value = 'https://example.com/offre-de-emploi/liste-offres.aspx?mode=layer&lcid=2057'
      const expected = [
        {
          uri: 'https://example.com/handlers/offerRss.ashx?LCID=2057',
          hint: { key: 'talentsoft:offers', label: 'Job offers' },
        },
      ]

      expect(talentsoftHandler.resolve(value, homeHtml)).toEqual(expected)
    })

    it('should return the offers feed without a language when the url names none', () => {
      const value = 'https://example.com/offre-de-emploi/emploi-juriste-h-f_1234.aspx'
      const expected = [
        {
          uri: 'https://example.com/handlers/offerRss.ashx',
          hint: { key: 'talentsoft:offers', label: 'Job offers' },
        },
      ]

      expect(talentsoftHandler.resolve(value, homeHtml)).toEqual(expected)
    })

    it('should take the language of the all offers link on the French feed list page', () => {
      const value = 'https://example.com/offre-de-emploi/tous-les-flux-rss.aspx'
      const expected = [
        {
          uri: 'https://example.com/handlers/offerRss.ashx?LCID=1036',
          hint: { key: 'talentsoft:offers', label: 'Job offers' },
        },
      ]

      expect(talentsoftHandler.resolve(value, frenchFeedListHtml)).toEqual(expected)
    })

    it('should take the language of the all offers link on the English feed list page', () => {
      const value = 'https://example.com/job/all-rss-feeds.aspx'
      const expected = [
        {
          uri: 'https://example.com/handlers/offerRss.ashx?LCID=2057',
          hint: { key: 'talentsoft:offers', label: 'Job offers' },
        },
      ]

      expect(talentsoftHandler.resolve(value, englishFeedListHtml)).toEqual(expected)
    })

    it('should ignore a non-numeric lcid', () => {
      const value = 'https://example.com/accueil.aspx?LCID=fr'
      const expected = [
        {
          uri: 'https://example.com/handlers/offerRss.ashx',
          hint: { key: 'talentsoft:offers', label: 'Job offers' },
        },
      ]

      expect(talentsoftHandler.resolve(value, homeHtml)).toEqual(expected)
    })

    it('should return the search feed the page links and the offers feed', () => {
      const value =
        'https://example.com/offre-de-emploi/liste-offres.aspx?changefacet=1&facet_Contract=1269'
      const expected = [
        {
          uri: 'https://example.com/handlers/offerRss.ashx?lcid=1036&Rss_JobDescription_Contract=1269',
          hint: { key: 'talentsoft:search', label: 'Search results' },
        },
        {
          uri: 'https://example.com/handlers/offerRss.ashx',
          hint: { key: 'talentsoft:offers', label: 'Job offers' },
        },
      ]

      expect(talentsoftHandler.resolve(value, searchHtml)).toEqual(expected)
    })

    it('should skip a search link on another host', () => {
      const value = 'https://example.com/offre-de-emploi/liste-offres.aspx?LCID=1036'
      const expected = [
        {
          uri: 'https://example.com/handlers/offerRss.ashx?LCID=1036',
          hint: { key: 'talentsoft:offers', label: 'Job offers' },
        },
      ]

      expect(talentsoftHandler.resolve(value, offsiteSearchHtml)).toEqual(expected)
    })
  })
})
