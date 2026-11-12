/**
 * SANATANMARGA 5.0 BETA — CLIENT COMPOSITION OS SERVICE
 * Phase 3B: Homepage Composition, Section Ordering, Content Picker & Draft Preview Client Service
 */

import {
  HomepageComposition,
  HomepageCompositionBaseline,
  CompositionValidationResult,
  AdminAttentionCase
} from "../types/composition";

class ClientCompositionOS {
  public async getActiveComposition(): Promise<HomepageComposition> {
    try {
      const res = await fetch("/api/homepage/composition/active");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[ClientCompositionOS] Fetch active composition failed, returning default");
    }
    return this.getFallbackComposition();
  }

  public async getDraftComposition(): Promise<HomepageComposition> {
    try {
      const res = await fetch("/api/homepage/composition/draft");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[ClientCompositionOS] Fetch draft composition failed");
    }
    return this.getFallbackComposition();
  }

  public async saveDraftComposition(
    draft: HomepageComposition,
    expectedRevision?: string
  ): Promise<{ success: boolean; draft?: HomepageComposition; error?: string; code?: string }> {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (expectedRevision) {
        headers["X-Expected-Revision"] = expectedRevision;
      }
      const res = await fetch("/api/homepage/composition/draft", {
        method: "POST",
        headers,
        body: JSON.stringify({ draft, expectedRevision })
      });
      return await res.json();
    } catch (e: any) {
      console.error("[ClientCompositionOS] Save draft failed:", e);
      return { success: false, error: e.message || "Failed to save draft" };
    }
  }

  public async validateComposition(composition: HomepageComposition): Promise<CompositionValidationResult> {
    try {
      const res = await fetch("/api/homepage/composition/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composition)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[ClientCompositionOS] Validate failed");
    }
    return { valid: false, blockingErrors: ["Network validation failed"], warnings: [], checkedAt: new Date().toISOString() };
  }

  public async publishComposition(idempotencyKey?: string): Promise<{ success: boolean; composition?: HomepageComposition; error?: string }> {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

      const res = await fetch("/api/homepage/composition/publish", {
        method: "POST",
        headers,
        body: JSON.stringify({ idempotencyKey })
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, composition: data };
      } else {
        const err = await res.json();
        return { success: false, error: err.error || "Failed to publish" };
      }
    } catch (e: any) {
      console.error("[ClientCompositionOS] Publish composition failed:", e);
      return { success: false, error: e.message };
    }
  }

  public async scheduleComposition(composition: HomepageComposition, scheduledPublishAt: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch("/api/homepage/composition/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ composition, scheduledPublishAt })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public async rollbackToVersion(targetVersion: number): Promise<{ success: boolean; composition?: HomepageComposition; error?: string }> {
    try {
      const res = await fetch("/api/homepage/composition/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetVersion })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public async getVersionHistory(): Promise<HomepageComposition[]> {
    try {
      const res = await fetch("/api/homepage/composition/history");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[ClientCompositionOS] Get history failed");
    }
    return [];
  }

  public async getAttentionCases(): Promise<AdminAttentionCase[]> {
    try {
      const res = await fetch("/api/homepage/composition/attention");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[ClientCompositionOS] Get attention cases failed");
    }
    return [];
  }

  public async getContentPicker(entityType: string, search?: string) {
    try {
      const url = `/api/homepage/composition/picker?entityType=${encodeURIComponent(entityType)}&search=${encodeURIComponent(search || "")}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[ClientCompositionOS] Content picker fetch failed");
    }
    return [];
  }

  public async previewRules(composition: HomepageComposition) {
    try {
      const res = await fetch("/api/homepage/composition/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composition)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[ClientCompositionOS] Preview rules failed");
    }
    return { resolvedSections: [], stats: {} };
  }

  public async previewDraft(): Promise<{ draft: HomepageComposition; preview: any } | null> {
    try {
      const res = await fetch("/api/homepage/composition/preview-draft");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[ClientCompositionOS] Preview draft failed");
    }
    return null;
  }

  public async getBaseline(): Promise<HomepageCompositionBaseline | null> {
    try {
      const res = await fetch("/api/homepage/composition/baseline");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[ClientCompositionOS] Baseline fetch failed");
    }
    return null;
  }

  private getFallbackComposition(): HomepageComposition {
    return {
      id: "active",
      version: 1,
      status: "active",
      language: "all",
      updatedAt: new Date().toISOString(),
      updatedBy: "fallback",
      sections: [
        {
          id: "sec_hero",
          type: "hero",
          title: "मुख्य समाचार",
          titleNe: "मुख्य समाचार",
          order: 1,
          isEnabled: true,
          rule: { autoFillStrategy: "latest", maxItems: 5 },
          pinnedSlots: []
        },
        {
          id: "sec_breaking",
          type: "breaking_news",
          title: "ताजा अपडेट",
          titleNe: "ताजा अपडेट",
          order: 2,
          isEnabled: true,
          rule: { autoFillStrategy: "latest", maxItems: 10 },
          pinnedSlots: []
        }
      ]
    };
  }
}

export const clientCompositionOS = new ClientCompositionOS();
