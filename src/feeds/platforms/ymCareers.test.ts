import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  isYmCareersHeaders,
  parseYmCareersUrl,
  type YmCareersUrl,
  ymCareersHandler,
} from './ymCareers.js'

const ymCareersHeaders = new Headers({
  server: 'nginx',
  'x-nas-sid': '5e2f7a10-3c4d-4b8e-9f01-a2b3c4d5e6f7',
  'x-us': 'UNK',
})
const otherHeaders = new Headers({ server: 'nginx' })

describe('isYmCareersHeaders', () => {
  it('should return true for the board header', () => {
    expect(isYmCareersHeaders(ymCareersHeaders)).toBe(true)
  })

  it('should return false for other headers', () => {
    expect(isYmCareersHeaders(otherHeaders)).toBe(false)
  })
})

describe('parseYmCareersUrl', () => {
  it('should return the query of a search', () => {
    const value = 'https://careers.example.com/jobs?keywords=engineer&resultsPerPage=25'
    const expected: YmCareersUrl = {
      kind: 'search',
      path: '/jobs',
      query: 'keywords=engineer&resultsPerPage=25',
    }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should return the query of a search with a trailing slash', () => {
    const value = 'https://careers.example.com/jobs/?keywords=engineer'
    const expected: YmCareersUrl = { kind: 'search', path: '/jobs/', query: 'keywords=engineer' }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should return an empty query for the job list', () => {
    const value = 'https://careers.example.com/jobs/'
    const expected: YmCareersUrl = { kind: 'search', path: '/jobs/', query: '' }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should drop the empty pieces of a query', () => {
    const value = 'https://careers.example.com/jobs?keywords=engineer&&page=2&'
    const expected: YmCareersUrl = { kind: 'search', path: '/jobs', query: 'keywords=engineer' }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should drop the display and page parameters', () => {
    const value = 'https://careers.example.com/jobs?display=rss&keywords=engineer&page=2'
    const expected: YmCareersUrl = { kind: 'search', path: '/jobs', query: 'keywords=engineer' }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should return the filter of a browse page', () => {
    const value = 'https://careers.example.com/jobs/category/coaching-basketball'
    const expected: YmCareersUrl = {
      kind: 'browse',
      facets: '/category/coaching-basketball',
      query: '',
    }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should return every filter of a browse page', () => {
    const value = 'https://careers.example.com/jobs/country/united-states/type/full-time/'
    const expected: YmCareersUrl = {
      kind: 'browse',
      facets: '/country/united-states/type/full-time',
      query: '',
    }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should drop the page number of a browse page', () => {
    const value = 'https://careers.example.com/jobs/level/entry-level/page4'
    const expected: YmCareersUrl = { kind: 'browse', facets: '/level/entry-level', query: '' }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should return the query of a browse page', () => {
    const value = 'https://careers.example.com/jobs/state_province/texas?keywords=nurse'
    const expected: YmCareersUrl = {
      kind: 'browse',
      facets: '/state_province/texas',
      query: 'keywords=nurse',
    }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should ignore the case of the jobs path', () => {
    const value = 'https://careers.example.com/Jobs?keywords=engineer'
    const expected: YmCareersUrl = { kind: 'search', path: '/jobs', query: 'keywords=engineer' }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should fall back to the whole board for a job', () => {
    const value = 'https://careers.example.com/jobs/12345678/assistant-coach?keywords=coach'
    const expected: YmCareersUrl = { kind: 'search', path: '/jobs', query: '' }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should fall back to the whole board for the browse index', () => {
    const value = 'https://careers.example.com/jobs/browse'
    const expected: YmCareersUrl = { kind: 'search', path: '/jobs', query: '' }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should fall back to the whole board for the home page', () => {
    const value = 'https://careers.example.com/'
    const expected: YmCareersUrl = { kind: 'search', path: '/jobs', query: '' }

    expect(parseYmCareersUrl(value)).toEqual(expected)
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseYmCareersUrl('not a url')).toBeUndefined()
  })
})

describe('ymCareersHandler', () => {
  describe('match', () => {
    it('should match a board by its headers', () => {
      const value = 'https://careers.example.com/jobs'

      expect(ymCareersHandler.match(value, '', ymCareersHeaders)).toBe(true)
    })

    it('should not match another site', () => {
      const value = 'https://careers.example.com/jobs'

      expect(ymCareersHandler.match(value, '', otherHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the search feed', () => {
      const value = 'https://careers.example.com/jobs/?keywords=engineer&resultsPerPage=25'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://careers.example.com/jobs/?display=rss&keywords=engineer&resultsPerPage=25',
          hint: { key: 'ym-careers:search', label: 'Job search' },
        },
      ]

      expect(ymCareersHandler.resolve(value, '', ymCareersHeaders)).toEqual(expected)
    })

    it('should keep the encoding of the search query', () => {
      const value = 'https://careers.example.com/jobs?keywords=a%20b'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://careers.example.com/jobs?display=rss&keywords=a%20b',
          hint: { key: 'ym-careers:search', label: 'Job search' },
        },
      ]

      expect(ymCareersHandler.resolve(value, '', ymCareersHeaders)).toEqual(expected)
    })

    it('should return the whole board feed', () => {
      const value = 'https://careers.example.com/jobs/12345678/assistant-coach'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://careers.example.com/jobs?display=rss',
          hint: { key: 'ym-careers:search', label: 'Job search' },
        },
      ]

      expect(ymCareersHandler.resolve(value, '', ymCareersHeaders)).toEqual(expected)
    })

    it('should return the browse feed', () => {
      const value = 'https://careers.example.com/jobs/category/coaching-basketball'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://careers.example.com/jobs/category/coaching-basketball?display=rss',
          hint: { key: 'ym-careers:browse', label: 'Filtered jobs' },
        },
      ]

      expect(ymCareersHandler.resolve(value, '', ymCareersHeaders)).toEqual(expected)
    })
  })
})
