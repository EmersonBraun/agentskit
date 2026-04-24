import { blog as blogEntries } from '@/.source/server'

export type BlogEntry = (typeof blogEntries)[number]

export function allBlogPosts() {
  return [...blogEntries].sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function findBlogPost(slug: string): BlogEntry | undefined {
  return blogEntries.find((e) => slugOf(e) === slug)
}

export function slugOf(entry: BlogEntry): string {
  const info = (entry as unknown as { info?: { path?: string } }).info
  const path = info?.path ?? ''
  return path.replace(/\.(mdx|md)$/, '').replace(/\\/g, '/').split('/').pop() ?? ''
}

export function slugsOfAll(): string[] {
  return blogEntries.map((e) => slugOf(e)).filter(Boolean)
}
