import { describe, expect, it } from 'bun:test'
import {
  isMobilizonHtml,
  type MobilizonUrl,
  mobilizonHandler,
  parseMobilizonUrl,
} from './mobilizon.js'

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

describe('parseMobilizonUrl', () => {
  it('should return the group for a group page', () => {
    const expected: MobilizonUrl = { kind: 'group', group: 'framasoft' }

    expect(parseMobilizonUrl('https://mobilizon.fr/@framasoft')).toEqual(expected)
  })

  it('should return the instance for another page', () => {
    const expected: MobilizonUrl = { kind: 'instance' }

    expect(parseMobilizonUrl('https://mobilizon.fr/search')).toEqual(expected)
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseMobilizonUrl('not-a-url')).toBeUndefined()
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
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(mobilizonHandler.resolve('not-a-url')).toEqual([])
    })

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
  })
})
