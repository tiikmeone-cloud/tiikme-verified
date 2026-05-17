import type { GuideMeta } from "./GuideLayout";

export const GUIDES: GuideMeta[] = [
  {
    slug: "profile-summary-for-resume",
    title: "How to Write a Profile Summary for a Resume",
    h1: "How to write a profile summary for your resume",
    description:
      "A 3-line profile summary is the first thing recruiters read. Here is how to write one that gets the rest of your resume actually opened.",
    keyword: "profile summary for resume",
    readTime: "6 min read",
    category: "Resume writing",
  },
  {
    slug: "resume-summary-examples",
    title: "Resume Summary Examples — Real Templates That Work",
    h1: "Resume summary examples for every kind of professional",
    description:
      "Twelve real resume summary examples — for freshers, software engineers, teachers, nurses, designers and managers. Copy, edit, send.",
    keyword: "resume summary examples",
    readTime: "8 min read",
    category: "Examples",
  },
  {
    slug: "profile-summary-for-freshers",
    title: "Profile Summary for Freshers — With Examples",
    h1: "Profile summary for freshers (with examples)",
    description:
      "No work experience yet? Your profile summary still has a job to do. Here is how freshers write one that does not sound like everyone else.",
    keyword: "profile summary for freshers",
    readTime: "5 min read",
    category: "For freshers",
  },
  {
    slug: "professional-headline-examples",
    title: "Professional Headline Examples for Your Profile",
    h1: "Professional headline examples that get noticed",
    description:
      "Your headline is 220 characters of real estate. Most people waste it. Here is how to write one that says what you actually do.",
    keyword: "professional headline examples",
    readTime: "5 min read",
    category: "Headlines",
  },
  {
    slug: "professional-profile-picture",
    title: "How to Take a Professional Profile Picture",
    h1: "How to take a professional profile picture",
    description:
      "You do not need a studio or a suit. You need light, a clean background and a phone. Here is the full checklist.",
    keyword: "professional profile picture",
    readTime: "4 min read",
    category: "Profile picture",
  },
];

export const getRelated = (slug: string, n = 3) =>
  GUIDES.filter((g) => g.slug !== slug)
    .slice(0, n)
    .map((g) => ({ slug: g.slug, title: g.h1 }));
