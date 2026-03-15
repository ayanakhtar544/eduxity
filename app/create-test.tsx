"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, Layers, FileSignature, LayoutList, BookOpen, 
  Eye, Rocket, Plus, Trash2, ArrowRight, ArrowLeft, 
  Image as ImageIcon, Bold, Italic, Type, Variable, PlayCircle, Save, Calendar, Shuffle, Ionicons
} from "lucide-react";
import { Switch } from "react-native-gesture-handler";

// ============================================================================
// 🛠️ ENTERPRISE TYPES & INTERFACES
// ============================================================================
type QuestionType = "single_mcq" | "multi_mcq" | "numerical" | "matrix" | "paragraph";

interface Hint {
  id: string;
  text: string;
  type: "concept" | "formula" | "direction";
}

interface Question {
  id: string;
  sectionId: string;
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswer: any;
  hints: Hint[];
  solutionText: string;
  videoUrl: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string;
}

interface Section {
  id: string;
  name: string;
  timeLimit: number; // in minutes
  marksPerQ: number;
  negativeMarks: number;
  totalQs: number;
  mandatoryQs: number;
  instructions: string;
}

interface TestPayload {
  title: string;
  description: string;
  category: string;
  subject: string;
  duration: number;
  language: string;
  sections: Section[];
  questions: Question[];
  settings: {
    randomizeQs: boolean;
    randomizeOptions: boolean;
    sectionRandomization: boolean;
    startTime: string;
    endTime: string;
    maxAttempts: number;
    visibility: "public" | "private" | "institute";
  };
  globalInstructions: string;
}

