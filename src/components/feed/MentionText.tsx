import { Link } from "react-router-dom";

/**
 * Renders post content with:
 * - @mentions as bold orange clickable links
 * - URLs as blue clickable links
 * - #hashtags as bold orange text
 */

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;
const MENTION_REGEX = /(@\w[\w.]*)/g;
const HASHTAG_REGEX = /(#\w+)/g;

// Combined regex to split by URLs, mentions, and hashtags
const COMBINED_REGEX = /(https?:\/\/[^\s<]+|@\w[\w.]*|#\w+)/g;

const MentionText = ({ text }: { text: string }) => {
  if (!text) return null;

  const parts = text.split(COMBINED_REGEX);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // URL
        if (URL_REGEX.test(part)) {
          URL_REGEX.lastIndex = 0;
          // Clean trailing punctuation
          let url = part;
          let trailing = "";
          const trailingMatch = url.match(/[.,;:!?)]+$/);
          if (trailingMatch) {
            trailing = trailingMatch[0];
            url = url.slice(0, -trailing.length);
          }
          return (
            <span key={i}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: "#4A90D9" }}
              >
                {url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}
                {url.replace(/^https?:\/\/(www\.)?/, "").length > 40 ? "..." : ""}
              </a>
              {trailing}
            </span>
          );
        }

        // @mention
        if (MENTION_REGEX.test(part)) {
          MENTION_REGEX.lastIndex = 0;
          const username = part.slice(1);
          return (
            <Link
              key={i}
              to={`/app/profile/${username}`}
              className="font-semibold hover:underline"
              style={{ color: "var(--color-accent)" }}
            >
              {part}
            </Link>
          );
        }

        // #hashtag
        if (HASHTAG_REGEX.test(part)) {
          HASHTAG_REGEX.lastIndex = 0;
          return (
            <span
              key={i}
              className="font-semibold cursor-default"
              style={{ color: "var(--color-accent)" }}
            >
              {part}
            </span>
          );
        }

        // Regular text
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default MentionText;
