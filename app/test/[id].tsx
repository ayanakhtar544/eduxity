"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Clock, AlertTriangle, Maximize, CheckCircle2, User, 
  HelpCircle, ChevronLeft, ChevronRight, Save, XCircle, Flag, Bookmark
} from "lucide-react";

// ============================================================================
// 🛠️ ENTERPRISE TYPES & INTERFACES
// ============================================================================
type QStatus = "not_visited" | "not_answered" | "answered" | "marked" | "answered_marked";
type QType = "single_mcq" | "multi_mcq" | "numerical" | "matrix";

interface Question {
  id: string;
  sectionId: string;
  type: QType;
  text: string;
  options?: string[];
  imageUrl?: string;
}

interface Section {
  id: string;
  name: string;
  totalQs: number;
}

interface ExamPayload {
  id: string;
  title: string;
  duration: number; // in minutes
  sections: Section[];
  questions: Question[];
  settings: {
    antiCheat: boolean;
    requireFullscreen: boolean;
  };
}

// ============================================================================
// 🧠 CUSTOM HOOK: PROCTORING & ANTI-CHEAT ENGINE
// ============================================================================
const useProctoring = (isActive: boolean, onViolation: (reason: string, severity: number) => void) => {
  useEffect(() => {
    if (!isActive || typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.hidden) onViolation("Tab Switch / Window Minimized", 2);
    };

    const handleContextMenu = (e: Event) => { e.preventDefault(); onViolation("Right Click Disabled", 1); };
    const handleCopy = (e: Event) => { e.preventDefault(); onViolation("Copy Attempt Detected", 3); };
    const handlePaste = (e: Event) => { e.preventDefault(); onViolation("Paste Attempt Detected", 3); };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        if (e.key === "c" || e.key === "v" || e.key === "Tab") {
          e.preventDefault();
          onViolation("Restricted Keyboard Shortcut Used", 2);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);

    // Prevent leaving page accidentally
    window.onbeforeunload = () => "Exam is in progress. Leaving will submit your current state.";

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
      window.onbeforeunload = null;
    };
  }, [isActive, onViolation]);
};

