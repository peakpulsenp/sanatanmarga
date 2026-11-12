import { CleanupRequest, CleanupResponse, OCRCandidateCorrection } from "./types";
import { auth } from "@/src/lib/firebase";

export class SgisManuscriptCleaner {
  /**
   * Cleans and normalizes Sanskrit / Nepali manuscript text
   */
  static async cleanupText(req: CleanupRequest): Promise<CleanupResponse> {
    let idToken: string | undefined;
    try {
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }
    } catch (e) {
      console.warn("Could not get auth token for text cleanup:", e);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }

    const baseUrl = typeof window !== "undefined" ? "" : (process.env.API_BASE_URL || "http://localhost:3000");

    try {
      const response = await fetch(`${baseUrl}/api/sgis/text/cleanup`, {
        method: "POST",
        headers,
        body: JSON.stringify(req)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `SGIS Cleanup Server Error (${response.status})`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn("[SGIS Cleaner] Backend cleanup failed, executing deterministic client normalization:", err);
      return this.localDeterministicCleanup(req.text);
    }
  }

  /**
   * Deterministic local normalization engine for Sanskrit & Nepali texts
   */
  static localDeterministicCleanup(rawText: string): CleanupResponse {
    if (!rawText) {
      return {
        success: true,
        cleanedText: "",
        normalizationCount: 0,
        candidateCorrections: [],
        diffSummary: {
          dandaNormalized: 0,
          halantFixed: 0,
          anusvaraFixed: 0,
          whitespaceCleaned: false
        }
      };
    }

    let text = rawText;
    const candidateCorrections: OCRCandidateCorrection[] = [];
    let dandaNormalized = 0;
    let halantFixed = 0;
    let anusvaraFixed = 0;

    // 1. Normalize Double Dandas: '।।' or '||' -> '॥'
    const doubleDandaRegex = /(?:।।|\|\|)/g;
    const doubleDandaMatches = text.match(doubleDandaRegex);
    if (doubleDandaMatches) {
      dandaNormalized += doubleDandaMatches.length;
      text = text.replace(doubleDandaRegex, "॥");
      candidateCorrections.push({
        id: `corr-danda-${Date.now()}`,
        rawOcrText: "।।",
        suggestedCorrection: "॥",
        reason: "संस्कृत मानक द्विदण्ड (Double Danda) शुद्धीकरण",
        confidence: 0.99,
        submittedBy: "SGIS Deterministic Normalizer",
        status: "approved",
        createdAt: new Date().toISOString()
      });
    }

    // 2. Fix spaced dandas (e.g. " । " or " ॥ ")
    text = text.replace(/\s+।/g, "।").replace(/।\s*।/g, "॥");

    // 3. Normalize multiple halants / broken halants
    const halantRegex = /्+/g;
    if (/्{2,}/.test(text)) {
      halantFixed++;
      text = text.replace(halantRegex, "्");
      candidateCorrections.push({
        id: `corr-halant-${Date.now()}`,
        rawOcrText: "््",
        suggestedCorrection: "्",
        reason: "हलन्त दोहोरोपन हटाएर शुद्धिकरण",
        confidence: 0.98,
        submittedBy: "SGIS Deterministic Normalizer",
        status: "approved",
        createdAt: new Date().toISOString()
      });
    }

    // 4. Normalize Latin quotes and irregular OCR artifacts
    text = text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    text = text.replace(/[–—]/g, "-");

    // 5. Normalize consecutive spaces and newlines
    const beforeSpaces = text;
    text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    const whitespaceCleaned = beforeSpaces !== text;

    return {
      success: true,
      cleanedText: text,
      normalizationCount: dandaNormalized + halantFixed + anusvaraFixed + (whitespaceCleaned ? 1 : 0),
      candidateCorrections,
      diffSummary: {
        dandaNormalized,
        halantFixed,
        anusvaraFixed,
        whitespaceCleaned
      }
    };
  }
}
