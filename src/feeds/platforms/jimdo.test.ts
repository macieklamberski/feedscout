import { describe, expect, it } from 'bun:test'
import { isJimdoHeaders, jimdoHandler } from './jimdo.js'

const jimdoHeaders = new Headers({ 'x-jimdo-wid': 's1c8254714bfd7968' })
const otherHeaders = new Headers({ 'x-wix-request-id': '1790000000.123' })

describe('isJimdoHeaders', () => {
  it('should return true for the site id header', () => {
    expect(isJimdoHeaders(jimdoHeaders)).toBe(true)
  })

  it('should return false for another platform', () => {
    expect(isJimdoHeaders(otherHeaders)).toBe(false)
  })
})

describe('jimdoHandler', () => {
  describe('match', () => {
    it('should match a page by the site id header', () => {
      const value = 'https://www.quon-for.com/'

      expect(jimdoHandler.match(value, '<html></html>', jimdoHeaders)).toBe(true)
    })

    it('should not match the generator meta tag alone', () => {
      const value = 'https://www.quon-for.com/'
      const content = '<meta name="generator" content="Jimdo Creator">'

      expect(jimdoHandler.match(value, content, otherHeaders)).toBe(false)
    })

    it('should not match without headers', () => {
      expect(jimdoHandler.match('https://www.quon-for.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the blog feed at the site root', () => {
      const value = 'https://www.studium-universale.de/blog/'
      const expected = [
        {
          uri: 'https://www.studium-universale.de/rss/blog',
          hint: { key: 'jimdo:blog', label: 'Blog' },
        },
      ]

      expect(jimdoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog feed on a Jimdo subdomain', () => {
      const value = 'https://neubritz.jimdofree.com/'
      const expected = [
        {
          uri: 'https://neubritz.jimdofree.com/rss/blog',
          hint: { key: 'jimdo:blog', label: 'Blog' },
        },
      ]

      expect(jimdoHandler.resolve(value)).toEqual(expected)
    })
  })
})
