import type { MetadataRoute } from "next";

/**
 * Vibeify is a private workspace, not a discoverable site. Disallow indexing
 * across the board until the product is public.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
