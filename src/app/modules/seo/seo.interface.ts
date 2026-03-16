export interface ISeoFilterRequest {
  searchTerm?: string;
  pageSlug?: string;
  isActive?: boolean;
}

export interface ISeoCreateInput {
  pageSlug: string;
  pageName: string;
  metaTitle: string;
  metaDescription: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  isActive?: boolean;
}

export interface ISeoUpdateInput {
  pageName?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  isActive?: boolean;
}
