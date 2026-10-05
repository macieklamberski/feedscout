import { describe, expect, it } from 'bun:test'
import { isTourTravelWorldHtml, tourTravelWorldHandler } from './tourTravelWorld.js'

const stylesheet = `
  <link
    rel="stylesheet"
    href="https://catalog.wlimg.com/templates-images/12569/12570/catalog.css"
  >
`
const packagesAnchor = `
  <a
    href="https://www.example.com/tour-packages.rss"
    target="_blank"
    title="RSS"
  >
    <img
      src="https://catalog.wlimg.com/templates-images/12569/common/rss_icon.png"
      alt="RSS"
    >
  </a>
`
const tourTravelWorldHtml = `${stylesheet}${packagesAnchor}`

describe('isTourTravelWorldHtml', () => {
  it('should return true for the template stylesheet on the asset host', () => {
    expect(isTourTravelWorldHtml(stylesheet)).toBe(true)
  })

  it('should return false for a preconnect hint to the asset host', () => {
    const value = `
      <link
        rel="preconnect"
        href="https://catalog.wlimg.com/templates-images/12569/12570/catalog.css"
      >
    `

    expect(isTourTravelWorldHtml(value)).toBe(false)
  })

  it('should return false for a stylesheet on another host', () => {
    const value = `
      <link
        rel="stylesheet"
        href="https://cdn.example.com/templates-images/catalog.css"
      >
    `

    expect(isTourTravelWorldHtml(value)).toBe(false)
  })
})

describe('tourTravelWorldHandler', () => {
  describe('match', () => {
    it('should match a travel site linking its tour packages feed', () => {
      const value = 'https://www.example.com/tour-packages/kashmir-tour.htm'

      expect(tourTravelWorldHandler.match(value, tourTravelWorldHtml)).toBe(true)
    })

    it('should not match an exporter site on the same template', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.com/products.rss"
          title="RSS"
        >RSS</a>
      `

      expect(tourTravelWorldHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match a tour packages feed link without the template stylesheet', () => {
      expect(tourTravelWorldHandler.match('https://www.example.com/', packagesAnchor)).toBe(false)
    })

    it('should not match a link to the tour packages feed of another host', () => {
      expect(tourTravelWorldHandler.match('https://www.example.org/', tourTravelWorldHtml)).toBe(
        false,
      )
    })

    it('should not match a link to a feed under another path', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.com/blog/tour-packages.rss"
          title="RSS"
        >RSS</a>
      `

      expect(tourTravelWorldHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(tourTravelWorldHandler.match('https://www.example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the tour packages feed the page links', () => {
      const expected = [
        {
          uri: 'https://www.example.com/tour-packages.rss',
          hint: { key: 'tour-travel-world:tour-packages', label: 'Tour packages' },
        },
      ]

      expect(
        tourTravelWorldHandler.resolve('https://www.example.com/', tourTravelWorldHtml),
      ).toEqual(expected)
    })

    it('should return nothing without content', () => {
      expect(tourTravelWorldHandler.resolve('https://www.example.com/')).toEqual([])
    })
  })
})
