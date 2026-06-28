import { mockBlogPosts, mockCategories, mockProjects, mockSiteSettings } from './mockData';
import { fetchGitHubReadmeFromRepo, fetchMarkdownFromUrl } from './contentImport';
import { fetchPayload, makePayloadAssetUrl } from './payload';
import type { BlogPost, Category, ContentSource, Project, SiteSettings } from '../types/content';

type PayloadListResponse<T> = {
  docs: T[];
};

type PayloadMedia = {
  id?: string;
  url?: string | null;
  alt?: string | null;
} | string | null;

type PayloadCategory = {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
};

type PayloadBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  content_source?: ContentSource | null;
  source_url?: string | null;
  cover_image?: PayloadMedia;
  status?: 'draft' | 'published';
  is_featured?: boolean | null;
  sort_order?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  published_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
  categories?: Array<PayloadCategory | string> | null;
};

type PayloadProject = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  content?: string | null;
  content_source?: ContentSource | null;
  source_url?: string | null;
  image?: PayloadMedia;
  demo_url?: string | null;
  repo_url?: string | null;
  status?: 'draft' | 'published';
  is_featured?: boolean | null;
  sort_order?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  categories?: Array<PayloadCategory | string> | null;
};

type PayloadSiteSettings = Partial<SiteSettings> & {
  id?: string;
  updatedAt?: string;
};

function dateOrNow(value?: string | null) {
  return value || new Date().toISOString();
}

function mapCategory(row: PayloadCategory): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    created_at: dateOrNow(row.createdAt),
    updated_at: dateOrNow(row.updatedAt),
  };
}

function mapCategories(rows?: Array<PayloadCategory | string> | null): Category[] | undefined {
  const mapped = (rows || [])
    .filter((item): item is PayloadCategory => typeof item === 'object' && Boolean(item?.id))
    .map(mapCategory);

  return mapped.length > 0 ? mapped : undefined;
}

function mapMediaUrl(value: PayloadMedia): string | null {
  if (!value) return null;
  if (typeof value === 'string') return null;
  return makePayloadAssetUrl(value.url || null);
}

function compareFeaturedSortDate<T extends { is_featured: boolean; sort_order: number; published_at?: string | null; updated_at?: string }>(a: T, b: T) {
  if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  const aDate = new Date(a.published_at || a.updated_at || 0).getTime();
  const bDate = new Date(b.published_at || b.updated_at || 0).getTime();
  return bDate - aDate;
}

function mapBlog(row: PayloadBlogPost): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? null,
    content: row.content ?? '',
    content_source: row.content_source ?? 'manual',
    source_url: row.source_url ?? null,
    cover_image: mapMediaUrl(row.cover_image ?? null),
    status: row.status ?? 'draft',
    is_featured: row.is_featured ?? false,
    sort_order: row.sort_order ?? 100,
    meta_title: row.meta_title ?? null,
    meta_description: row.meta_description ?? null,
    canonical_url: row.canonical_url ?? null,
    published_at: row.published_at ?? null,
    created_at: dateOrNow(row.createdAt),
    updated_at: dateOrNow(row.updatedAt),
    categories: mapCategories(row.categories),
  };
}

function mapProject(row: PayloadProject): Project {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary ?? null,
    content: row.content ?? '',
    content_source: row.content_source ?? 'manual',
    source_url: row.source_url ?? null,
    image_url: mapMediaUrl(row.image ?? null),
    demo_url: row.demo_url ?? null,
    repo_url: row.repo_url ?? null,
    status: row.status ?? 'draft',
    is_featured: row.is_featured ?? false,
    sort_order: row.sort_order ?? 100,
    meta_title: row.meta_title ?? null,
    meta_description: row.meta_description ?? null,
    created_at: dateOrNow(row.createdAt),
    updated_at: dateOrNow(row.updatedAt),
    categories: mapCategories(row.categories),
  };
}

async function resolveBlogContent(post: BlogPost): Promise<BlogPost> {
  return post;
}

