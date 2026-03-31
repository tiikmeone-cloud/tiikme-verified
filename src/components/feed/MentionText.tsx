import { Link } from "react-router-dom";

const MentionText = ({ text }: { text: string }) => {
  const parts = text.split(/(@\w+)/g);

  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <Link
            key={i}
            to="/app/profile"
            className="font-semibold text-brand hover:underline"
          >
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export default MentionText;
