import { useState } from "react";
import { 
  BookOpen, Github, Globe, Server, Terminal, 
  Code, Database, Cloud, Layout, CheckCircle2, 
  ExternalLink, Copy, Check, Info, HelpCircle, Shield
} from "lucide-react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { motion } from "motion/react";

export default function AdminSetupGuide() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sections = [
    {
      id: "local-setup",
      title: "Local Setup",
      icon: Terminal,
      color: "text-blue-500",
      bg: "bg-blue-50",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            To run this application on your local machine, follow these steps:
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Install Node.js</h4>
                <p className="text-sm text-slate-500">Download and install Node.js (v18 or higher) from <a href="https://nodejs.org" target="_blank" className="text-blue-500 hover:underline">nodejs.org</a>.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Clone Repository</h4>
                <div className="mt-2 relative group">
                  <code className="block bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono">
                    git clone https://github.com/your-username/sanatan-marga.git
                  </code>
                  <button 
                    onClick={() => copyToClipboard("git clone https://github.com/your-username/sanatan-marga.git")}
                    className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white opacity-0 group-hover:opacity-100"
                  >
                    {copiedText === "git clone https://github.com/your-username/sanatan-marga.git" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Install Dependencies</h4>
                <div className="mt-2 relative group">
                  <code className="block bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono">
                    npm install
                  </code>
                  <button 
                    onClick={() => copyToClipboard("npm install")}
                    className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white opacity-0 group-hover:opacity-100"
                  >
                    {copiedText === "npm install" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">4</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Environment Variables</h4>
                <p className="text-sm text-slate-500">Create a <code className="bg-slate-100 px-1 rounded">.env</code> file in the root directory and add your Firebase and Gemini API keys.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">5</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Run Development Server</h4>
                <div className="mt-2 relative group">
                  <code className="block bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono">
                    npm run dev
                  </code>
                  <button 
                    onClick={() => copyToClipboard("npm run dev")}
                    className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white opacity-0 group-hover:opacity-100"
                  >
                    {copiedText === "npm run dev" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "firebase-setup",
      title: "Firebase Configuration",
      icon: Database,
      color: "text-orange-500",
      bg: "bg-orange-50",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            This app uses Firebase for Authentication and Firestore Database.
          </p>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-sm text-slate-600">Create a new project at <a href="https://console.firebase.google.com" target="_blank" className="text-orange-500 hover:underline">Firebase Console</a>.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-sm text-slate-600">Enable <b>Authentication</b> (Google Provider).</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-sm text-slate-600">Create a <b>Cloud Firestore</b> database in production mode.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-sm text-slate-600">Copy your <b>Web App Configuration</b> and paste it into <code className="bg-slate-100 px-1 rounded">firebase-applet-config.json</code>.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-sm text-slate-600">Deploy Security Rules using <code className="bg-slate-100 px-1 rounded">firestore.rules</code>.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "roles-permissions",
      title: "User Roles & RBAC System",
      icon: Shield,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Sanatan Marga incorporates a fine-grained Role-Based Access Control (RBAC) system:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-muted-area rounded-2xl border border-border-theme space-y-1">
              <span className="text-xs font-black uppercase text-purple-500">Super Admin / Admin</span>
              <p className="text-xs text-muted-text">Full management over users, RBAC roles, tenant settings, monetization OS, and system operations.</p>
            </div>
            <div className="p-4 bg-muted-area rounded-2xl border border-border-theme space-y-1">
              <span className="text-xs font-black uppercase text-blue-500">Chief Editor / Editor</span>
              <p className="text-xs text-muted-text">Article creation, approval workflow, media library management, and Knowledge OS curation.</p>
            </div>
            <div className="p-4 bg-muted-area rounded-2xl border border-border-theme space-y-1">
              <span className="text-xs font-black uppercase text-emerald-500">Journalist / Reporter</span>
              <p className="text-xs text-muted-text">Drafting field news stories, community Choufari posts, and event submissions.</p>
            </div>
            <div className="p-4 bg-muted-area rounded-2xl border border-border-theme space-y-1">
              <span className="text-xs font-black uppercase text-amber-500">User / Subscriber</span>
              <p className="text-xs text-muted-text">Public article reading, commenting, saving favorites, and role upgrade requests.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "knowledge-hub-os",
      title: "Knowledge OS & Nepal Hub OS",
      icon: BookOpen,
      color: "text-sacred",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            The platform features integrated Saraswati Knowledge OS and Nepal Hub OS:
          </p>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-3">
              <CheckCircle2 className="text-sacred flex-shrink-0" size={18} />
              <span><b>Saraswati Knowledge OS:</b> Graph network connecting temples, sacred texts, Vedic festivals, and historical entities.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-sacred flex-shrink-0" size={18} />
              <span><b>Nepal Hub OS:</b> Live national intelligence feed syncing Panchang, NRB forex exchange rates, gold/silver commodity prices, and 77 district bulletins.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "vscode-integration",
      title: "VS Code & Antigravity",
      icon: Code,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            You can edit the code of this application directly in VS Code while keeping it synced with the Antigravity environment.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Export to GitHub</h4>
                <p className="text-sm text-slate-500">Use the "Export to GitHub" option in the AI Studio settings menu to create a linked repository.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Clone & Open</h4>
                <p className="text-sm text-slate-500">Clone the repository to your local machine and open it in VS Code.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900">Antigravity Sync</h4>
                <p className="text-sm text-slate-500">Any changes pushed to the main branch of your GitHub repository will be automatically reflected in the Antigravity environment.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "deployment",
      title: "Deployment (Vercel & GitHub)",
      icon: Cloud,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            Deploy your application to the web using GitHub and Vercel.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-3">
              <Github className="text-slate-900" size={32} />
              <h4 className="font-bold text-slate-900">GitHub</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Push your code to a GitHub repository. This enables automatic deployments and version control.</p>
              <a href="https://github.com/new" target="_blank" className="inline-flex items-center gap-2 text-xs font-black text-indigo-500 uppercase tracking-widest hover:underline">Create Repo <ExternalLink size={12} /></a>
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-3">
              <Globe className="text-blue-500" size={32} />
              <h4 className="font-bold text-slate-900">Vercel</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Connect your GitHub repo to Vercel. It will automatically build and deploy your app on every push.</p>
              <a href="https://vercel.com/new" target="_blank" className="inline-flex items-center gap-2 text-xs font-black text-indigo-500 uppercase tracking-widest hover:underline">Deploy Now <ExternalLink size={12} /></a>
            </div>
          </div>
          <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
            <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
              <Info size={18} /> Important Note
            </h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              When deploying to Vercel, make sure to add all your environment variables (from <code className="bg-white/50 px-1 rounded">.env</code>) in the Vercel Project Settings.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "ai-integration",
      title: "AI Features Implementation (Gemini, Firebase & Vercel)",
      icon: Code,
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Since your client-side application cannot securely hold your Google Gemini API key directly (to avoid leaking it to visitors), you must proxy all Gemini AI interactions through a serverless backend. Follow this architecture to implement AI features (e.g. auto-summarization, article tagging, translation, or Knowledge Graph auto-linking) after deploying to Vercel and Firebase:
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900 dark:text-white">Secure your Gemini API Key in Vercel</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Obtain a Gemini API key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-rose-500 hover:underline">Google AI Studio</a>. Add it as an Environment Variable named <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-rose-600">GEMINI_API_KEY</code> inside your <b>Vercel Project Dashboard → Settings → Environment Variables</b>. Never hardcode or commit this key to GitHub!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900 dark:text-white">Create a Serverless API Route (Vercel Serverless Functions)</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Create a new file under your project repository called <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs">api/ai/generate.ts</code> (or use Vercel's Next.js / server routes depending on your final deploy structure). Here is a standard Node.js serverless route template using the modern <code className="text-rose-500 font-mono text-xs">@google/genai</code> SDK:
                </p>
                <div className="mt-3 relative group">
                  <pre className="block bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`import { GoogleGenAI } from "@google/genai";
import { db } from "../../lib/firebase"; // Import server-side initialized admin SDK

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { prompt, contextId } = req.body;
  
  try {
    // Generate content using Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });
    
    const resultText = response.text;
    
    // Optional: Log/Save metadata directly to Firebase Firestore
    if (contextId) {
      // e.g. await db.collection("articles").doc(contextId).update({ aiSummary: resultText });
    }
    
    return res.status(200).json({ result: resultText });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard(`import { GoogleGenAI } from "@google/genai";\nconst ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });`)}
                    className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white opacity-0 group-hover:opacity-100"
                  >
                    {copiedText?.includes("@google/genai") ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900 dark:text-white">Call the Secure Endpoint from the Frontend</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  In your React component (such as an Admin Editor or AI Summarizer panel), fetch from your serverless route instead of calling Gemini directly:
                </p>
                <div className="mt-3 relative group">
                  <pre className="block bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`const handleAISummarize = async (articleContent) => {
  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: \`Summarize the following article in a single paragraph: \${articleContent}\`
      })
    });
    const data = await res.json();
    setSummary(data.result);
  } catch (error) {
    toast.error("AI generation failed: " + error.message);
  }
};`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 font-bold">4</div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900 dark:text-white">Automate via Firebase Cloud Functions (Trigger-based AI)</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  For background AI processing (such as auto-generating Nepal Hub district briefs or cross-linking Saraswati Knowledge Graph entities whenever a new entry is saved), you can use <b>Firebase Functions</b>. Set up a function that automatically listens to Firestore write triggers, calls Gemini, and saves results:
                </p>
                <div className="mt-3 relative group">
                  <pre className="block bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { GoogleGenAI } from "@google/genai";
import { getFirestore } from "firebase-admin/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const onNewKnowledgeEntity = onDocumentCreated("knowledge_base/{entityId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const data = snapshot.data();
  
  // Call Gemini to auto-generate additional related metadata
  const prompt = \`Suggest historical connections or texts related to: \${data.nameNepali} located in \${data.district}\`;
  const response = await ai.models.generateContent({ model: "gemini-3.7-flash", contents: prompt });
  
  // Save result back into document
  await snapshot.ref.update({ aiGeneratedContext: response.text });
});`}
                  </pre>
                </div>
              </div>
            </div>

          </div>
        </div>
      )
    },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center shadow-inner">
                <BookOpen size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-card-foreground tracking-tight uppercase">Setup & Deployment Guide</h1>
                <p className="text-muted-text font-medium">Follow these instructions to set up and deploy your news portal.</p>
              </div>
            </div>
          </div>

          {/* Grid Sections */}
          <div className="grid grid-cols-1 gap-8">
            {sections.map((section, index) => (
              <motion.section
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-[3rem] shadow-xl shadow-muted-area/50 border border-border-theme overflow-hidden"
              >
                <div className="p-8 md:p-12">
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`w-12 h-12 ${section.bg} ${section.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                      <section.icon size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-card-foreground tracking-tight">{section.title}</h2>
                  </div>
                  <div className="text-card-foreground">
                    {section.content}
                  </div>
                </div>
              </motion.section>
            ))}
          </div>

          {/* Footer Help */}
          <div className="bg-card-foreground rounded-[3rem] p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-background/10 text-background dark:text-white rounded-full flex items-center justify-center mx-auto">
              <HelpCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-background dark:text-white tracking-tight">Need more help?</h3>
            <p className="text-background/60 dark:text-muted-text max-w-xl mx-auto font-medium">
              If you encounter any issues during setup or deployment, please refer to the official documentation of the tools mentioned above or contact our support team.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <a href="https://firebase.google.com/docs" target="_blank" className="px-6 py-3 bg-background/5 dark:bg-white/5 hover:bg-background/10 dark:hover:bg-white/10 text-background dark:text-white rounded-2xl font-bold text-sm transition-all border border-background/10 dark:border-none">Firebase Docs</a>
              <a href="https://vercel.com/docs" target="_blank" className="px-6 py-3 bg-background/5 dark:bg-white/5 hover:bg-background/10 dark:hover:bg-white/10 text-background dark:text-white rounded-2xl font-bold text-sm transition-all border border-background/10 dark:border-none">Vercel Docs</a>
              <a href="https://docs.github.com" target="_blank" className="px-6 py-3 bg-background/5 dark:bg-white/5 hover:bg-background/10 dark:hover:bg-white/10 text-background dark:text-white rounded-2xl font-bold text-sm transition-all border border-background/10 dark:border-none">GitHub Docs</a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
