---
title: Feedscout — Advanced Feed Autodiscovery for JavaScript
---

# Feedscout

Advanced feed autodiscovery for JavaScript. Collect feed information from any webpage using multiple discovery methods.

Finds feeds by scanning links and anchors in HTML content, parsing HTTP headers, and guessing common paths, then validates each URL by fetching and parsing the feed.

## Features

### Supported Content

| Type | Description |
| --- | --- |
| Feeds | RSS, Atom, JSON Feed, and RDF. Each feed is validated and returns metadata like format, title, description, and site URL. |
| Blogrolls | OPML files containing feed subscriptions. Validated and returns title. |
| WebSub&nbsp;hubs | Find hubs for real-time feed update notifications. |

### Discovery Methods

| Method | Description |
| --- | --- |
| Platform | Generates feed URLs for YouTube, GitHub, WordPress, and 30+ other popular platforms using URL pattern matching. |
| HTML | Scans `<link>` elements with feed MIME types and `<a>` elements matching feed patterns or labels like "RSS", "Subscribe". |
| Headers | Parses HTTP `Link` headers for `rel="alternate"` with feed MIME types per RFC 8288. |
| Guess | Tests common paths (e.g. `/feed`, `/rss.xml`, `/atom.xml`) against the base URL as a fallback. |

### Customization

Uses native fetch by default but supports custom adapters for Axios, Got, Ky, or any other HTTP client. Discovery methods can be individually enabled or disabled and their options adjusted. Custom extractors let you override the default parser to pull additional metadata from feeds and blogrolls.