// ============================================================================
// 🚀 MAIN CREATOR STUDIO COMPONENT
// ============================================================================
export default function EnterpriseTestCreator() {
  const [step, setStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  // 🗄️ GLOBAL STATE FOR THE ENTIRE EXAM
  const [testData, setTestData] = useState<TestPayload>({
    title: "",
    description: "",
    category: "JEE Advanced",
    subject: "Full Syllabus",
    duration: 180,
    language: "English",
    sections: [
      { id: "sec_1", name: "Physics", timeLimit: 60, marksPerQ: 4, negativeMarks: 1, totalQs: 20, mandatoryQs: 20, instructions: "" }
    ],
    questions: [],
    settings: {
      randomizeQs: true,
      randomizeOptions: true,
      sectionRandomization: false,
      startTime: "",
      endTime: "",
      maxAttempts: 1,
      visibility: "private"
    },
    globalInstructions: ""
  });

  const STEPS = [
    { id: 1, icon: Settings, label: "Test Details" },
    { id: 2, icon: Layers, label: "Sections" },
    { id: 3, icon: FileSignature, label: "Questions" },
    { id: 4, icon: LayoutList, label: "Scoring & Limits" },
    { id: 5, icon: BookOpen, label: "Instructions" },
    { id: 6, icon: Eye, label: "Preview" },
    { id: 7, icon: Rocket, label: "Publish" },
  ];

  // ==========================================
  // 🎮 HANDLERS
  // ==========================================
  const updateData = (field: keyof TestPayload, value: any) => {
    setTestData(prev => ({ ...prev, [field]: value }));
  };

  const updateSettings = (field: string, value: any) => {
    setTestData(prev => ({ ...prev, settings: { ...prev.settings, [field]: value } }));
  };

  const autoSaveDraft = () => {
    setIsSaving(true);
    // Simulate API Call to Redis/DB Draft
    setTimeout(() => setIsSaving(false), 800);
  };

  // ==========================================
  // 🎨 STEP RENDERERS
  // ==========================================

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Test Details</h2>
        <p className="text-slate-400 text-sm mt-1">Basic metadata for indexing and discovery.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Test Title *</label>
          <input 
            type="text" 
            value={testData.title}
            onChange={e => updateData("title", e.target.value)}
            onBlur={autoSaveDraft}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700 font-semibold" 
            placeholder="e.g., Target Target JEE Main 2026 - Mock 1" 
          />
        </div>
        
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Syllabus / Description</label>
          <textarea 
            value={testData.description}
            onChange={e => updateData("description", e.target.value)}
            onBlur={autoSaveDraft}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-white focus:border-indigo-500 outline-none min-h-[120px] transition-all placeholder:text-slate-700 resize-none" 
            placeholder="Mention topics covered..." 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Category</label>
          <select value={testData.category} onChange={e => updateData("category", e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-white outline-none appearance-none cursor-pointer">
            <option>JEE Advanced</option><option>JEE Main</option><option>NEET UG</option><option>CBSE Board</option><option>UPSC CSE</option><option>Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Language</label>
          <select value={testData.language} onChange={e => updateData("language", e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-white outline-none appearance-none cursor-pointer">
            <option>English</option><option>Hindi</option><option>Bilingual (Eng + Hin)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Section Architecture</h2>
          <p className="text-slate-400 text-sm mt-1">Define complex internal choices (e.g. attempt 5 out of 10).</p>
        </div>
        <button 
          onClick={() => setTestData(p => ({...p, sections: [...p.sections, {id: `sec_${Date.now()}`, name: "New Section", timeLimit: 0, marksPerQ: 4, negativeMarks: 1, totalQs: 10, mandatoryQs: 10, instructions: ""}]}))}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
        >
          <Plus size={16}/> Add Section
        </button>
      </div>

      {testData.sections.map((sec, idx) => (
        <div key={sec.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl relative group">
          {testData.sections.length > 1 && (
            <button onClick={() => setTestData(p => ({...p, sections: p.sections.filter(s => s.id !== sec.id)}))} className="absolute top-4 right-4 text-slate-600 hover:text-red-500 transition-colors">
              <Trash2 size={18}/>
            </button>
          )}
          
          <h3 className="text-lg font-bold text-indigo-400 mb-4">Section {String.fromCharCode(65 + idx)}</h3>
          
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-3 md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Section Name</label>
              <input type="text" value={sec.name} onChange={e => { const s = [...testData.sections]; s[idx].name = e.target.value; setTestData({...testData, sections: s}) }} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Total Questions</label>
              <input type="number" value={sec.totalQs} onChange={e => { const s = [...testData.sections]; s[idx].totalQs = Number(e.target.value); setTestData({...testData, sections: s}) }} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Mandatory To Attempt</label>
              <input type="number" value={sec.mandatoryQs} onChange={e => { const s = [...testData.sections]; s[idx].mandatoryQs = Number(e.target.value); setTestData({...testData, sections: s}) }} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500" />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-emerald-500 mb-2 uppercase">+ Marks per Q</label>
              <input type="number" value={sec.marksPerQ} onChange={e => { const s = [...testData.sections]; s[idx].marksPerQ = Number(e.target.value); setTestData({...testData, sections: s}) }} className="w-full bg-slate-950 border border-emerald-900/50 rounded-lg p-3 text-emerald-400 text-sm font-bold outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-red-500 mb-2 uppercase">- Negative Marks</label>
              <input type="number" value={sec.negativeMarks} onChange={e => { const s = [...testData.sections]; s[idx].negativeMarks = Number(e.target.value); setTestData({...testData, sections: s}) }} className="w-full bg-slate-950 border border-red-900/50 rounded-lg p-3 text-red-400 text-sm font-bold outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Strict Time Limit (Mins)</label>
              <input type="number" value={sec.timeLimit} onChange={e => { const s = [...testData.sections]; s[idx].timeLimit = Number(e.target.value); setTestData({...testData, sections: s}) }} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm outline-none placeholder:text-slate-700" placeholder="0 = No limit" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Advanced Question Builder</h2>
          <p className="text-slate-400 text-sm mt-1">Rich Text, LaTeX ($$), and Deep Tagging Supported.</p>
        </div>
      </div>

      {testData.sections.map(sec => (
        <div key={sec.id} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-slate-800 flex-1" />
            <h3 className="text-slate-300 font-bold uppercase tracking-widest text-xs px-2">{sec.name}</h3>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Question Editor Mock (TipTap Style Toolbar) */}
            <div className="bg-slate-900 border-b border-slate-800 p-3 flex gap-2 overflow-x-auto">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><Bold size={16}/></button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><Italic size={16}/></button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded"><Type size={16}/></button>
              <div className="w-px h-6 bg-slate-700 my-auto mx-2" />
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-400 hover:bg-indigo-900/30 rounded border border-indigo-900/50">
                <Variable size={14}/> Add LaTeX Math
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-900/30 rounded border border-emerald-900/50">
                <ImageIcon size={14}/> Upload Diagram
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between mb-4">
                <span className="bg-indigo-900/30 text-indigo-400 px-3 py-1 rounded text-xs font-black">Q1</span>
                <select className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-md outline-none text-slate-300">
                  <option value="single_mcq">Single Correct MCQ</option>
                  <option value="multi_mcq">Multiple Correct MCQ</option>
                  <option value="numerical">Integer / Numerical</option>
                  <option value="matrix">Matrix Match (JEE Adv)</option>
                  <option value="paragraph">Paragraph Based</option>
                </select>
              </div>

              <textarea 
                className="w-full bg-transparent text-white text-lg outline-none min-h-[120px] resize-none placeholder:text-slate-700" 
                placeholder="Draft question statement here. Use $$ for math equations..." 
              />

              {/* MCQ Options Builder */}
              <div className="space-y-3 mt-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Options & Answer Key</p>
                {[0,1,2,3].map((opt) => (
                  <div key={opt} className="flex items-center gap-3 bg-slate-950/50 border border-slate-800 p-2 rounded-xl focus-within:border-indigo-500">
                    <button className="w-6 h-6 rounded-full border-2 border-slate-600 hover:border-indigo-500 flex-shrink-0 flex items-center justify-center">
                      {opt === 0 && <div className="w-3 h-3 bg-indigo-500 rounded-full" />}
                    </button>
                    <input type="text" className="flex-1 bg-transparent text-sm text-white outline-none" placeholder={`Option ${String.fromCharCode(65+opt)}`} />
                    <button className="text-slate-600 hover:text-white p-2"><ImageIcon size={16}/></button>
                  </div>
                ))}
              </div>

              {/* Hints & Solutions System */}
              <div className="mt-8 border-t border-slate-800 pt-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Deep Learning Assets</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-500 mb-2"><Ionicons name="bulb" size={14}/> Concept Hint</label>
                    <input type="text" className="w-full bg-transparent text-sm text-slate-300 outline-none" placeholder="e.g. Use Conservation of Momentum" />
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-rose-500 mb-2"><Variable size={14}/> Formula Hint</label>
                    <input type="text" className="w-full bg-transparent text-sm text-slate-300 outline-none" placeholder="e.g. m1v1 = m2v2" />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4 focus-within:border-emerald-500 transition-colors">
                  <label className="block text-xs font-bold text-emerald-500 mb-2">Step-by-Step Solution</label>
                  <textarea className="w-full bg-transparent text-sm text-slate-300 outline-none min-h-[80px] resize-none" placeholder="Explain the detailed solution here..." />
                </div>

                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <PlayCircle size={18} className="text-red-500"/>
                  <input type="text" className="flex-1 bg-transparent text-sm text-slate-300 outline-none" placeholder="Paste Video Solution URL (YouTube/Vimeo)" />
                </div>
              </div>

              {/* Tagging */}
              <div className="flex gap-4 mt-6">
                <input type="text" className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="Topic Tag (e.g. Thermodynamics)" />
                <select className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 outline-none cursor-pointer">
                  <option>Medium</option><option>Easy</option><option>Hard</option>
                </select>
              </div>

            </div>
          </div>
          
          <button className="mt-4 flex items-center justify-center gap-2 w-full py-4 border border-dashed border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-400 hover:border-indigo-500 hover:bg-indigo-900/10 transition-all font-bold text-sm">
            <Plus size={18} /> Add New Question to {sec.name}
          </button>
        </div>
      ))}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center py-10">
        <div className="w-20 h-20 bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Eye size={40} className="text-indigo-400" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-4">Preview NTA Interface</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
          Verify how the exam will look to the students on the actual CBT engine before publishing.
        </p>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20 inline-flex items-center gap-3">
          <PlayCircle size={20} /> Launch Preview Engine
        </button>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Scheduling & Deployment</h2>
        <p className="text-slate-400 text-sm mt-1">Configure randomization, visibility and strict timers.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2"><Shuffle size={16} className="text-indigo-400"/> Deterministic Randomization</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-200 text-sm">Shuffle Question Order</p>
                <p className="text-xs text-slate-500 mt-1">Uses a secure backend salt to prevent sequence prediction.</p>
              </div>
              <Switch value={testData.settings.randomizeQs} onValueChange={(v) => updateSettings('randomizeQs', v)} trackColor={{true: '#4f46e5', false: '#334155'}} />
            </div>
            <div className="h-px bg-slate-800 w-full" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-200 text-sm">Shuffle Option Sequence</p>
                <p className="text-xs text-slate-500 mt-1">Randomizes A,B,C,D options globally.</p>
              </div>
              <Switch value={testData.settings.randomizeOptions} onValueChange={(v) => updateSettings('randomizeOptions', v)} trackColor={{true: '#4f46e5', false: '#334155'}} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-2"><Calendar size={14}/> Portal Opens At</label>
          <input type="datetime-local" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500" />
        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-2"><Calendar size={14}/> Portal Closes At</label>
          <input type="datetime-local" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500" />
        </div>

        <div className="col-span-2">
          <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-5 rounded-xl font-black text-lg transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-3 uppercase tracking-widest">
            <Rocket size={24} /> Deploy Enterprise Exam
          </button>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 🖥️ MAIN LAYOUT STRUCTURE
  // ==========================================
  return (
    <div className="flex min-h-screen bg-slate-950 font-sans selection:bg-indigo-500/30">
      
      {/* 📍 LEFT SIDEBAR WIZARD */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col h-screen sticky top-0 hidden md:flex z-20">
        <div className="text-2xl font-black text-white mb-2 tracking-tighter">EDUXITY<span className="text-indigo-500">.</span></div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-10">Creator Studio</p>
        
        <div className="space-y-2 flex-1">
          {STEPS.map((s, idx) => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <button 
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all relative ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : isCompleted ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-800 hover:text-slate-400'}`}
              >
                <s.icon size={18} className={isActive ? 'text-white' : isCompleted ? 'text-indigo-400' : 'text-slate-600'} />
                {s.label}
                {isCompleted && !isActive && <div className="absolute right-4 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
              </button>
            )
          })}
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-xs font-bold text-slate-500">{isSaving ? 'Saving Draft...' : 'Draft Saved'}</span>
          </div>
          <button className="text-slate-400 hover:text-white"><Save size={16}/></button>
        </div>
      </div>

      {/* 📍 RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-20">
          <div className="text-lg font-black text-white">EDUXITY<span className="text-indigo-500">.</span></div>
          <span className="text-xs font-bold bg-indigo-900/30 text-indigo-400 px-3 py-1 rounded-full">Step {step} of 7</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 pb-32">
          <div className="max-w-4xl mx-auto w-full">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {/* Step 4 & 5 Mocked for brevity in UI, but handled in state */}
            {step === 4 && <div className="text-center py-20 text-slate-500">Scoring Configurations (Global Overrides) Go Here</div>}
            {step === 5 && <div className="text-center py-20 text-slate-500">Global Instructions Rich Text Editor Goes Here</div>}
            {step === 6 && renderStep6()}
            {step === 7 && renderStep7()}
          </div>
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 p-4 md:px-10 flex justify-between items-center sticky bottom-0 z-20">
          <button 
            onClick={() => setStep(p => Math.max(1, p - 1))}
            disabled={step === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${step === 1 ? 'opacity-0 cursor-default' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <ArrowLeft size={16}/> Previous
          </button>
          
          <div className="hidden md:flex gap-1">
            {[1,2,3,4,5,6,7].map(i => <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'}`} /> )}
          </div>

          <button 
            onClick={() => setStep(p => Math.min(7, p + 1))}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-black transition-all shadow-lg ${step === 7 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-950 hover:bg-indigo-50 hover:text-indigo-600 shadow-white/10 hover:scale-105'}`}
            disabled={step === 7}
          >
            Next Step <ArrowRight size={16}/>
          </button>
        </div>

      </div>
    </div>
  );
}