import { useEffect, useState } from "react";
import type { Heading } from "../lib/content";

/** "On this page" with scroll-spy. */
export function Toc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (!headings.length) return;
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;
  return (
    <nav className="toc" aria-label="On this page">
      <div className="toc-title">On this page</div>
      {headings.map((h) => (
        <a key={h.id} href={`#${h.id}`} className={`toc-link l${h.level} ${active === h.id ? "active" : ""}`}>
          {h.text}
        </a>
      ))}
    </nav>
  );
}
