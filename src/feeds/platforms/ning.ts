import { ning } from 'feedintel'
import { isPresent, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: topic.
// Handler needed for: activity, blog, blog-featured, events, forum, forum-featured, groups, groups-featured, members, members-featured, photos, photos-featured, videos, videos-featured.

export type NingUrl =
  | { kind: 'topic'; topic: string; group?: string }
  | { kind: 'group'; group: string }
  | { kind: 'home' }

const topicRegex = /^\/forum\/topics\/([^/]+)\/?$/i
const groupTopicRegex = /^\/group\/(?<group>[^/]+)\/forum\/topics\/(?<topic>[^/]+)\/?$/i
const groupRegex = /^\/group\/([^/]+)/i

const feeds = withHintLabels(ning.feeds)

// Ning 3 networks send the same `ning_session` cookie and `x-xn-trace-token` header but serve
// none of these feeds, and only the classic networks load assets from this path.
export const isNingHtml = (content: string): boolean => {
  return content.includes('static.ning.com/socialnetworkmain/')
}

export const parseNingUrl = (url: string): NingUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
  const topic = pathname.match(topicRegex)?.[1]

  if (topic) {
    return { kind: 'topic', topic }
  }

  const groupTopic = pathname.match(groupTopicRegex)?.groups

  if (groupTopic?.group && groupTopic.topic) {
    return { kind: 'topic', topic: groupTopic.topic, group: groupTopic.group }
  }

  const group = pathname.match(groupRegex)?.[1]

  if (group) {
    return { kind: 'group', group }
  }

  return { kind: 'home' }
}

export const ningHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isNingHtml })) {
      return false
    }

    return parseNingUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNingUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // The featured posts and topics and the member, photo, video, event, group, page and notes
    // lists need no value from the page, so every page builds them after its own feeds.
    if (parsed.kind === 'topic') {
      return [
        page.getFeedEntry('topic', { topic: parsed.topic, group: parsed.group }),
        page.getFeedEntry('forum-group', { group: parsed.group }),
        page.getFeedEntry('activity'),
        page.getFeedEntry('blog'),
        page.getFeedEntry('blog-featured'),
        page.getFeedEntry('forum'),
        page.getFeedEntry('forum-featured'),
        page.getFeedEntry('members'),
        page.getFeedEntry('members-featured'),
        page.getFeedEntry('photos'),
        page.getFeedEntry('photos-featured'),
        page.getFeedEntry('videos'),
        page.getFeedEntry('videos-featured'),
        page.getFeedEntry('events'),
        page.getFeedEntry('groups'),
        page.getFeedEntry('groups-featured'),
        page.getFeedEntry('pages'),
        page.getFeedEntry('notes'),
      ].filter(isPresent)
    }

    if (parsed.kind === 'group') {
      return [
        page.getFeedEntry('forum-group', { group: parsed.group }),
        page.getFeedEntry('activity'),
        page.getFeedEntry('blog'),
        page.getFeedEntry('blog-featured'),
        page.getFeedEntry('forum'),
        page.getFeedEntry('forum-featured'),
        page.getFeedEntry('members'),
        page.getFeedEntry('members-featured'),
        page.getFeedEntry('photos'),
        page.getFeedEntry('photos-featured'),
        page.getFeedEntry('videos'),
        page.getFeedEntry('videos-featured'),
        page.getFeedEntry('events'),
        page.getFeedEntry('groups'),
        page.getFeedEntry('groups-featured'),
        page.getFeedEntry('pages'),
        page.getFeedEntry('notes'),
      ]
    }

    return [
      page.getFeedEntry('activity'),
      page.getFeedEntry('blog'),
      page.getFeedEntry('blog-featured'),
      page.getFeedEntry('forum'),
      page.getFeedEntry('forum-featured'),
      page.getFeedEntry('members'),
      page.getFeedEntry('members-featured'),
      page.getFeedEntry('photos'),
      page.getFeedEntry('photos-featured'),
      page.getFeedEntry('videos'),
      page.getFeedEntry('videos-featured'),
      page.getFeedEntry('events'),
      page.getFeedEntry('groups'),
      page.getFeedEntry('groups-featured'),
      page.getFeedEntry('pages'),
      page.getFeedEntry('notes'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
