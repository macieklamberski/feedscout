import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type OpeneditionUrl, openeditionHandler, parseOpeneditionUrl } from './openedition.js'

describe('parseOpeneditionUrl', () => {
  it('should return the journal for a journal home', () => {
    const expected: OpeneditionUrl = { kind: 'journal', journal: 'example' }

    expect(parseOpeneditionUrl('https://journals.openedition.org/example/')).toEqual(expected)
  })

  it('should return the journal for a journal home without a trailing slash', () => {
    const expected: OpeneditionUrl = { kind: 'journal', journal: 'example' }

    expect(parseOpeneditionUrl('https://journals.openedition.org/example')).toEqual(expected)
  })

  it('should return the journal for a document page', () => {
    const expected: OpeneditionUrl = { kind: 'journal', journal: 'example' }

    expect(parseOpeneditionUrl('https://journals.openedition.org/example/1234')).toEqual(expected)
  })

  it('should return the journal for its feed list page', () => {
    const expected: OpeneditionUrl = { kind: 'journal', journal: 'example' }
    const value = 'https://journals.openedition.org/example/?page=backend'

    expect(parseOpeneditionUrl(value)).toEqual(expected)
  })

  it('should return the journal for a hyphenated journal', () => {
    const expected: OpeneditionUrl = { kind: 'journal', journal: 'example-journal' }
    const value = 'https://journals.openedition.org/example-journal/'

    expect(parseOpeneditionUrl(value)).toEqual(expected)
  })

  it('should return the journal for a numeric journal', () => {
    const expected: OpeneditionUrl = { kind: 'journal', journal: '1234' }

    expect(parseOpeneditionUrl('https://journals.openedition.org/1234/')).toEqual(expected)
  })

  it('should return undefined for the portal home', () => {
    expect(parseOpeneditionUrl('https://journals.openedition.org/')).toBeUndefined()
  })

  it('should return undefined for a portal page with a query only', () => {
    const value = 'https://journals.openedition.org/?page=backend&format=rssarticles'

    expect(parseOpeneditionUrl(value)).toBeUndefined()
  })

  it('should return undefined for excluded paths', () => {
    expect(parseOpeneditionUrl('https://journals.openedition.org/feed.php')).toBeUndefined()
    expect(parseOpeneditionUrl('https://journals.openedition.org/wwwlodelorg/')).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseOpeneditionUrl('https://journals.openedition.org/WwwLodelOrg/')).toBeUndefined()
  })

  it('should return undefined for a dotted subdomain', () => {
    const value = 'https://www.journals.openedition.org/example/'

    expect(parseOpeneditionUrl(value)).toBeUndefined()
  })

  it('should return undefined for another OpenEdition host', () => {
    expect(parseOpeneditionUrl('https://books.openedition.org/example/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseOpeneditionUrl('https://example.com/example/')).toBeUndefined()
  })
})

describe('openeditionHandler', () => {
  describe('match', () => {
    it('should return true for a journal page', () => {
      expect(openeditionHandler.match('https://journals.openedition.org/example/1234')).toBe(true)
    })

    it('should return false for the portal home', () => {
      expect(openeditionHandler.match('https://journals.openedition.org/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the documents, issues and reviews feeds for a journal', () => {
      const value = 'https://journals.openedition.org/example/1234'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://journals.openedition.org/example/backend?format=rssdocuments',
          hint: { key: 'openedition:documents', label: 'Documents' },
        },
        {
          uri: 'https://journals.openedition.org/example/backend?format=rssnumeros',
          hint: { key: 'openedition:issues', label: 'Issues' },
        },
        {
          uri: 'https://journals.openedition.org/example/backend?format=rssdocuments&type=review',
          hint: { key: 'openedition:reviews', label: 'Reviews' },
        },
      ]

      expect(openeditionHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds for an http page', () => {
      const value = 'http://journals.openedition.org/example/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://journals.openedition.org/example/backend?format=rssdocuments',
          hint: { key: 'openedition:documents', label: 'Documents' },
        },
        {
          uri: 'https://journals.openedition.org/example/backend?format=rssnumeros',
          hint: { key: 'openedition:issues', label: 'Issues' },
        },
        {
          uri: 'https://journals.openedition.org/example/backend?format=rssdocuments&type=review',
          hint: { key: 'openedition:reviews', label: 'Reviews' },
        },
      ]

      expect(openeditionHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside OpenEdition Journals', () => {
      expect(openeditionHandler.resolve('https://example.com/example/')).toEqual([])
    })
  })
})
