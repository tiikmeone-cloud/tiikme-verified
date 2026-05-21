import { Link } from "react-router-dom";
import { cleanUsername } from "@/lib/cleanUsername";

/**
 * Renders post content with:
 * - @mentions as bold orange clickable links (with cleaned usernames)
 * - URLs as blue clickable links
 * - #hashtags as bold orange text
 */

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;
const MENTION_REGEX = /(@[\w][\w.-]*)/g;
const HASHTAG_REGEX = /(#\w+)/g;

// Combined regex to split by URLs, mentions, and hashtags
const COMBINED_REGEX = /(https?:\/\/[^\s<]+|@[\w][\w.-]*|#\w+)/g;

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

        // @mention — display cleaned username, link with full username
        if (MENTION_REGEX.test(part)) {
          MENTION_REGEX.lastIndex = 0;
          const rawUsername = part.slice(1);
          const displayUsername = cleanUsername(rawUsername);
          return (
            <Link
              key={i}
              to={`/app/profile/${rawUsername}`}
              className="font-semibold hover:underline"
              style={{ color: "var(--color-accent)" }}
            >
              @{displayUsername}
            </Link>
          );
        }

        // #hashtag — clickable, navigates to /tag/:tag
        if (HASHTAG_REGEX.test(part)) {
          HASHTAG_REGEX.lastIndex = 0;
          const tag = part.slice(1);
          return (
            <Link
              key={i}
              to={`/tag/${tag}`}
              className="font-semibold hover:underline"
              style={{ color: "var(--color-accent)" }}
              onClick={e => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }

        // Regular text
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default MentionText;