// ============================================================================
// 🚀 MAIN CBT EXAM COMPONENT
// ============================================================================
export default function CBTEngine({ params }: { params: { id: string } }) {
  // --- 🗄️ CORE STATE ---
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamPayload | null>(null);
  
  // --- 🎮 EXAM STATE ---
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [activeQIndex, setActiveQIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // --- 📝 RESPONSES & STATUS ---
  // answers: { questionId: answerValue }
  const [answers, setAnswers] = useState<Record<string, any>>({});
  // qStatus: { questionId: "answered" | "not_visited" | ... }
  const [qStatus, setQStatus] = useState<Record<string, QStatus>>({});
  
  // --- 🚨 SECURITY STATE ---
  const [warnings, setWarnings] = useState<number>(0);
  const [warningMsg, setWarningMsg] = useState<string>("");

  // ==========================================
  // 📡 INITIALIZATION & SESSION RECOVERY
  // ==========================================
  useEffect(() => {
    // 1. Fetch Exam Payload from Server (Simulated)
    const fetchExam = async () => {
      // API Call goes here: const res = await fetch(`/api/exams/${params.id}`);
      const mockPayload: ExamPayload = {
        id: params.id,
        title: "JEE Advanced 2026 - Paper 1 (CBT Mock)",
        duration: 180, // 3 hours
        sections: [
          { id: "sec_1", name: "Physics", totalQs: 20 },
          { id: "sec_2", name: "Chemistry", totalQs: 20 },
          { id: "sec_3", name: "Mathematics", totalQs: 20 },
        ],
        questions: Array.from({ length: 60 }).map((_, i) => ({
          id: `q_${i}`,
          sectionId: i < 20 ? "sec_1" : i < 40 ? "sec_2" : "sec_3",
          type: "single_mcq",
          text: `Sample mathematical question ${i + 1}. If a particle moves in a straight line... Calculate the velocity.`,
          options: ["Option A: 25 m/s", "Option B: 50 m/s", "Option C: 75 m/s", "Option D: 100 m/s"],
        })),
        settings: { antiCheat: true, requireFullscreen: true }
      };

      // 2. OFFLINE SESSION RECOVERY (Loophole Fix)
      const localSession = localStorage.getItem(`exam_session_${params.id}`);
      if (localSession) {
        const { savedAnswers, savedStatus, savedTimeLeft } = JSON.parse(localSession);
        setAnswers(savedAnswers);
        setQStatus(savedStatus);
        setTimeLeft(savedTimeLeft);
        console.log("🔥 Session Recovered from IndexedDB/LocalStorage");
      } else {
        // Fresh Start
        const initStatus: Record<string, QStatus> = {};
        mockPayload.questions.forEach((q, idx) => {
          initStatus[q.id] = idx === 0 ? "not_answered" : "not_visited";
        });
        setQStatus(initStatus);
        setTimeLeft(mockPayload.duration * 60);
      }

      setExam(mockPayload);
      setActiveSectionId(mockPayload.sections[0].id);
      setLoading(false);
    };

    fetchExam();
  }, [params.id]);

  // ==========================================
  // ⏱️ TIMER & AUTOSAVE ENGINE
  // ==========================================
  useEffect(() => {
    if (!exam) return;
    
    // Master Clock
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam("Time Exhausted. Auto-submitting paper...");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 5-Second Autosave Loop (DDoS Protected by Redis on Backend)
    const autosave = setInterval(() => {
      syncToServer();
    }, 5000);

    return () => { clearInterval(timer); clearInterval(autosave); };
  }, [exam, answers, qStatus]);

  const syncToServer = useCallback(async () => {
    // 1. Save to Local Storage for instant offline recovery
    localStorage.setItem(`exam_session_${params.id}`, JSON.stringify({
      savedAnswers: answers, savedStatus: qStatus, savedTimeLeft: timeLeft
    }));
    // 2. Fire and forget API call to Redis endpoint
    // await fetch('/api/autosave', { method: 'POST', body: JSON.stringify({ answers, qStatus }) });
  }, [answers, qStatus, timeLeft, params.id]);

  // ==========================================
  // 🚨 PROCTORING HANDLER
  // ==========================================
  useProctoring(!!exam?.settings.antiCheat, (reason, severity) => {
    setWarnings((prev) => {
      const newWarnings = prev + severity;
      if (newWarnings >= 10) {
        submitExam("Exam Suspended: Critical Security Violation Detected.", true);
      } else {
        setWarningMsg(`${reason}. Warning Level: ${newWarnings}/10`);
      }
      return newWarnings;
    });
  });

  // ==========================================
  // 🎮 NAVIGATION & LOGIC
  // ==========================================
  const activeQuestions = exam?.questions.filter(q => q.sectionId === activeSectionId) || [];
  const currentQ = activeQuestions[activeQIndex];

  const changeQuestion = (newIndex: number) => {
    // Mark current as not_answered if it was not_visited and we are leaving it without answering
    if (!answers[currentQ.id] && qStatus[currentQ.id] === "not_visited") {
      setQStatus(p => ({ ...p, [currentQ.id]: "not_answered" }));
    }
    
    // Move to new
    setActiveQIndex(newIndex);
    const newQId = activeQuestions[newIndex].id;
    if (qStatus[newQId] === "not_visited" || !qStatus[newQId]) {
      setQStatus(p => ({ ...p, [newQId]: "not_answered" }));
    }
  };

  const handleAnswerSelect = (val: any) => {
    setAnswers(p => ({ ...p, [currentQ.id]: val }));
    // Immediately auto-save on option click (Trigger 1)
    setTimeout(syncToServer, 0); 
  };

  const handleSaveAndNext = () => {
    const hasAns = answers[currentQ.id] !== undefined && answers[currentQ.id] !== "";
    setQStatus(p => ({ ...p, [currentQ.id]: hasAns ? "answered" : "not_answered" }));
    if (activeQIndex < activeQuestions.length - 1) changeQuestion(activeQIndex + 1);
  };

  const handleMarkReview = () => {
    const hasAns = answers[currentQ.id] !== undefined && answers[currentQ.id] !== "";
    setQStatus(p => ({ ...p, [currentQ.id]: hasAns ? "answered_marked" : "marked" }));
    if (activeQIndex < activeQuestions.length - 1) changeQuestion(activeQIndex + 1);
  };

  const handleClearResponse = () => {
    const newAns = { ...answers };
    delete newAns[currentQ.id];
    setAnswers(newAns);
    setQStatus(p => ({ ...p, [currentQ.id]: "not_answered" }));
  };

  const submitExam = (msg: string = "Exam Submitted Successfully.", isKicked = false) => {
    // 1. Clear local storage so they can't resume
    localStorage.removeItem(`exam_session_${params.id}`);
    // 2. Final API Call
    alert(msg);
    // 3. Redirect to Analytics Page (Phase 5)
    // router.push(`/analytics/${params.id}`);
  };

  // ==========================================
  // 🎨 UI HELPERS
  // ==========================================
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPaletteColor = (status: QStatus) => {
    switch (status) {
      case "answered": return "bg-emerald-500 border-emerald-600 text-white";
      case "not_answered": return "bg-red-500 border-red-600 text-white";
      case "marked": return "bg-purple-600 border-purple-700 text-white";
      case "answered_marked": return "bg-purple-600 border-purple-700 text-white relative"; // Needs inner green dot
      default: return "bg-gray-200 border-gray-300 text-gray-700"; // not_visited
    }
  };

  // ==========================================
  // 🖥️ RENDER ENGINE
  // ==========================================
  if (loading || !exam) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">Initializing Secure CBT Environment...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans select-none">
      
      {/* 🚨 WARNING OVERLAY */}
      {warningMsg && (
        <div className="fixed inset-0 z-50 bg-red-950/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
          <AlertTriangle size={80} className="text-red-500 mb-6 animate-pulse" />
          <h1 className="text-4xl font-black text-white mb-2 text-center">Security Violation Detected</h1>
          <p className="text-xl text-red-200 font-semibold mb-8 text-center max-w-2xl">{warningMsg}</p>
          <button onClick={() => setWarningMsg("")} className="bg-white text-red-900 px-8 py-4 rounded-xl font-black text-lg hover:scale-105 transition-transform">
            I Understand, Return to Exam
          </button>
        </div>
      )}

      {/* 🔝 TOP BAR (INFO & TIMER) */}
      <header className="bg-slate-900 text-white shadow-md z-20 shrink-0">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><Maximize size={18} /></div>
            <h1 className="font-bold text-lg tracking-wide hidden md:block">{exam.title}</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-300">Candidate ID: {params.id.substring(0,6)}</span>
            </div>
            <button className="bg-slate-800 p-2 rounded-md hover:bg-slate-700 transition-colors"><HelpCircle size={18} /></button>
          </div>
        </div>
        
        {/* TIMER BAR */}
        <div className="flex justify-between items-center px-6 py-2 bg-slate-800/50">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {exam.sections.map(sec => (
              <button 
                key={sec.id} 
                onClick={() => { setActiveSectionId(sec.id); setActiveQIndex(0); }}
                className={`px-4 py-1.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${activeSectionId === sec.id ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'text-slate-400 hover:bg-slate-700'}`}
              >
                {sec.name}
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 font-black tracking-widest ${timeLeft < 300 ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-slate-900 border-slate-700 text-emerald-400'}`}>
            <Clock size={16} /> {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* 🧩 MAIN WORKSPACE (LEFT: PALETTE, RIGHT: QUESTION) */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* 📍 LEFT SIDE: QUESTION PALETTE */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.03)] hidden lg:flex">
          
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Palette Status</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[10px] font-bold text-slate-600">
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-md bg-emerald-500 border border-emerald-600 shadow-sm" /> Answered</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-t-md rounded-b-[10px] bg-red-500 border border-red-600 shadow-sm" /> Not Answered</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-md bg-gray-200 border border-gray-300 shadow-sm" /> Not Visited</div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-purple-600 border border-purple-700 shadow-sm" /> Marked</div>
              <div className="flex items-center gap-2 col-span-2"><div className="w-5 h-5 rounded-full bg-purple-600 border border-purple-700 relative shadow-sm"><div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-[1.5px] border-white" /></div> Answered & Marked for Review</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-800">{exam.sections.find(s=>s.id === activeSectionId)?.name}</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {activeQuestions.map((q, idx) => {
                const stat = qStatus[q.id] || "not_visited";
                let shapeClass = "rounded-md"; // Default square
                if (stat === "not_answered") shapeClass = "rounded-t-md rounded-b-[10px]";
                if (stat === "answered") shapeClass = "rounded-t-[10px] rounded-b-md";
                if (stat === "marked" || stat === "answered_marked") shapeClass = "rounded-full";

                return (
                  <button 
                    key={q.id}
                    onClick={() => jumpToQuestion(idx)}
                    className={`h-10 flex items-center justify-center font-bold text-sm border shadow-sm transition-all hover:scale-105 ${getPaletteColor(stat)} ${shapeClass} ${activeQIndex === idx ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 z-10' : ''}`}
                  >
                    {idx + 1}
                    {stat === "answered_marked" && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <button onClick={() => submitExam("Are you sure you want to final submit?")} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_4px_12px_rgba(5,150,105,0.3)] transition-all">
              Submit Test
            </button>
          </div>
        </aside>

        {/* 📍 CENTER/RIGHT: QUESTION DISPLAY AREA */}
        <section className="flex-1 flex flex-col bg-white">
          
          <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 shrink-0">
            <h2 className="text-xl font-black text-blue-600">Question {activeQIndex + 1}</h2>
            <div className="flex gap-2">
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-md uppercase">Marks: +4</span>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-md uppercase">-1</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
              
              {/* Question Statement */}
              <div className="mb-8">
                <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed">
                  {currentQ.text}
                </p>
                {/* Image Placeholder (if any) */}
                {currentQ.imageUrl && (
                  <div className="mt-6 w-full h-64 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center">
                    <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Image Area</span>
                  </div>
                )}
              </div>

              <hr className="border-slate-100 mb-8" />

              {/* Options Engine */}
              <div className="space-y-4">
                {currentQ.type === "single_mcq" && currentQ.options?.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === idx;
                  return (
                    <button 
                      key={idx} 
                      onClick={() => handleAnswerSelect(idx)}
                      className={`w-full flex items-center gap-4 p-4 md:p-5 rounded-xl border-2 transition-all text-left ${isSelected ? 'border-blue-600 bg-blue-50 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-600' : 'border-slate-400'}`}>
                        {isSelected && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                      </div>
                      <span className={`text-base font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{opt}</span>
                    </button>
                  );
                })}

                {currentQ.type === "numerical" && (
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 max-w-sm">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Enter Numeric Value</label>
                    <input 
                      type="number" 
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => handleAnswerSelect(e.target.value)}
                      className="w-full bg-white border-2 border-slate-300 rounded-xl p-4 text-2xl font-black text-center text-slate-800 focus:border-blue-600 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 📍 BOTTOM: NAVIGATION CONTROLS */}
          <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
            <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
              
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={handleMarkReview} className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-6 py-3.5 rounded-xl font-bold text-sm transition-colors border border-purple-200">
                  <Bookmark size={16} /> Mark for Review & Next
                </button>
                <button onClick={handleClearResponse} className="flex justify-center items-center bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3.5 rounded-xl font-bold text-sm transition-colors border border-slate-200">
                  Clear
                </button>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => activeQIndex > 0 && jumpToQuestion(activeQIndex - 1)} disabled={activeQIndex === 0} className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-colors border ${activeQIndex === 0 ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={handleSaveAndNext} className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-black text-sm shadow-[0_4px_12px_rgba(5,150,105,0.3)] transition-all">
                  Save & Next <ChevronRight size={16} />
                </button>
              </div>

            </div>
          </div>

        </section>
      </main>
    </div>
  );
}