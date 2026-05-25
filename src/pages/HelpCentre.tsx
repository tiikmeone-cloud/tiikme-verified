import { PageSEO } from "@/hooks/usePageSEO";

const BRAND = "#E8733A";
const BRAND_DIM = "rgba(232, 115, 58, 0.1)";

interface Article {
  title: string;
}

interface Category {
  icon: string;
  title: string;
  articles: Article[];
}

const categories: Category[] = [
  {
    icon: "✍️",
    title: "Feed & Posts",
    articles: [
      { title: "How does the tiikme Feed work?" },
      { title: "What is a Townhall post?" },
      { title: "How do hashtags work?" },
      { title: "How do I mention someone in a post?" },
    ],
  },
  {
    icon: "💬",
    title: "Circles",
    articles: [
      { title: "What are Circles?" },
      { title: "How does comment threading work?" },
      { title: "What are the different post types?" },
      { title: "How do I create a Circle?" },
    ],
  },
  {
    icon: "💼",
    title: "Jobs & Campaigns",
    articles: [
      { title: "How do I apply for a job?" },
      { title: "What is a Campaign?" },
      { title: "How do I apply to a brand campaign?" },
      { title: "How do I post a job as an org?" },
    ],
  },
  {
    icon: "✅",
    title: "Verification",
    articles: [
      { title: "How does professional verification work?" },
      { title: "How do organisations verify employees?" },
      { title: "What documents are accepted?" },
      { title: "How long does verification take?" },
    ],
  },
  {
    icon: "🤖",
    title: "Pilot AI",
    articles: [
      { title: "What can Pilot AI help me with?" },
      { title: "How do I control my Pilot AI visibility?" },
      { title: "What are the daily limits?" },
    ],
  },
  {
    icon: "🔒",
    title: "Account & Privacy",
    articles: [
      { title: "How do I change my privacy settings?" },
      { title: "How do I delete my account?" },
      { title: "What data does tiikme collect?" },
      { title: "How do I download my data?" },
    ],
  },
];

const HelpCentre = () => {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <PageSEO
        title="Help Centre | Tiikme"
        description="Find answers to common questions about tiikme — Feed, Circles, Jobs, Verification, Pilot AI, and your account."
        canonical="https://tiikme.com/help"
      />

      {/* Hero */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          padding: "56px 24px 48px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 800,
            color: "#111",
            margin: "0 0 12px",
            letterSpacing: "-0.5px",
          }}
        >
          Help Centre
        </h1>
        <p style={{ fontSize: "17px", color: "#555", margin: "0 0 32px", lineHeight: 1.5 }}>
          Find answers to common questions about tiikme.
        </p>

        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            maxWidth: "480px",
            margin: "0 auto",
            background: "#f5f5f5",
            border: "1.5px solid #e8e8e8",
            borderRadius: "12px",
            padding: "0 16px",
            gap: "10px",
            transition: "border-color 0.2s",
          }}
        >
          <span style={{ fontSize: "18px", color: "#aaa", flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Search help articles…"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              padding: "14px 0",
              fontSize: "15px",
              color: "#333",
              outline: "none",
            }}
            readOnly
          />
        </div>
      </div>

      {/* Category grid */}
      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "48px 24px 64px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.title}
              style={{
                background: "#fff",
                border: "1.5px solid #ebebeb",
                borderRadius: "16px",
                padding: "24px",
                transition: "box-shadow 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = BRAND;
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(232,115,58,0.10)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#ebebeb";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: BRAND_DIM,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  {cat.icon}
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#111",
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {cat.title}
                  </h2>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      margin: "2px 0 0",
                    }}
                  >
                    {cat.articles.length} article{cat.articles.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Article list */}
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {cat.articles.map((article, idx) => (
                  <li
                    key={idx}
                    style={{
                      borderTop: idx === 0 ? "none" : "1px solid #f3f3f3",
                      padding: idx === 0 ? "0 0 8px" : "8px 0",
                    }}
                  >
                    <a
                      href="#"
                      style={{
                        fontSize: "13.5px",
                        color: "#444",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        lineHeight: 1.45,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = BRAND;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "#444";
                      }}
                    >
                      <span style={{ color: "#ccc", fontSize: "11px", flexShrink: 0 }}>›</span>
                      {article.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            marginTop: "48px",
            fontSize: "14px",
            color: "#aaa",
          }}
        >
          Can't find what you're looking for?{" "}
          <a
            href="mailto:support@tiikme.com"
            style={{ color: BRAND, textDecoration: "none", fontWeight: 600 }}
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
};

export default HelpCentre;
