/**
 * SanatanMarga RevenueOS v3.0 — Advertiser Registry & Master OS
 * 
 * Manages verified advertiser profiles, PAN/VAT tax identities,
 * contact persons, payment terms, and status.
 */

import { AdvertiserProfile } from "@/src/types";
import { db } from "@/src/lib/firebase";
import { collection, getDocs, doc, setDoc } from "@/src/lib/firebase";

export const DEFAULT_ADVERTISERS: AdvertiserProfile[] = [
  {
    id: "adv-ncell",
    legalName: "एनसेल एक्सियाटा लिमिटेड (Ncell Axiata Ltd.)",
    displayName: "Ncell Axiata",
    contactPerson: "सुमन अधिकारी (Suman Adhikari)",
    email: "corporate@ncell.com.np",
    phone: "+977-1-4445555",
    address: "एकान्तकुना, ललितपुर, नेपाल",
    pan: "300123456",
    vatNumber: "300123456-VAT",
    billingAddress: "एनसेल टावर, एकान्तकुना, ललितपुर",
    paymentTerms: "net30",
    status: "active",
    createdAt: "2026-01-15T00:00:00Z"
  },
  {
    id: "adv-ntc",
    legalName: "नेपाल टेलिकम (Nepal Telecom)",
    displayName: "Nepal Telecom",
    contactPerson: "रमेश श्रेष्ठ (Ramesh Shrestha)",
    email: "ad@ntc.net.np",
    phone: "+977-1-4222222",
    address: "भद्रकाली, काठमाडौँ",
    pan: "300987654",
    vatNumber: "300987654-VAT",
    billingAddress: "केन्द्रीय कार्यालय, भद्रकाली, काठमाडौँ",
    paymentTerms: "net30",
    status: "active",
    createdAt: "2026-01-20T00:00:00Z"
  },
  {
    id: "adv-global-ime",
    legalName: "ग्लोबल आईएमई बैंक लिमिटेड (Global IME Bank Ltd.)",
    displayName: "Global IME Bank",
    contactPerson: "कमल थापा (Kamal Thapa)",
    email: "marketing@gibl.com.np",
    phone: "+977-1-5970600",
    address: "कमलादी, काठमाडौँ",
    pan: "301555666",
    vatNumber: "301555666-VAT",
    billingAddress: "ग्लोबल टावर, कमलादी, काठमाडौँ",
    paymentTerms: "net15",
    status: "active",
    createdAt: "2026-02-01T00:00:00Z"
  },
  {
    id: "adv-pokhara-tourism",
    legalName: "पोखरा पर्यटन बोर्ड (Pokhara Tourism Board)",
    displayName: "Pokhara Tourism",
    contactPerson: "अनुप गुरुङ (Anup Gurung)",
    email: "info@pokharatourism.gov.np",
    phone: "+977-61-465222",
    address: "लेकसाइड, पोखरा, कास्की",
    pan: "600444333",
    billingAddress: "पर्यटन बोर्ड, लेकसाइड, पोखरा",
    paymentTerms: "immediate",
    status: "active",
    createdAt: "2026-02-10T00:00:00Z"
  },
  {
    id: "adv-nabil",
    legalName: "नबिल बैंक लिमिटेड (Nabil Bank Ltd.)",
    displayName: "Nabil Bank",
    contactPerson: "प्रिया ढकाल (Priya Dhakal)",
    email: "brand@nabilbank.com",
    phone: "+977-1-4227181",
    address: "दरबारमार्ग, काठमाडौँ",
    pan: "300777888",
    billingAddress: "नबिल हाउस, दरबारमार्ग, काठमाडौँ",
    paymentTerms: "net30",
    status: "active",
    createdAt: "2026-03-01T00:00:00Z"
  }
];

export class AdvertiserRegistry {
  private advertisers: AdvertiserProfile[] = DEFAULT_ADVERTISERS;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("sanatan_advertisers_registry");
      if (raw) {
        this.advertisers = JSON.parse(raw);
      }
    } catch {}
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("sanatan_advertisers_registry", JSON.stringify(this.advertisers));
    } catch {}
  }

  public getAdvertisers(): AdvertiserProfile[] {
    return this.advertisers;
  }

  public getAdvertiserById(id: string): AdvertiserProfile | undefined {
    return this.advertisers.find(a => a.id === id);
  }

  public addAdvertiser(adv: Omit<AdvertiserProfile, "id" | "createdAt">): AdvertiserProfile {
    const newAdv: AdvertiserProfile = {
      ...adv,
      id: `adv-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.advertisers.unshift(newAdv);
    this.saveToStorage();

    if (db) {
      setDoc(doc(db, "advertisers", newAdv.id), newAdv).catch(() => {});
    }

    return newAdv;
  }

  public updateAdvertiser(id: string, updates: Partial<AdvertiserProfile>): AdvertiserProfile | null {
    const idx = this.advertisers.findIndex(a => a.id === id);
    if (idx === -1) return null;

    this.advertisers[idx] = {
      ...this.advertisers[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveToStorage();

    if (db) {
      setDoc(doc(db, "advertisers", id), this.advertisers[idx], { merge: true }).catch(() => {});
    }

    return this.advertisers[idx];
  }
}

export const advertiserRegistry = new AdvertiserRegistry();
