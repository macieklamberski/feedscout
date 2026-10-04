import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { haleyJobsHandler, isHaleyJobsHeaders, isHaleyJobsHtml } from './haleyJobs.js'

const boardHtml = '<a href="/index.smpl?arg=jb_search">Search Jobs</a>'
const resourceCenterHtml = `
  <a
    class="elementor-item elementor-item-anchor"
    href="https://resources.example.com/index.smpl?arg=rcmain&rcid=1263"
  >Resources</a>
`
const haleyHeaders = new Headers({ 'x-sasnode': 'v166-alma.haleymarketing.com' })

describe('isHaleyJobsHtml', () => {
  it('should return false for the route on an element other than a link', () => {
    expect(isHaleyJobsHtml('<link rel="preload" href="/index.smpl?arg=jb_search">')).toBe(false)
  })

  it('should return true for a link to a job board route', () => {
    expect(isHaleyJobsHtml(boardHtml)).toBe(true)
  })

  it('should return false for a resource center page', () => {
    expect(isHaleyJobsHtml(resourceCenterHtml)).toBe(false)
  })

  it('should return false for a link to a job board on another host', () => {
    const value = '<a href="https://jobs.example.com/index.smpl?arg=jb_search">Jobs</a>'

    expect(isHaleyJobsHtml(value)).toBe(false)
  })

  it('should return false for the route in text', () => {
    expect(isHaleyJobsHtml('<p>/index.smpl?arg=jb_search</p>')).toBe(false)
  })
})

describe('isHaleyJobsHeaders', () => {
  it('should return false for a node that only contains the domain', () => {
    const value = new Headers({ 'x-sasnode': 'haleymarketing.com.example.net' })

    expect(isHaleyJobsHeaders(value)).toBe(false)
  })

  it('should return true for a Haley Marketing node', () => {
    expect(isHaleyJobsHeaders(haleyHeaders)).toBe(true)
  })

  it('should return false for a node on another domain', () => {
    const value = new Headers({ 'x-sasnode': 'node1.example.com' })

    expect(isHaleyJobsHeaders(value)).toBe(false)
  })

  it('should return false without the header', () => {
    expect(isHaleyJobsHeaders(new Headers())).toBe(false)
  })
})

describe('haleyJobsHandler', () => {
  describe('match', () => {
    it('should match a job board page', () => {
      expect(haleyJobsHandler.match('https://jobs.example.com/', boardHtml, haleyHeaders)).toBe(
        true,
      )
    })

    it('should not match a job board page without headers', () => {
      expect(haleyJobsHandler.match('https://jobs.example.com/', boardHtml)).toBe(false)
    })

    it('should not match a resource center page', () => {
      const value = 'https://resources.example.com/'

      expect(haleyJobsHandler.match(value, resourceCenterHtml, haleyHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the board feed for a job page', () => {
      const value = 'https://jobs.example.com/jb/Parts-Detailer-Jobs-in-Brownwood-Texas/14343371'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://jobs.example.com/rss/rss.smpl?ff=1',
          hint: { key: 'haley-jobs:jobs', label: 'Jobs' },
        },
      ]

      expect(haleyJobsHandler.resolve(value)).toEqual(expected)
    })
  })
})
