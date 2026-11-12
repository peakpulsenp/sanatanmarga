import React, { useState, useRef } from "react";
import { Upload, Scan, Sparkles, FileText, CheckCircle2, AlertCircle, RefreshCw, Image as ImageIcon, Check, Eye, ShieldAlert, Sliders, Layers, Compass, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { SgisGrantha, SgisRole, SgisOcrService, OCRExtractionResponse, SgisOSService, SgisErrorDetails } from "@/src/services/sgisOSService";

interface Props {
  currentRole: SgisRole;
  onManuscriptCreated: (grantha: SgisGrantha) => void;
  selectedManuscript?: SgisGrantha;
}

const SAMPLE_MANUSCRIPT_PRESETS = [
  {
    title: "तैत्तिरीयोपनिषद् - शान्तिमन्त्र (ताडपत्र)",
    script: "Brahmi",
    century: "6th Century CE (Licchavi Era)",
    material: "Palm_Leaf",
    text: "ॐ सह नाववतु सह नौ भुनक्तु सह वीर्यं करवावहै। तेजस्वि नावधीतमस्तु मा विद्विषावहै॥ ॐ शान्तिः शान्तिः शान्तिः॥"
  },
  {
    title: "श्रीमद्भगवद्गीता - द्वितीयोऽध्यायः (भोजपत्र)",
    script: "Devanagari",
    century: "11th Century CE",
    material: "Birch_Bark",
    text: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥"
  },
  {
    title: "महामृत्यञ्जय मन्त्र पाण्डुलिपि (काष्ठपत्र)",
    script: "Prachalit_Newari",
    century: "14th Century CE (Malla Era)",
    material: "Paper",
    text: "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात्॥"
  }
];

export default function SgisOcrStudio({ currentRole, onManuscriptCreated, selectedManuscript }: Props) {
  const [selectedScript, setSelectedScript] = useState<any>("Devanagari");
  const [selectedMaterial, setSelectedMaterial] = useState<any>("Palm_Leaf");
  const [repositoryName, setRepositoryName] = useState("राष्ट्रिय अभिलेखालय (National Archives of Nepal)");
  const [inputText, setInputText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>("image/png");
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRExtractionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<SgisErrorDetails | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSizeBytes(file.size);
    setErrorMessage(null);
    setErrorDetails(null);

    let mime = file.type;
    if (!mime) {
      if (file.name.toLowerCase().endsWith(".pdf")) mime = "application/pdf";
      else if (file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg")) mime = "image/jpeg";
      else if (file.name.toLowerCase().endsWith(".webp")) mime = "image/webp";
      else mime = "image/png";
    }
    setFileMimeType(mime);

    try {
      const base64 = await SgisOcrService.fileToBase64(file);
      setImagePreview(`data:${mime};base64,${base64}`);
      toast.success(`फाइल "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) लोड भयो।`);
    } catch (err) {
      toast.error("फाइल पढ्न सकिएन।");
    }
  };

  const handleExecuteOcr = async () => {
    if (!SgisOSService.hasPermission(currentRole, "ocr_upload")) {
      toast.error(`निषेध: '${currentRole}' भूमिकाले OCR अपलोड गर्न पाउँदैन। ('Archivist' वा 'Admin' आवश्यक)`);
      return;
    }

    const hasInput = imagePreview || inputText.trim().length > 0;
    if (!hasInput) {
      toast.error("कृपया पाण्डुलिपिको तस्विर/PDF अपलोड गर्नुहोस् वा नमूना पाठ चयन गर्नुहोस्।");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setErrorDetails(null);
    toast.info("पाण्डुलिपिबाट लिप्यन्तरण र OCR निष्कर्षण भइरहेको छ...");

    try {
      const rawBase64 = imagePreview?.includes(",") ? imagePreview.split(",")[1] : undefined;
      const res = await SgisOcrService.extractManuscriptOcr({
        imageBufferBase64: rawBase64,
        mimeType: fileMimeType,
        fileSize: fileSizeBytes,
        sampleText: inputText,
        targetScript: selectedScript,
        fileName: fileName || "manuscript_scan.png",
        repositoryName,
        material: selectedMaterial
      });

      setOcrResult(res);

      if (res.success && res.rawExtractedText) {
        // Create full SGIS Manuscript
        const accessionNumber = res.accessionNumber;
        const newMs: SgisGrantha = {
          id: `ms-${Date.now()}`,
          accessionNumber,
          titleSanskrit: res.suggestedTitle?.sanskrit || res.rawExtractedText.substring(0, 30),
          titleNepali: res.suggestedTitle?.nepali || `पाण्डुलिपि (${fileName || "अभिलेख"})`,
          titleEnglish: res.suggestedTitle?.english || `Manuscript (${fileName || "Scan"})`,
          category: "manuscript",
          author: "प्राचीन अभिलेखकार (अभिलेखालय प्रति)",
          historicalPeriod: res.estimatedCentury || "वि.सं. ६औँ-१२औँ शताब्दी",
          originalText: res.rawExtractedText,
          transliterationIAST: SgisOSService.createTransliteration(res.rawExtractedText, "IAST").transliteratedText,
          transliterationRomanized: SgisOSService.createTransliteration(res.rawExtractedText, "Romanized").transliteratedText,
          translationNepali: `यस पाण्डुलिपि मन्त्रको नेपाली व्याख्या: ${res.rawExtractedText.substring(0, 40)}...`,
          translationEnglish: `English translation for: ${res.rawExtractedText.substring(0, 40)}...`,
          manuscriptMetadata: {
            repositoryName,
            accessionNumber,
            script: res.detectedScript as any || selectedScript,
            estimatedCentury: res.estimatedCentury,
            material: selectedMaterial,
            preservationStatus: res.qualityAssessment,
            digitalImagesCount: 1,
            digitizedBy: `SGIS Preservation Unit (${currentRole})`,
            originalFileName: fileName || "manuscript_scan.png",
            imagePreviewBase64: imagePreview || undefined
          },
          ocrPipelineStatus: "raw_ocr",
          lifecycleStatus: "OCR_COMPLETE",
          ragStatus: "NOT_INDEXED",
          ocrConfidence: res.confidenceScore,
          scholarValidationStatus: "pending",
          isPublishedToLibrary: false,
          isIndexedInRag: false,
          versionHistory: [
            {
              version: 1.0,
              versionTag: "v1.0 Raw OCR",
              text: res.rawExtractedText,
              changedBy: `SGIS OCR Engine (${currentRole})`,
              changedAt: new Date().toLocaleString(),
              changeReason: `Multimodal Gemini OCR paleographic scan (${res.modelUsed || "verbatim-ai"})`
            }
          ],
          translations: [],
          transliterations: [],
          candidateCorrections: [],
          tags: ["पाण्डुलिपि", selectedScript, selectedMaterial, "SGIS"],
          auditTrail: [
            {
              id: `aud-${Date.now()}`,
              actor: `User (${currentRole})`,
              actorRole: currentRole,
              timestamp: new Date().toLocaleString(),
              manuscriptId: `ms-${Date.now()}`,
              version: 1.0,
              action: "OCR_COMPLETED",
              reason: `Multimodal OCR extracted ${res.extractedCharCount || res.rawExtractedText.length} characters with confidence ${Math.round(res.confidenceScore * 100)}%`
            }
          ],
          dateAdded: new Date().toISOString().split("T")[0]
        };

        onManuscriptCreated(newMs);
        toast.success(`OCR सफल! Accession No: ${accessionNumber} जारी भयो।`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "OCR प्रक्रियामा त्रुटि आयो।");
      if (err.errorDetails) {
        setErrorDetails(err.errorDetails);
      } else if (fileSizeBytes > 20 * 1024 * 1024 || (err.message && err.message.includes("413"))) {
        setErrorDetails({
          code: 413,
          title: "फाइल धेरै ठूलो छ (413 Payload Too Large)",
          reason: "PDF वा तस्विरको आकार अनुमति गरिएको सीमा भन्दा ठूलो छ वा धेरै उच्च-रिजोल्युसन बहुपृष्ठ छविहरू छन्।",
          solutions: [
            "PDF लाई थोरै पृष्ठहरूमा विभाजन गर्नुहोस् (Divide / Split PDF)।",
            "फाइल आकार २० MB भन्दा कम राख्नुहोस्।",
            "आवश्यक भए छवि संकुचन (Image Compression / Resize) प्रयोग गर्नुहोस्।"
          ],
          note: "३०० DPI सिफारिस गरिएको गुणस्तर हो, अनिवार्य आवश्यकता होइन। पुराना वा जीर्ण पाण्डुलिपिहरू पनि बेस्ट-पसिबल रिकभरी रणनीतिद्वारा प्रशोधन गरिन्छ।"
        });
      }
      toast.error(err.message || "OCR प्रक्रियामा त्रुटि आयो।");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPreset = (preset: typeof SAMPLE_MANUSCRIPT_PRESETS[0]) => {
    setInputText(preset.text);
    setImagePreview(null);
    setFileMimeType("text/plain");
    setFileSizeBytes(0);
    setSelectedScript(preset.script);
    setSelectedMaterial(preset.material);
    setFileName(`${preset.title.replace(/\s+/g, "_")}.txt`);
    setErrorMessage(null);
    setErrorDetails(null);
    toast.info(`नमूना लोड भयो: ${preset.title}`);
  };

  const getConfidenceBadge = (tier?: string, score?: number) => {
    const s = score || 0;
    if (tier === "auto_process" || s >= 0.90) {
      return {
        label: "स्वतः प्रशोधन (Auto Process >90%)",
        bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
        icon: CheckCircle2
      };
    }
    if (tier === "review_suggested" || s >= 0.70) {
      return {
        label: "समीक्षा सिफारिस (Review Suggested 70-90%)",
        bg: "bg-blue-500/10 text-blue-600 border-blue-500/30",
        icon: Eye
      };
    }
    if (tier === "ocr_review_required" || s >= 0.50) {
      return {
        label: "पुनरावलोकन आवश्यक (OCR Review Required 50-70%)",
        bg: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        icon: AlertCircle
      };
    }
    return {
      label: "पण्डित प्रमाणीकरण अनिवार्य (Scholar Verification <50%)",
      bg: "bg-red-500/10 text-red-600 border-red-500/30",
      icon: ShieldAlert
    };
  };

  const isLargeFile = fileSizeBytes > 25 * 1024 * 1024;

  return (
    <div className="space-y-6">
      {/* OCR Preprocessing Pipeline Banner */}
      <div className="bg-card border border-border-theme rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <span className="font-black text-foreground">SGIS Paleographic Pipeline:</span>
          <span className="text-muted-text">Best Possible Recovery Engine (Zero 300 DPI Hard Rejection)</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold text-muted-text">
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary">1. Upload</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded-md bg-muted-area">2. Deskew</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded-md bg-muted-area">3. Contrast Enhancement</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded-md bg-muted-area">4. Noise Removal</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">5. Multimodal OCR</span>
        </div>
      </div>

      {/* Upload and OCR Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Upload & Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Upload size={16} className="text-primary" /> पाण्डुलिपि स्क्यान अपलोड
            </h3>

            {/* Dropzone */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border-theme hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition-all bg-muted-area/30 hover:bg-muted-area relative group"
            >
              {imagePreview ? (
                <div className="space-y-2">
                  {fileMimeType.includes("pdf") ? (
                    <div className="py-4 flex flex-col items-center justify-center space-y-2 bg-primary/5 rounded-xl border border-primary/20">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                        PDF
                      </div>
                      <span className="text-xs font-black text-foreground max-w-[200px] truncate">{fileName}</span>
                      <span className="text-[10px] text-muted-text bg-background px-2 py-0.5 rounded-full border border-border-theme font-bold">
                        {(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB • Adobe PDF Document
                      </span>
                    </div>
                  ) : (
                    <img
                      src={imagePreview}
                      alt="Scan Preview"
                      className="max-h-40 mx-auto rounded-lg shadow object-contain border border-border-theme"
                    />
                  )}
                  <p className="text-xs font-bold text-foreground truncate">{fileName || "Scan Selected"}</p>
                  <p className="text-[10px] text-muted-text">अर्को फाइल चयन गर्न यहाँ क्लिक गर्नुहोस्</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Scan size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground">पाण्डुलिपि तस्विर वा PDF यहाँ तान्नुहोस्</p>
                    <p className="text-[10px] text-muted-text mt-0.5">समर्थित: PDF (बहुपृष्ठ), JPG, PNG, WebP (ताडपत्र, भोजपत्र, काष्ठपत्र, ताम्रपत्र)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Proactive File Size Warning */}
            {isLargeFile && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle size={15} />
                  <span>फाइल आकार ठूलो छ ({(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB)</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90 pl-5">
                  सिफारिस: PDF लाई स-साना भागमा विभाजन गर्नुहोस् वा २० MB भन्दा कम राख्नुहोस्।
                </p>
              </div>
            )}

            {/* Structured Actionable Error Message Box */}
            {(errorDetails || errorMessage) && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-2 text-xs text-red-700 dark:text-red-300">
                <div className="flex items-center gap-2 font-black text-sm">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                  <span>{errorDetails?.title || "OCR निष्कर्षण असफल"}</span>
                </div>

                <div className="pl-6 space-y-2 text-[11px]">
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground block">कारण:</span>
                    <p className="text-muted-text leading-relaxed">
                      {errorDetails?.reason || errorMessage}
                    </p>
                  </div>

                  {errorDetails?.solutions && errorDetails.solutions.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-foreground block">समाधान:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-muted-text">
                        {errorDetails.solutions.map((sol, i) => (
                          <li key={i}>{sol}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-2.5 bg-background/80 rounded-xl border border-border-theme text-[10px] text-muted-text leading-relaxed">
                    <span className="font-bold text-foreground">💡 नोट: </span>
                    {errorDetails?.note || "३०० DPI सिफारिस गरिएको गुणस्तर हो, अनिवार्य आवश्यकता होइन। पुराना वा जीर्ण पाण्डुलिपिहरू पनि बेस्ट-पसिबल रिकभरी रणनीतिद्वारा प्रशोधन गरिन्छ।"}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                  लक्षित लिपि (Target Script)
                </label>
                <select
                  value={selectedScript}
                  onChange={(e) => setSelectedScript(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="Devanagari">देवनागरी (Devanagari)</option>
                  <option value="Prachalit_Newari">प्रचलित नेपाल लिपि (Prachalit)</option>
                  <option value="Ranjana">रञ्जना लिपि (Ranjana)</option>
                  <option value="Brahmi">ब्राह्मी लिपि (Brahmi)</option>
                  <option value="Sharada">शारदा लिपि (Sharada)</option>
                  <option value="Grantha_Script">ग्रन्थ लिपि (Grantha Script)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                  सामग्री (Material)
                </label>
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="Palm_Leaf">ताडपत्र (Palm Leaf)</option>
                  <option value="Paper">नेपाली कागज (Paper)</option>
                  <option value="Birch_Bark">भोजपत्र (Birch Bark)</option>
                  <option value="Copper_Plate">ताम्रपत्र (Copper Plate)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                अभिलेखालय / स्रोत (Repository)
              </label>
              <input
                type="text"
                value={repositoryName}
                onChange={(e) => setRepositoryName(e.target.value)}
                className="w-full bg-background border border-border-theme rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            {/* Presets */}
            <div>
              <label className="text-[10px] font-black uppercase text-muted-text block mb-1.5">
                वा नमूना पाण्डुलिपि छान्नुहोस्:
              </label>
              <div className="space-y-1.5">
                {SAMPLE_MANUSCRIPT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(p)}
                    className="w-full text-left p-2 rounded-xl border border-border-theme bg-muted-area/30 hover:bg-primary/5 hover:border-primary/40 text-xs transition-all flex items-center justify-between"
                  >
                    <span className="font-bold text-foreground truncate">{p.title}</span>
                    <span className="text-[10px] text-primary font-black bg-primary/10 px-2 py-0.5 rounded-md">
                      {p.script}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExecuteOcr}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Best-Recovery OCR निष्कर्षण भइरहेको छ...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> OCR निष्कर्षण सुरु गर्नुहोस् (Execute OCR)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Col: Extracted OCR Preview & Line Segments (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-sm space-y-4 min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-border-theme pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <h3 className="text-sm font-black text-foreground">OCR निष्कर्षण परिणाम (Extracted Text)</h3>
                </div>
                {ocrResult && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      विश्वास स्कोर: {Math.round(ocrResult.confidenceScore * 100)}%
                    </span>
                    <span className="text-[10px] font-black bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      {ocrResult.detectedScript}
                    </span>
                  </div>
                )}
              </div>

              {ocrResult ? (
                <div className="space-y-4">
                  {/* Accession & Telemetry Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-muted-area border border-border-theme">
                      <span className="text-[10px] uppercase font-black text-muted-text block">Accession No</span>
                      <span className="text-primary font-black truncate block">{ocrResult.accessionNumber}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted-area border border-border-theme">
                      <span className="text-[10px] uppercase font-black text-muted-text block">कुल अक्षर (Characters)</span>
                      <span className="text-foreground font-black block">{ocrResult.extractedCharCount || ocrResult.rawExtractedText.length}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted-area border border-border-theme">
                      <span className="text-[10px] uppercase font-black text-muted-text block">शब्द / हरफ (Words/Lines)</span>
                      <span className="text-foreground font-black block">{ocrResult.wordCount} / {ocrResult.lineCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted-area border border-border-theme">
                      <span className="text-[10px] uppercase font-black text-muted-text block">OCR मोडेल (Model)</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black truncate block">
                        {ocrResult.modelUsed || "Gemini Flash"}
                      </span>
                    </div>
                  </div>

                  {/* Confidence Tier Badge Card */}
                  {(() => {
                    const badge = getConfidenceBadge(ocrResult.confidenceTier, ocrResult.confidenceScore);
                    const BadgeIcon = badge.icon;
                    return (
                      <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${badge.bg}`}>
                        <div className="flex items-center gap-2 font-black">
                          <BadgeIcon size={16} />
                          <span>{badge.label}</span>
                        </div>
                        <span className="text-[10px] font-bold opacity-80">
                          {ocrResult.estimatedCentury || "प्राचीन काल"}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Manuscript Physical Condition Analysis */}
                  {ocrResult.manuscriptCondition && (
                    <div className="p-3 bg-muted-area/60 border border-border-theme rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-foreground flex items-center gap-1.5">
                          <Sliders size={14} className="text-primary" /> पाण्डुलिपि अवस्था विश्लेषण (Condition Telemetry):
                        </span>
                        <span className="text-[10px] uppercase font-black text-primary">
                          {ocrResult.manuscriptCondition.physicalCondition}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-text pt-1">
                        <div>स्याही धमिलोपन: <strong className="text-foreground">{ocrResult.manuscriptCondition.inkFade}</strong></div>
                        <div>च्यातिएको/प्वाल: <strong className="text-foreground">{ocrResult.manuscriptCondition.tearsOrHoles}</strong></div>
                        <div>पठन योग्यता: <strong className="text-foreground">{ocrResult.manuscriptCondition.legibility}</strong></div>
                      </div>
                      {ocrResult.manuscriptCondition.preservationAdvice && (
                        <p className="text-[10px] text-muted-text italic pt-1 border-t border-border-theme/50">
                          संज्ञा: {ocrResult.manuscriptCondition.preservationAdvice}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Raw Text Box */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                      निष्कर्षित संस्कृत/नेपाली मूल पाठ:
                    </label>
                    <div className="p-4 rounded-xl bg-background border border-border-theme font-serif text-sm leading-relaxed text-foreground whitespace-pre-wrap selection:bg-primary/20 max-h-60 overflow-y-auto">
                      {ocrResult.rawExtractedText}
                    </div>
                  </div>

                  {/* Line Segments Breakdown */}
                  {ocrResult.lineSegments && ocrResult.lineSegments.length > 0 && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-muted-text block mb-1.5">
                        खण्डित हरफहरू (Line Segmentation - {ocrResult.lineSegments.length} Lines):
                      </label>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {ocrResult.lineSegments.map((seg, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-muted-area/50 border border-border-theme text-xs flex items-center justify-between gap-3"
                          >
                            <span className="w-6 h-6 rounded-md bg-card border border-border-theme flex items-center justify-center text-[10px] font-black text-muted-text flex-shrink-0">
                              {seg.lineIndex}
                            </span>
                            <span className="text-foreground font-medium flex-1 truncate">{seg.text}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <div className="w-12 bg-border-theme rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full"
                                  style={{ width: `${Math.round(seg.confidence * 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-black text-emerald-600">
                                {Math.round(seg.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted-area flex items-center justify-center mx-auto text-muted-text border border-border-theme">
                    <Scan size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">कुनै OCR परिणाम उपलब्ध छैन</p>
                    <p className="text-xs text-muted-text max-w-sm mx-auto mt-1">
                      बायाँ तर्फबाट पाण्डुलिपि अपलोड गर्नुहोस् वा नमूना छनौट गरी OCR प्रक्रिया सुरु गर्नुहोस्।
                    </p>
                  </div>
                </div>
              )}
            </div>

            {ocrResult && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={16} />
                  <span>पाण्डुलिपि सफलतापूर्वक SGIS भल्टमा सुरक्षित गरियो!</span>
                </div>
                <span className="text-[10px] font-black text-muted-text uppercase">
                  Step 2 Complete → Proceed to Step 3 Cleanup
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
