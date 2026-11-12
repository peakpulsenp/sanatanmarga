/**
 * Dedicated Readable Content Extractor for ListenOS "Listen to this page" workflow.
 * Strips navigation, buttons, ads, metadata, comments, and duplicate text to produce clean, concise TTS input.
 */

export interface ExtractedReadableContent {
  title: string;
  lead?: string;
  bodyText: string;
  wordCount: number;
}

export function extractPageReadableContent(customRootSelector?: string): ExtractedReadableContent {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { title: "SanatanMarga", bodyText: "SanatanMarga Digital Portal", wordCount: 4 };
  }

  // 1. Determine title
  let title = document.title || "SanatanMarga Article";
  const h1 = document.querySelector("h1");
  if (h1 && h1.textContent) {
    title = h1.textContent.trim();
  }

  // 2. Determine target container or fallback to main article / body
  const container = customRootSelector 
    ? document.querySelector(customRootSelector) 
    : document.querySelector("article") || document.querySelector("main") || document.body;

  if (!container) {
    return { title, bodyText: title, wordCount: title.split(/\s+/).length };
  }

  // Clone container to avoid modifying DOM
  const clone = container.cloneNode(true) as HTMLElement;

  // 3. Remove unwanted clutter elements
  const clutterSelectors = [
    "nav", "header", "footer", "aside", "button", "script", "style", 
    ".ad", ".ads", "[role='navigation']", "[role='banner']", "[role='contentinfo']",
    ".comments", ".share-buttons", ".social-links", ".metadata", ".tags", 
    "iframe", "noscript", ".breadcrumb", "form"
  ];

  for (const selector of clutterSelectors) {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  }

  // 4. Extract lead paragraph if present
  let lead = "";
  const leadEl = clone.querySelector(".lead, p.text-lg, p.font-semibold");
  if (leadEl && leadEl.textContent) {
    lead = leadEl.textContent.trim();
  }

  // 5. Gather all relevant paragraphs and headings
  const textNodes: string[] = [];
  const contentElements = clone.querySelectorAll("h1, h2, h3, h4, p, li");
  
  contentElements.forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 2 && !textNodes.includes(text)) {
      textNodes.push(text);
    }
  });

  let bodyText = textNodes.join(" ");
  if (!bodyText || bodyText.length < 10) {
    bodyText = clone.textContent?.replace(/\s+/g, " ").trim() || title;
  }

  // Cap extremely long text to prevent excessive token/TTS usage
  if (bodyText.length > 5000) {
    bodyText = bodyText.slice(0, 5000) + "...";
  }

  const wordCount = bodyText.split(/\s+/).length;

  return {
    title,
    lead,
    bodyText: `${title}. ${lead ? lead + ". " : ""}${bodyText}`,
    wordCount
  };
}
