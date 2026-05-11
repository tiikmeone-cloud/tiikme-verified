import { Helmet } from "react-helmet-async";

const BASE_URL = "https://tiikme.com";

interface SEOProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "profile" | "article";
  twitterCard?: "summary" | "summary_large_image";
  canonical?: string;
  jsonLd?: Record<string, any>;
  noIndex?: boolean;
}

export const PageSEO = ({
  title = "Tiikme — Verified Professional Identity for India",
  description = "Build your verified professional identity. Connect with verified professionals, organizations, and opportunities across India.",
  ogTitle,
  ogDescription,
  ogImage = `${BASE_URL}/og-default.png`,
  ogType = "website",
  twitterCard = "summary",
  canonical,
  jsonLd,
  noIndex = false,
}: SEOProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {noIndex && <meta name="robots" content="noindex,nofollow" />}
    {canonical && <link rel="canonical" href={canonical} />}

    <meta property="og:title" content={ogTitle || title} />
    <meta property="og:description" content={ogDescription || description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:type" content={ogType} />
    {canonical && <meta property="og:url" content={canonical} />}
    <meta property="og:site_name" content="Tiikme" />

    <meta name="twitter:card" content={twitterCard} />
    <meta name="twitter:site" content="@tiikme" />
    <meta name="twitter:title" content={ogTitle || title} />
    <meta name="twitter:description" content={ogDescription || description} />
    <meta name="twitter:image" content={ogImage} />

    {jsonLd && (
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    )}
  </Helmet>
);

// Helper builders
export const profileSEO = (p: {
  full_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  designation?: string | null;
  institution_name?: string | null;
  location_city?: string | null;
  location_state?: string | null;
  username?: string | null;
}) => {
  const name = p.full_name || "User";
  const desc = [
    p.designation && p.institution_name ? `${name} is a ${p.designation} at ${p.institution_name}.` : "",
    "Verified professional on Tiikme.",
    p.bio ? p.bio.slice(0, 100) : "",
  ].filter(Boolean).join(" ");
  const loc = [p.location_city, p.location_state].filter(Boolean).join(", ");

  return {
    title: `${name}${p.headline ? ` - ${p.headline}` : ""} | Tiikme`,
    description: desc,
    ogTitle: `${name} | Tiikme - Verified Professional Identity`,
    ogDescription: [p.headline, loc].filter(Boolean).join(". "),
    ogImage: p.avatar_url || undefined,
    ogType: "profile" as const,
    canonical: p.username ? `${BASE_URL}/profile/${p.username}` : undefined,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Person",
      name,
      ...(p.headline && { jobTitle: p.headline }),
      ...(p.institution_name && { worksFor: { "@type": "Organization", name: p.institution_name } }),
      ...(loc && { address: { "@type": "PostalAddress", addressLocality: p.location_city, addressRegion: p.location_state } }),
      ...(p.avatar_url && { image: p.avatar_url }),
      ...(p.username && { url: `${BASE_URL}/profile/${p.username}` }),
    },
  };
};

export const orgSEO = (o: {
  name?: string;
  tagline?: string | null;
  about?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  city?: string | null;
  state?: string | null;
  page_type?: string;
  slug?: string;
  member_count?: number | null;
}) => {
  const desc = [
    o.name,
    o.page_type ? `(${o.page_type})` : "",
    o.about ? o.about.slice(0, 100) : "",
    o.member_count ? `${o.member_count} members.` : "",
    "Verified on Tiikme.",
  ].filter(Boolean).join(" ");

  return {
    title: `${o.name}${o.tagline ? ` - ${o.tagline}` : ""} | Tiikme`,
    description: desc,
    ogTitle: `${o.name} | Tiikme`,
    ogImage: o.logo_url || o.cover_url || undefined,
    canonical: o.slug ? `${BASE_URL}/p/${o.slug}` : undefined,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: o.name,
      ...(o.tagline && { description: o.tagline }),
      ...(o.logo_url && { logo: o.logo_url }),
      ...(o.slug && { url: `${BASE_URL}/p/${o.slug}` }),
      ...(o.city && { address: { "@type": "PostalAddress", addressLocality: o.city, addressRegion: o.state } }),
    },
  };
};

export const opportunitySEO = (opp: {
  title?: string;
  type?: string | null;
  company_name?: string;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  description?: string | null;
  id?: string;
}) => {
  const salary = opp.salary_min && opp.salary_max
    ? `₹${opp.salary_min.toLocaleString()} - ₹${opp.salary_max.toLocaleString()}`
    : opp.salary_min ? `From ₹${opp.salary_min.toLocaleString()}` : "";
  const desc = [
    opp.type ? `${opp.type.replace(/_/g, " ")} opportunity` : "Opportunity",
    opp.company_name ? `at ${opp.company_name}` : "",
    opp.location ? `. ${opp.location}` : "",
    salary ? `. ${salary}` : "",
    ". Apply on Tiikme.",
  ].join("");

  return {
    title: `${opp.title}${opp.company_name ? ` at ${opp.company_name}` : ""} | Tiikme Opportunities`,
    description: desc,
    canonical: opp.id ? `${BASE_URL}/app/opportunities/${opp.id}` : undefined,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: opp.title,
      ...(opp.description && { description: opp.description.slice(0, 500) }),
      ...(opp.company_name && { hiringOrganization: { "@type": "Organization", name: opp.company_name } }),
      ...(opp.location && { jobLocation: { "@type": "Place", address: opp.location } }),
      ...(opp.salary_min && { baseSalary: { "@type": "MonetaryAmount", currency: "INR", value: { "@type": "QuantitativeValue", minValue: opp.salary_min, maxValue: opp.salary_max } } }),
    },
  };
};