async function resolveProjectContent(project: Project): Promise<Project> {
  const sourceUrl = project.source_url || project.repo_url;
  if (!sourceUrl) return project;

  try {
    if (project.content_source === 'github_readme' || (project.content.trim().length === 0 && project.repo_url)) {
      const imported = await fetchGitHubReadmeFromRepo(sourceUrl);
      return {
        ...project,
        content: imported.content,
        source_url: imported.sourceUrl,
        content_source: 'github_readme',
        summary: project.summary || imported.description || project.summary,
        image_url: project.image_url || imported.imageUrl || null,
        repo_url: project.repo_url || imported.repoUrl || null,
        demo_url: project.demo_url || imported.demoUrl || null,
      };
    }

    if (project.content_source === 'markdown_url') {
      const imported = await fetchMarkdownFromUrl(sourceUrl);
      return {
        ...project,
        content: imported.content,
        summary: project.summary || imported.description || project.summary,
        image_url: project.image_url || imported.imageUrl || null,
        repo_url: project.repo_url || imported.repoUrl || null,
        demo_url: project.demo_url || imported.demoUrl || null,
      };
    }
  } catch (error) {
    console.warn('Using stored project content because stateless import failed:', error instanceof Error ? error.message : error);
  }

  return project;
}

export async function getSiteSettings() {
  try {
    const data = await fetchPayload<PayloadSiteSettings>('/api/globals/site-settings');
    return {
      id: data.id || 'site-settings',
      site_name: data.site_name || mockSiteSettings.site_name,
      hero_badge: data.hero_badge || mockSiteSettings.hero_badge,
      hero_title: data.hero_title || mockSiteSettings.hero_title,
      hero_description: data.hero_description || mockSiteSettings.hero_description,
      primary_cta_label: data.primary_cta_label || mockSiteSettings.primary_cta_label,
      primary_cta_href: data.primary_cta_href || mockSiteSettings.primary_cta_href,
      secondary_cta_label: data.secondary_cta_label || mockSiteSettings.secondary_cta_label,
      secondary_cta_href: data.secondary_cta_href || mockSiteSettings.secondary_cta_href,
      updated_at: data.updated_at || data.updatedAt || mockSiteSettings.updated_at,
    } satisfies SiteSettings;
  } catch (error) {
    console.warn('Using mock site settings because Payload returned:', error instanceof Error ? error.message : error);
    return mockSiteSettings;
  }
}

export async function getPublishedBlogPosts() {
  try {
    const data = await fetchPayload<PayloadListResponse<PayloadBlogPost>>('/api/blog-posts?depth=2&limit=100&where[status][equals]=published');
    return data.docs.map(mapBlog).sort(compareFeaturedSortDate);
  } catch (error) {
    console.warn('Using mock blog posts because Payload returned:', error instanceof Error ? error.message : error);
    return mockBlogPosts;
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    const data = await fetchPayload<PayloadListResponse<PayloadBlogPost>>(`/api/blog-posts?depth=2&limit=1&where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published`);
    const post = data.docs[0] ? mapBlog(data.docs[0]) : null;
    return post ? resolveBlogContent(post) : mockBlogPosts.find((item) => item.slug === slug) ?? null;
  } catch (error) {
    console.warn('Using mock blog post because Payload returned:', error instanceof Error ? error.message : error);
    return mockBlogPosts.find((post) => post.slug === slug) ?? null;
  }
}

export async function getPublishedProjects() {
  try {
    const data = await fetchPayload<PayloadListResponse<PayloadProject>>('/api/projects?depth=2&limit=100&where[status][equals]=published');
    return data.docs.map(mapProject).sort(compareFeaturedSortDate);
  } catch (error) {
    console.warn('Using mock projects because Payload returned:', error instanceof Error ? error.message : error);
    return mockProjects;
  }
}

export async function getProjectBySlug(slug: string) {
  try {
    const data = await fetchPayload<PayloadListResponse<PayloadProject>>(`/api/projects?depth=2&limit=1&where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published`);
    const project = data.docs[0] ? mapProject(data.docs[0]) : null;
    return project ? resolveProjectContent(project) : mockProjects.find((item) => item.slug === slug) ?? null;
  } catch (error) {
    console.warn('Using mock project because Payload returned:', error instanceof Error ? error.message : error);
    return mockProjects.find((project) => project.slug === slug) ?? null;
  }
}

export async function getCategories() {
  try {
    const data = await fetchPayload<PayloadListResponse<PayloadCategory>>('/api/categories?depth=0&limit=100&sort=name');
    return data.docs.map(mapCategory);
  } catch (error) {
    console.warn('Using mock categories because Payload returned:', error instanceof Error ? error.message : error);
    return mockCategories;
  }
}
