import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  getWildApricotPage,
  isWildApricotHeaders,
  type WildApricotPage,
  wildApricotHandler,
} from './wildApricot.js'

const wildApricotHeaders = new Headers({
  'x-backend-server': 'lwf2wue1d-f9fb',
  'x-lb-server': 'ip-10-11-40-147.wa.local',
})
const blogHtml = `
  <a
    href="https://example.com/news/RSS"
    id="FunctionalBlock1_ctl00_blogPostList_rssLink"
    class="rssFeedLabel"
  >RSS</a>
`
const postHtml = `
  <link
    href="https://example.com/page-18010/RSS"
    rel="alternate"
    type="application/rss+xml"
  />
  <a
    id="FunctionalBlock1_ctl00_blogPostView_title_backLink"
    href="https://example.com/news"
  >Back to list</a>
`
const eventsListHtml = `
  <a
    href="https://example.com/Events/RSS"
    id="FunctionalBlock1_ctl00_eventPageViewBase_ctl00_ctl00_eventListViewSwitcher_genericPageHeader_rssLink"
    class="rssFeedLabel"
  >RSS</a>
  <a
    id="FunctionalBlock1_ctl00_eventPageViewBase_ctl00_ctl00_eventListViewSwitcher_calendarModeLink"
    class="calendarModeLink"
    href="https://example.com/Events?EventViewMode=1&amp;EventListViewMode=2"
  >Calendar</a>
`
const eventsCalendarHtml = `
  <a
    id="FunctionalBlock1_ctl00_eventPageViewBase_ctl00_ctl00_eventListViewSwitcher_listModeLink"
    class="listModeLink"
    href="https://example.com/Events?EventViewMode=1&amp;EventListViewMode=1"
  >List</a>
`
const blogFeeds: Array<DiscoverUriEntry> = [
  { uri: 'https://example.com/news/RSS', hint: { key: 'wild-apricot:blog', label: 'Blog' } },
]
const eventsFeeds: Array<DiscoverUriEntry> = [
  { uri: 'https://example.com/Events/RSS', hint: { key: 'wild-apricot:events', label: 'Events' } },
]

describe('isWildApricotHeaders', () => {
  it('should return true for the load balancer header', () => {
    expect(isWildApricotHeaders(wildApricotHeaders)).toBe(true)
  })

  it('should return false for a load balancer outside Wild Apricot', () => {
    const headers = new Headers({ 'x-lb-server': 'lb-01.example.com' })

    expect(isWildApricotHeaders(headers)).toBe(false)
  })

  it('should return false without the header', () => {
    expect(isWildApricotHeaders(new Headers())).toBe(false)
  })
})

describe('getWildApricotPage', () => {
  it('should return the feed of a blog page', () => {
    const expected: WildApricotPage = { kind: 'blog', feedUrl: 'https://example.com/news/RSS' }

    expect(getWildApricotPage('https://example.com/news/', blogHtml)).toEqual(expected)
  })

  it('should return the blog of a post page', () => {
    const expected: WildApricotPage = { kind: 'post', blogUrl: 'https://example.com/news' }

    expect(getWildApricotPage('https://example.com/news/12345678', postHtml)).toEqual(expected)
  })

  it('should drop the trailing slash of the back link', () => {
    const value = `
      <a
        id="FunctionalBlock1_ctl00_blogPostView_title_backLink"
        href="/news/"
      >Back to list</a>
    `
    const expected: WildApricotPage = { kind: 'post', blogUrl: 'https://example.com/news' }

    expect(getWildApricotPage('https://example.com/news/12345678', value)).toEqual(expected)
  })

  it('should return the events page in the list view', () => {
    const expected: WildApricotPage = { kind: 'events', eventsUrl: 'https://example.com/Events' }

    expect(getWildApricotPage('https://example.com/events', eventsListHtml)).toEqual(expected)
  })

  it('should return the events page in the calendar view', () => {
    const expected: WildApricotPage = { kind: 'events', eventsUrl: 'https://example.com/Events' }

    expect(getWildApricotPage('https://example.com/Events/', eventsCalendarHtml)).toEqual(expected)
  })

  it('should return undefined for a page without a blog or events module', () => {
    const value = '<a href="https://example.com/Events" title="Events">Events</a>'

    expect(getWildApricotPage('https://example.com/', value)).toBeUndefined()
  })

  it('should return undefined without content', () => {
    expect(getWildApricotPage('https://example.com/', undefined)).toBeUndefined()
  })
})

describe('wildApricotHandler', () => {
  describe('match', () => {
    it('should match a Wild Apricot blog page', () => {
      const value = 'https://example.com/news/'

      expect(wildApricotHandler.match(value, blogHtml, wildApricotHeaders)).toBe(true)
    })

    it('should not match a Wild Apricot page without a module', () => {
      const value = 'https://example.com/'

      expect(wildApricotHandler.match(value, '<html></html>', wildApricotHeaders)).toBe(false)
    })

    it('should not match the same markup without the header', () => {
      expect(wildApricotHandler.match('https://example.com/news/', blogHtml, new Headers())).toBe(
        false,
      )
    })
  })

  describe('resolve', () => {
    it('should return the blog feed on a blog page', () => {
      expect(wildApricotHandler.resolve('https://example.com/news/', blogHtml)).toEqual(blogFeeds)
    })

    it('should return the blog feed on a post page', () => {
      const value = 'https://example.com/news/12345678'

      expect(wildApricotHandler.resolve(value, postHtml)).toEqual(blogFeeds)
    })

    it('should return the events feed on an events page', () => {
      const value = 'https://example.com/events'

      expect(wildApricotHandler.resolve(value, eventsListHtml)).toEqual(eventsFeeds)
    })

    it('should return empty array without content', () => {
      expect(wildApricotHandler.resolve('https://example.com/news/')).toEqual([])
    })
  })
})
