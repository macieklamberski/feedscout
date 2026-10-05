import { describe, expect, it } from 'bun:test'
import { isRealEstateIndiaHtml, realEstateIndiaHandler } from './realEstateIndia.js'

const stylesheet = `
  <link
    rel="stylesheet"
    href="https://catalog.wlimg.com/templates-images/12585/12592/catalog.css"
  >
`
const propertyAnchor = `
  <a
    href="https://www.example.com/property.rss"
    target="_blank"
    title="RSS"
  >
    <img
      src="https://catalog.wlimg.com/templates-images/12585/common/rss_icon.png"
      alt="RSS"
    >
  </a>
`
const realEstateIndiaHtml = `${stylesheet}${propertyAnchor}`

describe('isRealEstateIndiaHtml', () => {
  it('should return true for the template stylesheet on the asset host', () => {
    expect(isRealEstateIndiaHtml(stylesheet)).toBe(true)
  })

  it('should return false for a preload hint to the template stylesheet', () => {
    const value = `
      <link
        rel="preload"
        as="style"
        href="https://catalog.wlimg.com/templates-images/12585/common/catalog_new.css"
      >
    `

    expect(isRealEstateIndiaHtml(value)).toBe(false)
  })

  it('should return false for a stylesheet on another host', () => {
    const value = `
      <link
        rel="stylesheet"
        href="https://cdn.example.com/templates-images/catalog.css"
      >
    `

    expect(isRealEstateIndiaHtml(value)).toBe(false)
  })
})

describe('realEstateIndiaHandler', () => {
  describe('match', () => {
    it('should match an agency site linking its property feed', () => {
      const value = 'https://www.example.com/sell/3-bhk-flat-sector-89-gurgaon-1234567.htm'

      expect(realEstateIndiaHandler.match(value, realEstateIndiaHtml)).toBe(true)
    })

    it('should not match a business site on the same template', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.com/products.rss"
          title="RSS"
        >RSS</a>
      `

      expect(realEstateIndiaHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match a property feed link without the template stylesheet', () => {
      expect(realEstateIndiaHandler.match('https://www.example.com/', propertyAnchor)).toBe(false)
    })

    it('should not match a link to the property feed of another host', () => {
      expect(realEstateIndiaHandler.match('https://www.example.org/', realEstateIndiaHtml)).toBe(
        false,
      )
    })

    it('should not match a link to a feed under another path', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.com/feeds/lifestyle/property.rss"
          title="RSS"
        >RSS</a>
      `

      expect(realEstateIndiaHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(realEstateIndiaHandler.match('https://www.example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the property feed the page links', () => {
      const expected = [
        {
          uri: 'https://www.example.com/property.rss',
          hint: { key: 'real-estate-india:properties', label: 'Properties' },
        },
      ]

      expect(
        realEstateIndiaHandler.resolve('https://www.example.com/', realEstateIndiaHtml),
      ).toEqual(expected)
    })

    it('should keep the scheme the link spells', () => {
      const value = `
        ${stylesheet}
        <a
          href="http://www.example.com/property.rss"
          target="_blank"
          title="RSS"
        >RSS</a>
      `
      const expected = [
        {
          uri: 'http://www.example.com/property.rss',
          hint: { key: 'real-estate-india:properties', label: 'Properties' },
        },
      ]

      expect(realEstateIndiaHandler.resolve('https://www.example.com/', value)).toEqual(expected)
    })

    it('should return nothing without content', () => {
      expect(realEstateIndiaHandler.resolve('https://www.example.com/')).toEqual([])
    })
  })
})
