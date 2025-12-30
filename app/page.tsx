import Link from "next/link";
import StartCta from "@/components/StartCta";
import { ArrowRight, Bot, Zap, Braces, Sparkles, Database, Code, Terminal, Cpu, CheckCircle2, XCircle, ChevronRight, Layers, Gauge, Share2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-black selection:bg-blue-500/30">
      {/* Background Animation blobs - Intensified */}
      <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-[500px] h-[500px] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/2 w-[600px] h-[600px] bg-pink-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-4000 transform -translate-x-1/2"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 flex flex-col items-center">

        {/* HERO */}
        <section className="w-full py-24 md:py-32 lg:py-48 flex flex-col items-center text-center px-4">
          <div className="container max-w-5xl mx-auto space-y-8 relative">

            {/* Spotlight Effect behind text */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none">
              <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 drop-shadow-2xl">
              The IDE for <br className="hidden md:block" />
              <span className="text-gradient hover:animate-pulse cursor-default">Prompt Engineering</span>
            </h1>

            <p className="mx-auto max-w-[800px] text-zinc-400 md:text-xl font-light leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Stop guessing. Start engineering. A professional environment to structure, evaluate, and version-control your prompts against <span className="text-blue-400 font-medium">Gemini</span>, <span className="text-purple-400 font-medium">Llama</span>, and <span className="text-pink-400 font-medium">Qwen</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8 animate-in fade-in zoom-in-50 duration-1000 delay-300">
              <StartCta />
            </div>
          </div>
        </section>

        {/* VISUAL DEMO SECTION - "Designful Data" with Tilt/Interaction */}
        <section className="w-full pb-24 px-4 perspective-1000">
          <div className="container max-w-6xl mx-auto">
            <div className="relative glass-card rounded-xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 hover:shadow-[0_0_100px_-20px_rgba(59,130,246,0.2)] transition-shadow duration-700">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="text-xs text-zinc-500 font-mono ml-2 flex items-center gap-2">
                  echoprompt_studio.tsx <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                <div className="p-8 bg-zinc-950/50 border-r border-white/5 space-y-4 font-mono">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
                    <Terminal className="w-4 h-4" />
                    <span>Input Protocol</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors cursor-text group">
                      <span className="text-purple-400 group-hover:text-purple-300">const role =</span> <span className="text-green-300">"Senior DevOps Engineer"</span>;
                    </div>
                    <div className="p-3 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors cursor-text group">
                      <span className="text-blue-400 group-hover:text-blue-300">const task =</span> <span className="text-green-300">"Explain Kubernetes Pods"</span>;
                    </div>
                    <div className="p-3 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors cursor-text group">
                      <span className="text-yellow-400 group-hover:text-yellow-300">const context =</span> <span className="text-green-300">"Audience: Junior Devs"</span>;
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-black/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                    <Cpu className="w-32 h-32 text-blue-500 rotate-12" />
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span>Optimized Output</span>
                  </div>
                  <div className="p-4 rounded bg-blue-500/5 border border-blue-500/20 text-blue-100 font-mono text-xs leading-relaxed group-hover:bg-blue-500/10 transition-colors duration-500">
                    <span className="text-zinc-500"># System Prompt Generated</span><br />
                    <span className="typing-effect">You are an expert DevOps engineer. Your goal is to explain...</span><br /><br />
                    <span className="text-purple-400">Constraint 1:</span> Avoid jargon unless defined.<br />
                    <span className="text-purple-400">Constraint 2:</span> Use JSON format for final summary.<br />
                    <div className="mt-4 flex items-center gap-2 text-green-400 text-xs">
                      <Zap className="w-3 h-3" />
                      <span>Optimized by Gemini 2.0 (98ms)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON SECTION */}
        <section className="w-full py-24 bg-zinc-950/80 border-t border-white/5">
          <div className="container px-4 mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Evolution of Prompting</h2>
              <p className="text-zinc-400">Why professionals are switching to structured engineering.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* The Old Way */}
              <div className="p-8 rounded-3xl border border-red-500/10 bg-red-950/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50"></div>
                <h3 className="text-xl font-bold text-red-200 mb-6 flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> The Manual Way
                </h3>
                <ul className="space-y-4 text-zinc-400">
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-700 mt-1 shrink-0" />
                    <span>Guessing parameters and tone blindly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-700 mt-1 shrink-0" />
                    <span>Pasting context repeatedly into chat windows</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-700 mt-1 shrink-0" />
                    <span>No version history or fallback options</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-700 mt-1 shrink-0" />
                    <span>Manually testing one model at a time</span>
                  </li>
                </ul>
              </div>

              {/* The EchoPrompt Way */}
              <div className="p-8 rounded-3xl border border-blue-500/20 bg-blue-950/10 relative overflow-hidden glass-card">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                <h3 className="text-xl font-bold text-blue-200 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> The EchoPrompt Way
                </h3>
                <ul className="space-y-4 text-zinc-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                    <span>Deterministic parameter control (Temp, Tokens)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                    <span>Auto-generated System Prompts via Gemini</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                    <span>Immutable history with JSON/PDF export</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                    <span>Batch test against Llama, Qwen, and Mistral</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW STEPS */}
        <section className="w-full py-24 bg-black relative">
          <div className="flex flex-col items-center gap-4 text-center mb-16">
            <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-mono text-zinc-400">WORKFLOW_SEQUENCE.INIT()</div>
            <h2 className="text-3xl md:text-5xl font-bold text-white">From Idea to <span className="text-gradient">Production</span></h2>
          </div>

          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-900 to-transparent"></div>

              {/* Step 1 */}
              <div className="relative flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-black border-4 border-zinc-800 flex items-center justify-center relative z-10 group hover:border-blue-500 transition-colors duration-500">
                  <Layers className="w-10 h-10 text-zinc-500 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white">1. Structure</h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
                  Define inputs like Role, Task, and Constraints using our structured IDE. No more blank canvas paralysis.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-black border-4 border-zinc-800 flex items-center justify-center relative z-10 group hover:border-purple-500 transition-colors duration-500">
                  <Gauge className="w-10 h-10 text-zinc-500 group-hover:text-purple-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white">2. Optimize</h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
                  Run the prompt through our Semantic Parser. Get a Logic Score (0-100) and auto-fix suggestions instantly.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-black border-4 border-zinc-800 flex items-center justify-center relative z-10 group hover:border-green-500 transition-colors duration-500">
                  <Share2 className="w-10 h-10 text-zinc-500 group-hover:text-green-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white">3. Deploy</h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
                  Save to your personal library, export as JSON for your API, or share the template with your team.
                </p>
              </div>
            </div>
          </div>
        </section>



        {/* POWER USER CONTROL SECTION - "The Control Panel" */}
        <section className="w-full py-20 bg-gradient-to-b from-black to-zinc-950 border-t border-white/5 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-[100%] blur-[100px] pointer-events-none"></div>

          <div className="container px-4 mx-auto relative z-10 flex flex-col md:flex-row items-center gap-16">
            {/* Text Content */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-sm uppercase tracking-widest">
                <Gauge className="w-4 h-4" /> Fine-Grained Control
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Master the <span className="text-gradient">Chaos</span>.
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed">
                LLMs are powerful but unpredictable. Advanced Mode gives you the levers to control the entropy.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Temperature (0.0 - 1.0)</h4>
                    <p className="text-sm text-zinc-500">Dial down to 0.1 for rigorous code generation, or crank to 0.9 for creative storytelling.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Token Limits</h4>
                    <p className="text-sm text-zinc-500">Precise budget control for output length. Prevent rambling or ensure deep dives.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Widget */}
            <div className="flex-1 w-full max-w-md">
              <div className="p-1 rounded-2xl bg-gradient-to-br from-indigo-500/50 to-purple-500/50">
                <div className="bg-black rounded-xl p-6 border border-white/10 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-white font-bold flex items-center gap-2"><Cpu className="w-4 h-4 text-indigo-400" /> Model Config</span>
                    <span className="text-xs text-green-500 font-mono">ACTIVE</span>
                  </div>

                  {/* Faux Slider */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Temperature</span>
                      <span className="text-white font-mono">0.7</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full w-[70%] bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-600 uppercase tracking-wider">
                      <span>Deterministic</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  {/* Faux Input */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Max Tokens</span>
                      <span className="text-white font-mono">2048</span>
                    </div>
                    <div className="px-3 py-2 bg-zinc-900 rounded border border-zinc-800 text-xs font-mono text-zinc-500 flex justify-between">
                      <span>buffer_size</span>
                      <span>2048</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID (Previously Added) - Kept for density */}
        <section className="w-full py-20 bg-zinc-950/30 border-t border-white/5">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group p-8 rounded-3xl border border-zinc-800 hover:border-blue-500/30 bg-zinc-900/20 hover:bg-zinc-900/80 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                  <Braces className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">Semantic Analysis</h3>
                <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                  Our parser checks for ambiguity and context holes before execution.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group p-8 rounded-3xl border border-zinc-800 hover:border-purple-500/30 bg-zinc-900/20 hover:bg-zinc-900/80 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">Auto-Optimization</h3>
                <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                  One-click refactoring of basic drafts into production-grade system prompts.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group p-8 rounded-3xl border border-zinc-800 hover:border-orange-500/30 bg-zinc-900/20 hover:bg-zinc-900/80 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">Multi-Model Arena</h3>
                <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                  Test against LLaMA, Mixtral, and Gemini simultaneously in one view.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-12 w-full shrink-0 border-t border-white/5 bg-black">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-500">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            <p className="text-sm text-zinc-500">© 2025 EchoPrompt</p>
          </div>
        </div>
      </footer>
    </div >
  );
}

