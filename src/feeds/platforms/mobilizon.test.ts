import { describe, expect, it } from 'bun:test'
import { isMobilizonHtml, mobilizonHandler } from './mobilizon.js'

const mobilizonHtml =
  "<noscript>Mobilizon doesn't work properly without JavaScript enabled.</noscript>"
const otherHtml = '<noscript>This app needs JavaScript.</noscript>'

describe('isMobilizonHtml', () => {
  it('should return true for the noscript notice', () => {
    expect(isMobilizonHtml(mobilizonHtml)).toBe(true)
  })

  it('should return false for another application shell', () => {
    expect(isMobilizonHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isMobilizonHtml('')).toBe(false)
  })
})

describe('mobilizonHandler', () => {
  describe('match', () => {
    it('should match a Mobilizon page', () => {
      expect(mobilizonHandler.match('https://example.org/@group', mobilizonHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(mobilizonHandler.match('https://example.org/@group')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(mobilizonHandler.match('not-a-url', mobilizonHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the group and instance feeds for a group page', () => {
      const value = 'https://example.org/@group'
      const expected = [
        {
          uri: 'https://example.org/@group/feed/atom',
          hint: { key: 'mobilizon:group', label: 'Group' },
        },
        {
          uri: 'https://example.org/feed/instance/atom',
          hint: { key: 'mobilizon:instance', label: 'Instance' },
        },
      ]

      expect(mobilizonHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the instance feed elsewhere', () => {
      const value = 'https://example.org/events'
      const expected = [
        {
          uri: 'https://example.org/feed/instance/atom',
          hint: { key: 'mobilizon:instance', label: 'Instance' },
        },
      ]

      expect(mobilizonHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(mobilizonHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
