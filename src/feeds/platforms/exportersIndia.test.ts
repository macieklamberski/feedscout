import { describe, expect, it } from 'bun:test'
import { exportersIndiaHandler, isExportersIndiaHtml } from './exportersIndia.js'

const stylesheet = `
  <link
    rel="stylesheet"
    href="https://catalog.wlimg.com/templates-images/12577/12578/catalog.css"
  >
`
const productsAnchor = `
  <a
    href="https://www.example.com/products.rss"
    target="_blank"
    title="RSS"
  >
    <img
      src="https://catalog.wlimg.com/templates-images/12577/common/rss_icon.png"
      alt="RSS"
    >
  </a>
`
const servicesAnchor = `
  <a
    href="https://www.example.com/services.rss"
    target="_blank"
    title="RSS"
  >
    <img
      src="https://catalog.wlimg.com/templates-images/12577/common/rss_icon.png"
      alt="RSS"
    >
  </a>
`
const exportersIndiaHtml = `${stylesheet}${productsAnchor}`
const servicesHtml = `${stylesheet}${servicesAnchor}`

describe('isExportersIndiaHtml', () => {
  it('should return true for the template stylesheet on the asset host', () => {
    expect(isExportersIndiaHtml(stylesheet)).toBe(true)
  })

  it('should return false for a preconnect hint to the asset host', () => {
    const value = `
      <link
        rel="preconnect"
        href="https://catalog.wlimg.com/templates-images/12569/12570/catalog.css"
      >
    `

    expect(isExportersIndiaHtml(value)).toBe(false)
  })

  it('should return false for a stylesheet on another host', () => {
    const value = `
      <link
        rel="stylesheet"
        href="https://cdn.example.com/templates-images/catalog.css"
      >
    `

    expect(isExportersIndiaHtml(value)).toBe(false)
  })
})

describe('exportersIndiaHandler', () => {
  describe('match', () => {
    it('should match a business site linking its products feed', () => {
      const value = 'https://www.example.com/cobalt-octoate.htm'

      expect(exportersIndiaHandler.match(value, exportersIndiaHtml)).toBe(true)
    })

    it('should match a business site linking its services feed', () => {
      expect(exportersIndiaHandler.match('https://www.example.com/', servicesHtml)).toBe(true)
    })

    it('should not match a link to the services feed of another host', () => {
      expect(exportersIndiaHandler.match('https://www.example.org/', servicesHtml)).toBe(false)
    })

    it('should not match a real estate site on the same template', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.com/property.rss"
          title="RSS"
        >RSS</a>
      `

      expect(exportersIndiaHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match a products feed link without the template stylesheet', () => {
      expect(exportersIndiaHandler.match('https://www.example.com/', productsAnchor)).toBe(false)
    })

    it('should not match a link to the products feed of another host', () => {
      expect(exportersIndiaHandler.match('https://www.example.org/', exportersIndiaHtml)).toBe(
        false,
      )
    })

    it('should not match without content', () => {
      expect(exportersIndiaHandler.match('https://www.example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the products feed the page links', () => {
      const expected = [
        {
          uri: 'https://www.example.com/products.rss',
          hint: { key: 'exporters-india:products', label: 'Products' },
        },
      ]

      expect(exportersIndiaHandler.resolve('https://www.example.com/', exportersIndiaHtml)).toEqual(
        expected,
      )
    })

    it('should return the services feed the page links', () => {
      const expected = [
        {
          uri: 'https://www.example.com/services.rss',
          hint: { key: 'exporters-india:services', label: 'Services' },
        },
      ]

      expect(exportersIndiaHandler.resolve('https://www.example.com/', servicesHtml)).toEqual(
        expected,
      )
    })

    it('should return both feeds when the page links both', () => {
      const value = `${stylesheet}${productsAnchor}${servicesAnchor}`
      const expected = [
        {
          uri: 'https://www.example.com/products.rss',
          hint: { key: 'exporters-india:products', label: 'Products' },
        },
        {
          uri: 'https://www.example.com/services.rss',
          hint: { key: 'exporters-india:services', label: 'Services' },
        },
      ]

      expect(exportersIndiaHandler.resolve('https://www.example.com/', value)).toEqual(expected)
    })

    it('should keep the scheme the link spells', () => {
      const value = `
        ${stylesheet}
        <a
          href="http://www.example.com/products.rss"
          title="RSS"
        >RSS</a>
      `
      const expected = [
        {
          uri: 'http://www.example.com/products.rss',
          hint: { key: 'exporters-india:products', label: 'Products' },
        },
      ]

      expect(exportersIndiaHandler.resolve('https://www.example.com/', value)).toEqual(expected)
    })

    it('should return nothing without content', () => {
      expect(exportersIndiaHandler.resolve('https://www.example.com/')).toEqual([])
    })
  })
})
