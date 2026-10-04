import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type BubblelifeUrl, bubblelifeHandler, parseBubblelifeUrl } from './bubblelife.js'

describe('parseBubblelifeUrl', () => {
  it('should return the community for a community page', () => {
    const expected: BubblelifeUrl = { kind: 'community', community: 'idealplotter' }

    expect(
      parseBubblelifeUrl('https://sandysprings.bubblelife.com/community/idealplotter'),
    ).toEqual(expected)
  })

  it('should return the community for a page under the community', () => {
    const expected: BubblelifeUrl = { kind: 'community', community: 'idealplotter' }

    expect(
      parseBubblelifeUrl('https://sandysprings.bubblelife.com/community/idealplotter/type/rssinfo'),
    ).toEqual(expected)
  })

  it('should keep the case of the community name', () => {
    const expected: BubblelifeUrl = { kind: 'community', community: 'IdealPlotter' }

    expect(
      parseBubblelifeUrl('https://sandysprings.bubblelife.com/Community/IdealPlotter'),
    ).toEqual(expected)
  })

  it('should return the library for a library page', () => {
    const expected: BubblelifeUrl = {
      kind: 'library',
      community: 'denver_ireporter',
      libraryId: '35828711',
    }

    expect(
      parseBubblelifeUrl(
        'https://denver.bubblelife.com/community/denver_ireporter/library/35828711',
      ),
    ).toEqual(expected)
  })

  it('should return the library for a post page', () => {
    const value =
      'https://denver.bubblelife.com/community/denver_ireporter/library/35828711/key/350370744/Colorados_Small_Business_Boom_Trends_and_Talent_Strategies_for_the_Future'
    const expected: BubblelifeUrl = {
      kind: 'library',
      community: 'denver_ireporter',
      libraryId: '35828711',
    }

    expect(parseBubblelifeUrl(value)).toEqual(expected)
  })

  it('should return undefined for a city home page', () => {
    expect(parseBubblelifeUrl('https://coppell.bubblelife.com/')).toBeUndefined()
  })

  it('should return undefined for a path sharing the community prefix', () => {
    expect(
      parseBubblelifeUrl('https://coppell.bubblelife.com/communitys/hall_law_pc_56'),
    ).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseBubblelifeUrl('https://bubblelife.com/community/idealplotter')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBubblelifeUrl('https://example.com/community/idealplotter')).toBeUndefined()
  })
})

describe('bubblelifeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://coppell.bubblelife.com/community/hall_law_pc_56'],
      [false, 'https://coppell.bubblelife.com/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(bubblelifeHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return the posts feed from the community library link', () => {
      const value = 'https://sandysprings.bubblelife.com/community/idealplotter'
      const content = `
        <link id="ctl00_linkRSS" rel="alternate" type="application/rss+xml" />
        <a href="/community/idealplotter/library/3569381092" title="News" class="blMobileItem">
        <a href="/community/idealplotter/library/3569381003" title="Calendar" class="blMobileItem">
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sandysprings.bubblelife.com/rss?c=3569381092',
          hint: { key: 'bubblelife:posts', label: 'Posts' },
        },
      ]

      expect(bubblelifeHandler.resolve(value, content)).toEqual(expected)
    })

    it('should skip library links of another community', () => {
      const value = 'https://denver.bubblelife.com/community/denver_ireporter'
      const content = `
        <a id="ctl00_phCenterColumn_ctl00_rptCalendar_ctl01_hlEvent" href="/community/plano_calendar/library/35660934/key/3516400732/Oasis_Church_Harvest_Conference_2026_DOMINION">
        <a id="ctl00_phCenterColumn_ctl00_rptObjectList_ctl00_ctrlObjectDisplay1_hlSubject" class="PostSubject" href="/community/denver_ireporter/library/35828711/key/352529141/Denver_Dental_Team_Completes_2000_Procedures_During_Week-long_Medical_Mission_Trip_to_Kenya">
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://denver.bubblelife.com/rss?c=35828711',
          hint: { key: 'bubblelife:posts', label: 'Posts' },
        },
      ]

      expect(bubblelifeHandler.resolve(value, content)).toEqual(expected)
    })

    it('should match the community name ignoring case', () => {
      const value = 'https://sandysprings.bubblelife.com/community/IdealPlotter'
      const content =
        '<a href="/community/idealplotter/library/3569381092" title="News" class="blMobileItem">'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sandysprings.bubblelife.com/rss?c=3569381092',
          hint: { key: 'bubblelife:posts', label: 'Posts' },
        },
      ]

      expect(bubblelifeHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array for a community that links no library of its own', () => {
      const value = 'https://plano.bubblelife.com/community/plano_news'
      const content = `
        <a id="ctl00_phCenterColumn_ctl00_rptCalendar_ctl01_hlEvent" href="/community/plano_calendar/library/35660934/key/3516400732/Oasis_Church_Harvest_Conference_2026_DOMINION">
        <a id="ctl00_CtrlPageFooter1_hlRSS" title="RSS" href="/community/plano_news/type/rssinfo">
      `

      expect(bubblelifeHandler.resolve(value, content)).toEqual([])
    })

    it('should return empty array without content', () => {
      const value = 'https://sandysprings.bubblelife.com/community/idealplotter'

      expect(bubblelifeHandler.resolve(value)).toEqual([])
    })

    it('should return the library feed named by the footer RSS link', () => {
      const value = 'https://denver.bubblelife.com/community/denver_ireporter/library/35828711'
      const content = `
        <a href="/community/denver_ireporter/library/35577212" title="News" class="blMobileItem">
        <a id="ctl00_CtrlPageFooter1_hlRSS" title="RSS" href="/community/denver_ireporter/library/35828711/type/rssinfo">
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://denver.bubblelife.com/rss?c=35828711',
          hint: { key: 'bubblelife:library', label: 'Library' },
        },
      ]

      expect(bubblelifeHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the posts feed for a library id the footer does not name', () => {
      const value = 'https://sandysprings.bubblelife.com/community/idealplotter/library/1'
      const content = `
        <a href="/community/idealplotter/library/3569381092" title="News" class="blMobileItem">
        <a id="ctl00_CtrlPageFooter1_hlRSS" title="RSS" href="/community/idealplotter/type/rssinfo">
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://sandysprings.bubblelife.com/rss?c=3569381092',
          hint: { key: 'bubblelife:posts', label: 'Posts' },
        },
      ]

      expect(bubblelifeHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
