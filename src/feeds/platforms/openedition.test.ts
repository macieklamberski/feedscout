import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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
    const value = 'https://journals.openedition.org/example/?page=backend'
    const expected: OpeneditionUrl = { kind: 'journal', journal: 'example' }

    expect(parseOpeneditionUrl(value)).toEqual(expected)
  })

  it('should return the journal for a hyphenated journal', () => {
    const value = 'https://journals.openedition.org/example-journal/'
    const expected: OpeneditionUrl = { kind: 'journal', journal: 'example-journal' }

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

  it('should return undefined for a dotted first segment', () => {
    expect(parseOpeneditionUrl('https://journals.openedition.org/feed.php')).toBeUndefined()
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

  describe('getFeedHint', () => {
    it('should return the documents hint for the documents feed', () => {
      const value = 'https://journals.openedition.org/example/backend?format=rssdocuments'
      const expected: DiscoverUriHint = { key: 'openedition:documents', label: 'Documents' }

      expect(openeditionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the documents hint for the documents feed at backend.html', () => {
      const value = 'https://journals.openedition.org/example/backend.html?format=rssdocuments'
      const expected: DiscoverUriHint = { key: 'openedition:documents', label: 'Documents' }

      expect(openeditionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the documents hint for the documents feed at the journal home', () => {
      const value = 'https://journals.openedition.org/example/?page=backend&format=rssdocuments'
      const expected: DiscoverUriHint = { key: 'openedition:documents', label: 'Documents' }

      expect(openeditionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the entity hint for the documents feed of one entity', () => {
      const value =
        'https://journals.openedition.org/example/backend?format=rssdocuments&identity=12345'
      const expected: DiscoverUriHint = { key: 'openedition:entity', label: 'Entity' }

      expect(openeditionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the index entry hint for the documents feed of one index entry', () => {
      const value =
        'https://journals.openedition.org/example/backend?descriptionlength=800&format=rssdocuments&getreviews=1&idcontainer=12345'
      const expected: DiscoverUriHint = { key: 'openedition:index-entry', label: 'Index entry' }

      expect(openeditionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the issues hint for the issues feed', () => {
      const value = 'https://journals.openedition.org/example/backend?format=rssnumeros'
      const expected: DiscoverUriHint = { key: 'openedition:issues', label: 'Issues' }

      expect(openeditionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the issues hint for the issues feed at backend.html', () => {
      const value = 'https://journals.openedition.org/example/backend.html?format=rssnumeros'
      const expected: DiscoverUriHint = { key: 'openedition:issues', label: 'Issues' }

      expect(openeditionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the issues hint for the issues feed at the journal home', () => {
      const value = 'https://journals.openedition.org/example/?page=backend&format=rssnumeros'
      const expected: DiscoverUriHint = { key: 'openedition:issues', label: 'Issues' }

      expect(openeditionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the reviews hint for the reviews feed', () => {
      const value =
        'https://journals.openedition.org/example/backend?format=rssdocuments&type=review'
      const expected: DiscoverUriHint = { key: 'openedition:reviews', label: 'Reviews' }

      expect(openeditionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the reviews hint for the reviews feed at backend.html', () => {
      const value =
        'https://journals.openedition.org/example/backend.html?format=rssdocuments&type=review'
      const expected: DiscoverUriHint = { key: 'openedition:reviews', label: 'Reviews' }

      expect(openeditionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the reviews hint for the reviews feed at the journal home', () => {
      const value =
        'https://journals.openedition.org/example/?page=backend&format=rssdocuments&type=review'
      const expected: DiscoverUriHint = { key: 'openedition:reviews', label: 'Reviews' }

      expect(openeditionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a journal home', () => {
      const value = 'https://journals.openedition.org/example/'

      expect(openeditionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed list page of a journal', () => {
      const value = 'https://journals.openedition.org/example/?page=backend'

      expect(openeditionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed of the portal', () => {
      const value = 'https://journals.openedition.org/?page=backend&format=rssarticles'

      expect(openeditionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed of another OpenEdition host', () => {
      const value = 'https://books.openedition.org/example/backend/?format=rss'

      expect(openeditionHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const documentsHint: DiscoverUriHint = { key: 'openedition:documents', label: 'Documents' }
    const issuesHint: DiscoverUriHint = { key: 'openedition:issues', label: 'Issues' }
    const reviewsHint: DiscoverUriHint = { key: 'openedition:reviews', label: 'Reviews' }
    const entityHint: DiscoverUriHint = { key: 'openedition:entity', label: 'Entity' }
    const indexEntryHint: DiscoverUriHint = { key: 'openedition:index-entry', label: 'Index entry' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://journals.openedition.org/example/backend?format=rssdocuments', documentsHint],
      ['http://journals.openedition.org/example/backend.html?format=rssdocuments', documentsHint],
      ['https://journals.openedition.org/example/?page=backend&format=rssdocuments', documentsHint],
      ['https://journals.openedition.org/example/backend?format=rssnumeros', issuesHint],
      ['https://journals.openedition.org/example/backend.html?format=rssnumeros', issuesHint],
      [
        'https://journals.openedition.org/example/backend?format=rssdocuments&type=review',
        reviewsHint,
      ],
      [
        'http://journals.openedition.org/example/backend?type=review&format=rssdocuments',
        reviewsHint,
      ],
      [
        'https://journals.openedition.org/example/backend?format=rssdocuments&identity=12345',
        entityHint,
      ],
      [
        'https://journals.openedition.org/example/backend?class=noticesbiblios&descriptionlength=800&format=rssdocuments&idcontainer=12345',
        indexEntryHint,
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [openeditionHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
