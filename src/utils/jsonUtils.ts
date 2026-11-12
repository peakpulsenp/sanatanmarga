/**
 * Robust JSON extraction and repair engine for AI responses.
 * Handles markdown code fences, preambles, post-explanations, unescaped quotes inside HTML,
 * unescaped newlines, trailing commas, truncated JSON tokens, and regex fallback extraction.
 */

function sanitizeJsonString(str: string): string {
  // Replace unescaped control characters
  let clean = str.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "");

  // Fix trailing commas in arrays and objects
  clean = clean.replace(/,\s*([}\]])/g, "$1");

  return clean;
}

/**
 * Repairs unescaped newlines and unescaped quotes inside JSON string literals
 */
function repairJsonLiterals(raw: string): string {
  let inString = false;
  let isEscaped = false;
  let result = "";

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];

    if (char === '\\' && inString) {
      isEscaped = !isEscaped;
      result += char;
      continue;
    }

    if (char === '"' && !isEscaped) {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      if (char === '\n') {
        result += "\\n";
      } else if (char === '\r') {
        result += "\\r";
      } else if (char === '\t') {
        result += "\\t";
      } else {
        result += char;
      }
    } else {
      result += char;
    }

    isEscaped = false;
  }

  return result;
}

/**
 * Regex-based field extractor for article drafts when JSON is corrupted or truncated
 */
function extractDraftByRegex(rawStr: string): any {
  const getField = (field: string): string => {
    // Look for "fieldName": "value" (accounting for escaped quotes and newlines)
    const regex = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "s");
    const match = rawStr.match(regex);
    if (match && match[1]) {
      return match[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\");
    }
    return "";
  };

  const title = getField("title") || getField("headline") || getField("titleNe");
  const excerpt = getField("excerpt") || getField("summary") || getField("summaryNe");
  let content = getField("content") || getField("body") || getField("article");
  
  // If content was truncated or not caught by closed quotes, try extracting between "content": " and end of block
  if (!content) {
    const contentStartRegex = /"content"\s*:\s*"(.*)/s;
    const startMatch = rawStr.match(contentStartRegex);
    if (startMatch && startMatch[1]) {
      let rest = startMatch[1];
      // Strip trailing JSON tokens if any
      rest = rest.replace(/"\s*,\s*"[a-zA-Z0-9_]+"\s*:.*$/s, "");
      rest = rest.replace(/"\s*}\s*$/s, "");
      content = rest
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\t/g, "\t");
    }
  }

  const categoryId = getField("categoryId") || getField("category") || "samachar";
  const district = getField("district") || "None";
  const seoHeadline = getField("seoHeadline") || title;
  const seoDescription = getField("seoDescription") || excerpt;

  // Extract tags array
  let tags: string[] = [];
  const tagsMatch = rawStr.match(/"tags"\s*:\s*\[(.*?)\]/s);
  if (tagsMatch && tagsMatch[1]) {
    tags = (tagsMatch[1].match(/"([^"]+)"/g) || []).map(t => t.replace(/"/g, "").trim());
  }

  if (title || excerpt || content) {
    return {
      title: title || "ताजा अपडेट",
      excerpt: excerpt || "पछिल्लो समाचार तथा घटनाक्रमको विस्तृत विवरण।",
      content: content || `<p>${excerpt || "विस्तृत विवरण आउन बाँकी छ।"}</p>`,
      categoryId,
      district,
      seoHeadline,
      seoDescription,
      tags: tags.length > 0 ? tags : ["ताजाअपडेट", "समाचार"]
    };
  }

  return null;
}

/**
 * Extracts multiple JSON objects from an array string
 */
function extractArrayObjectsByRegex(rawStr: string): any[] {
  const objects: any[] = [];
  // Match balanced top-level { ... } inside array
  const matches = rawStr.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
  if (matches) {
    for (const m of matches) {
      try {
        const obj = JSON.parse(m);
        objects.push(obj);
      } catch {
        try {
          const repaired = repairJsonLiterals(sanitizeJsonString(m));
          const obj = JSON.parse(repaired);
          objects.push(obj);
        } catch {
          // Skip invalid single item
        }
      }
    }
  }
  return objects;
}

export function extractJson<T = any>(text: any): T {
  if (!text) return null as unknown as T;
  
  if (typeof text === 'object') {
    return text as T;
  }

  let rawStr = String(text).trim();

  // Strip markdown code block wrappers ```json ... ``` or ``` ... ```
  rawStr = rawStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(rawStr);
  } catch {
    // Continue to repair strategies
  }

  // 2. Identify JSON boundaries
  const firstBrace = rawStr.indexOf('{');
  const lastBrace = rawStr.lastIndexOf('}');
  const firstBracket = rawStr.indexOf('[');
  const lastBracket = rawStr.lastIndexOf(']');

  // Determine if it's an Array or an Object
  const isArray = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);

  if (isArray && lastBracket !== -1) {
    const arrayStr = rawStr.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(arrayStr) as T;
    } catch {
      try {
        const sanitized = sanitizeJsonString(arrayStr);
        const repaired = repairJsonLiterals(sanitized);
        return JSON.parse(repaired) as T;
      } catch {
        const fallbackArray = extractArrayObjectsByRegex(arrayStr);
        if (fallbackArray.length > 0) return fallbackArray as unknown as T;
      }
    }
  }

  if (firstBrace !== -1 && lastBrace !== -1) {
    const objectStr = rawStr.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(objectStr) as T;
    } catch {
      try {
        const sanitized = sanitizeJsonString(objectStr);
        const repaired = repairJsonLiterals(sanitized);
        return JSON.parse(repaired) as T;
      } catch {
        // Fallback to regex extractor for article drafts and complex objects
        const fallbackObj = extractDraftByRegex(objectStr);
        if (fallbackObj) return fallbackObj as unknown as T;
      }
    }
  }

  // 3. Fallback regex extraction on entire rawStr
  const draftFallback = extractDraftByRegex(rawStr);
  if (draftFallback) {
    return draftFallback as unknown as T;
  }

  const arrayFallback = extractArrayObjectsByRegex(rawStr);
  if (arrayFallback.length > 0) {
    return arrayFallback as unknown as T;
  }

  // Return a safe fallback object or throw a descriptive error if completely unparseable
  return { text: rawStr } as unknown as T;
}


