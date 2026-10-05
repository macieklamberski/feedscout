import { describe, expect, it } from 'bun:test'
import { isPlacementIndiaHtml, placementIndiaHandler } from './placementIndia.js'

const stylesheet = `
  <link
    rel="stylesheet"
    href="https://catalog.wlimg.com/templates-images/12569/12574/catalog.css"
  >
`
const vacanciesAnchor = `
  <a
    href="https://www.example.com/vacancy.rss"
    target="_blank"
    title="RSS"
  >
    <img
      src="https://catalog.wlimg.com/templates-images/12569/common/rss_icon.png"
      alt="RSS"
    >
  </a>
`
const placementIndiaHtml = `${stylesheet}${vacanciesAnchor}`

describe('isPlacementIndiaHtml', () => {
  it('should return true for the template stylesheet on the asset host', () => {
    expect(isPlacementIndiaHtml(stylesheet)).toBe(true)
  })

  it('should return false for a preconnect hint to the asset host', () => {
    const value = `
      <link
        rel="preconnect"
        href="https://catalog.wlimg.com/templates-images/12569/12574/catalog.css"
      >
    `

    expect(isPlacementIndiaHtml(value)).toBe(false)
  })

  it('should return false for a stylesheet on another host', () => {
    const value = `
      <link
        rel="stylesheet"
        href="https://cdn.example.com/templates-images/catalog.css"
      >
    `

    expect(isPlacementIndiaHtml(value)).toBe(false)
  })
})

describe('placementIndiaHandler', () => {
  describe('match', () => {
    it('should match a jobs site linking its vacancies feed', () => {
      const value = 'https://www.example.com/job-openings-for-python-developer-jaipur-1234567.htm'

      expect(placementIndiaHandler.match(value, placementIndiaHtml)).toBe(true)
    })

    it('should not match an exporter site on the same template', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.com/products.rss"
          title="RSS"
        >RSS</a>
      `

      expect(placementIndiaHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match a vacancies feed link without the template stylesheet', () => {
      expect(placementIndiaHandler.match('https://www.example.com/', vacanciesAnchor)).toBe(false)
    })

    it('should not match a link to the vacancies feed of another host', () => {
      expect(placementIndiaHandler.match('https://www.example.org/', placementIndiaHtml)).toBe(
        false,
      )
    })

    it('should not match a link to a feed under another path', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.com/blog/vacancy.rss"
          title="RSS"
        >RSS</a>
      `

      expect(placementIndiaHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match a job page linking only its job opening feed', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.com/vacancy_1234567.rss"
          target="_blank"
        >RSS Feed</a>
      `

      expect(placementIndiaHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(placementIndiaHandler.match('https://www.example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the vacancies feed the page links', () => {
      const expected = [
        {
          uri: 'https://www.example.com/vacancy.rss',
          hint: { key: 'placement-india:vacancy', label: 'Vacancies' },
        },
      ]

      expect(placementIndiaHandler.resolve('https://www.example.com/', placementIndiaHtml)).toEqual(
        expected,
      )
    })

    it('should keep the http spelling of a feed linked from an https page', () => {
      const value = `
        ${stylesheet}
        <a
          href="http://www.example.com/vacancy.rss"
          title="RSS"
        >RSS</a>
      `
      const expected = [
        {
          uri: 'http://www.example.com/vacancy.rss',
          hint: { key: 'placement-india:vacancy', label: 'Vacancies' },
        },
      ]

      expect(placementIndiaHandler.resolve('https://www.example.com/', value)).toEqual(expected)
    })

    it('should return the job opening feed a job page links beside the vacancies feed', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.com/vacancy_1234567.rss"
          target="_blank"
          class="p5px15px dib c3px"
          style="background:#f8991b;color:#ffffff;"
        ><i class="fa fa-feed"></i> RSS Feed </a>
        ${vacanciesAnchor}
      `
      const expected = [
        {
          uri: 'https://www.example.com/vacancy_1234567.rss',
          hint: { key: 'placement-india:job-opening', label: 'Job opening' },
        },
        {
          uri: 'https://www.example.com/vacancy.rss',
          hint: { key: 'placement-india:vacancy', label: 'Vacancies' },
        },
      ]

      expect(
        placementIndiaHandler.resolve(
          'https://www.example.com/job-openings-for-python-developer-jaipur-1234567.htm',
          value,
        ),
      ).toEqual(expected)
    })

    it('should not build a job opening feed from the job page url alone', () => {
      const expected = [
        {
          uri: 'https://www.example.com/vacancy.rss',
          hint: { key: 'placement-india:vacancy', label: 'Vacancies' },
        },
      ]

      expect(
        placementIndiaHandler.resolve(
          'https://www.example.com/job-openings-for-python-developer-jaipur-1234567.htm',
          placementIndiaHtml,
        ),
      ).toEqual(expected)
    })

    it('should not return a job opening feed of another host', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.org/vacancy_1234567.rss"
          target="_blank"
        >RSS Feed</a>
        ${vacanciesAnchor}
      `
      const expected = [
        {
          uri: 'https://www.example.com/vacancy.rss',
          hint: { key: 'placement-india:vacancy', label: 'Vacancies' },
        },
      ]

      expect(placementIndiaHandler.resolve('https://www.example.com/', value)).toEqual(expected)
    })

    it('should not return a job opening feed under another path', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.com/blog/vacancy_1234567.rss"
          target="_blank"
        >RSS Feed</a>
        ${vacanciesAnchor}
      `
      const expected = [
        {
          uri: 'https://www.example.com/vacancy.rss',
          hint: { key: 'placement-india:vacancy', label: 'Vacancies' },
        },
      ]

      expect(placementIndiaHandler.resolve('https://www.example.com/', value)).toEqual(expected)
    })

    it('should return the first of each feed the page links', () => {
      const value = `
        ${stylesheet}
        <a
          href="https://www.example.com/vacancy_1234567.rss"
          target="_blank"
        >RSS Feed</a>
        <a
          href="http://www.example.com/vacancy.rss"
          title="RSS"
        >RSS</a>
        <a
          href="https://www.example.com/vacancy_7654321.rss"
          target="_blank"
        >RSS Feed</a>
        ${vacanciesAnchor}
      `
      const expected = [
        {
          uri: 'https://www.example.com/vacancy_1234567.rss',
          hint: { key: 'placement-india:job-opening', label: 'Job opening' },
        },
        {
          uri: 'http://www.example.com/vacancy.rss',
          hint: { key: 'placement-india:vacancy', label: 'Vacancies' },
        },
      ]

      expect(
        placementIndiaHandler.resolve(
          'https://www.example.com/job-openings-for-python-developer-jaipur-1234567.htm',
          value,
        ),
      ).toEqual(expected)
    })

    it('should return nothing without content', () => {
      expect(placementIndiaHandler.resolve('https://www.example.com/')).toEqual([])
    })
  })
})
