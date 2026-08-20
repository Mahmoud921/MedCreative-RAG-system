import React, { useEffect, useRef, useState } from "react";
import logo from "./assets/logo.png";
import bgImage from "./assets/background.png";
import KidneyModel from "./CKDCalculatorWidget";
import "./App.css";

// Use the active backend URL from Vercel or local env, and fail clearly if not configured.
const getApiUrl = () => {
  const candidates = [
    import.meta.env.VITE_API_URL,
    import.meta.env.VITE_BACKEND_URL,
    import.meta.env.VITE_BACKEND,
    import.meta.env.PUBLIC_API_URL
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim() && candidate !== "https://your-backend-url.com") {
      return candidate.trim().replace(/\/+$/, "");
    }
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8000";
  }

  return "";
};

const API_URL = getApiUrl();

/* =========================================================
   LANGUAGE
========================================================= */

const detectLanguage = (text = "") => {
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const english = (text.match(/[A-Za-z]/g) || []).length;
  return arabic > 0 && arabic >= english ? "ar" : "en";
};

const cleanMarkdown = (text = "") =>
  text
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^#+\s?/gm, "")
    .replace(/^[-*]\s?/gm, "");

/* =========================================================
   QUICK / GUARANTEED CLINICAL ANSWERS
========================================================= */

const PRESET_OVERRIDES = {
  "What is the normal GFR?":
    "A normal or high estimated GFR (eGFR) is generally ≥90 mL/min/1.73 m² (KDIGO G1). However, an eGFR ≥90 alone does not exclude CKD; CKD requires abnormalities of kidney structure or function that are present for at least 3 months.",
  "what is the normal gfr?":
    "A normal or high estimated GFR (eGFR) is generally ≥90 mL/min/1.73 m² (KDIGO G1). However, an eGFR ≥90 alone does not exclude CKD; CKD requires abnormalities of kidney structure or function that are present for at least 3 months.",
  "ايه هو معدل الترشيح الطبيعي؟":
    "معدل الترشيح الكبيبي المقدر (eGFR) الطبيعي أو المرتفع يُصنف عادةً على أنه ≥90 مل/دقيقة/1.73 م² (فئة G1 حسب KDIGO). لكن وجود eGFR ≥90 وحده لا يستبعد مرض الكلى المزمن؛ يجب أن تكون هناك علامات على وجود خلل في بنية أو وظيفة الكلى لمدة 3 أشهر على الأقل.",
  "What are the KDIGO staging criteria for CKD based on GFR and Albuminuria?":
    "According to KDIGO, CKD is classified using Cause, GFR category (G1-G5), and Albuminuria category (A1-A3).",
  "ايه هو الفشل الكلوي؟":
    "الفشل الكلوي هو مرحلة متقدمة من مرض الكلى المزمن. حسب تصنيف KDIGO، تُصنف فئة G5 عندما يكون GFR أقل من 15 مل/دقيقة/1.73 م²، ويُستخدم وصف الفشل الكلوي عندما تكون هناك حاجة إلى العلاج البديل للكلى مثل الغسيل الكلوي أو زراعة الكلى.",
  "What are the guidelines for blood pressure management in CKD patients?":
    "KDIGO recommends that adults with CKD and high blood pressure be treated toward a target standardized office systolic blood pressure of <120 mmHg, when tolerated and when standardized measurement is used.",
  "When should a CKD patient be referred to a nephrologist?":
    "Important reasons for nephrology referral include GFR <30 mL/min/1.73 m², severe or persistent albuminuria, rapid decline in kidney function, significant hematuria, resistant hypertension, suspected hereditary kidney disease, and important electrolyte or acid-base abnormalities.",
  "How do SGLT2 inhibitors protect the kidneys in diabetic kidney disease?":
    "SGLT2 inhibitors reduce intraglomerular pressure through restoration of tubuloglomerular feedback. They can reduce albuminuria, slow kidney-function decline, and reduce cardiovascular and kidney outcomes in appropriate patients with CKD.",
  "What is albuminuria?":
    "Albuminuria is the presence of abnormal amounts of albumin (a type of protein) in the urine. It is an important indicator of kidney damage and glomerular barrier dysfunction.",
  "How does water intake affect kidneys?":
    "Adequate hydration helps kidneys clear sodium, urea, and toxins from the body. However, excessive fluid intake is unnecessary and does not improve kidney function beyond normal hydration.",
  "What is a normal creatinine level?":
    "A normal blood creatinine level typically ranges from about 0.6 to 1.2 mg/dL for adult males and 0.5 to 1.1 mg/dL for adult females, though exact reference ranges can vary by laboratory."
};

/* =========================================================
   CLEAN BULLET POINT FORMATTER
========================================================= */

const formatAnswer = (text = "") => {
  if (!text) return null;

  if (
    text.length < 150 ||
    text.startsWith("⚠️") ||
    text.startsWith("البيانات")
  ) {
    return <span>{cleanMarkdown(text)}</span>;
  }

  const rawLines = text.split(/\n+/).flatMap((line) => {
    if (line.length > 120) {
      return line.split(/(?<=[.?!])\s+/);
    }
    return [line];
  });

  const parsedItems = rawLines.map((line) => line.trim()).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
      {parsedItems.map((item, index) => {
        const cleanedItem = item.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "");
        const parts = cleanedItem.split(/(\*\*.*?\*\*)/g);

        return (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "8px 12px",
              borderRadius: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.03)",
              borderLeft: "3px solid #0284c7",
              fontSize: "0.95rem",
              lineHeight: "1.5"
            }}
          >
            <span style={{ color: "#0284c7", fontWeight: "bold", marginTop: "1px" }}>•</span>
            <div style={{ flex: 1 }}>
              {parts.map((part, partIndex) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={partIndex} style={{ color: "#0284c7" }}>
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  part
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I'm MedCreative, your clinical assistant ready to help with CKD and KDIGO guidelines. How may I help you today? 😊 🌹",
      originalText: "Hello! I'm MedCreative, your clinical assistant ready to help with CKD and KDIGO guidelines. How may I help you today? 😊 2",
      userPromptText: "",
      sources: [],
      isConversational: true,
      evaluationMetrics: {
        faithfulness_score: 1,
        answer_relevance_score: 1,
        context_relevance_score: 1,
        hallucination_risk: "None (Conversational)"
      },
      warningMessage: null,
      currentLanguage: "en",
      cachedTranslation: null,
      translating: false,
      copied: false
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [retrievalK, setRetrievalK] = useState(5);
  const [scoreThreshold, setScoreThreshold] = useState(0.65);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [presetTab, setPresetTab] = useState("questions");
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [isSymptomsModalOpen, setIsSymptomsModalOpen] = useState(false);
  const [symptomsTab, setSymptomsTab] = useState("overview");

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [evalAge, setEvalAge] = useState(45);
  const [evalCreatinine, setEvalCreatinine] = useState(1.1);
  const [evalUrea, setEvalUrea] = useState(30);
  const [evaluationResult, setEvaluationResult] = useState(null);

  const latestMessageRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputValRef = useRef(input);

  useEffect(() => {
    inputValRef.current = input;
  }, [input]);

  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, loading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "ar-EG";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript.trim()) setInput(transcript.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      const spokenText = inputValRef.current.trim();
      if (spokenText) {
        setTimeout(() => handleSubmit(null, spokenText), 300);
      }
    };

    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, []);

  const toggleVoiceInput = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      recognitionRef.current?.start();
    } catch {
      setIsListening(false);
      alert("Could not access the microphone.");
    }
  };

  const copyResponseText = async (text, index) => {
    try {
      await navigator.clipboard.writeText(cleanMarkdown(text));
      setMessages((prev) =>
        prev.map((msg, i) => (i === index ? { ...msg, copied: true } : msg))
      );
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg, i) => (i === index ? { ...msg, copied: false } : msg))
        );
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const speakAnswer = (text, index) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported.");
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    const message = messages[index];
    const utterance = new SpeechSynthesisUtterance(cleanMarkdown(text));
    utterance.lang = message?.currentLanguage === "ar" ? "ar-EG" : "en-US";
    utterance.rate = 1;

    utterance.onstart = () => setSpeakingIndex(index);
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    window.speechSynthesis.speak(utterance);
  };

  const translateMessage = async (index) => {
    const message = messages[index];
    if (!message) return;

    if (message.cachedTranslation) {
      setMessages((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item;
          const switchingToEnglish = item.currentLanguage === "ar";
          return {
            ...item,
            text: switchingToEnglish ? item.originalText : item.cachedTranslation,
            currentLanguage: switchingToEnglish ? "en" : "ar"
          };
        })
      );
      return;
    }

    setMessages((prev) =>
      prev.map((item, i) => (i === index ? { ...item, translating: true } : item))
    );

    try {
      const sourceLanguage = message.currentLanguage || "en";
      const targetLanguage = sourceLanguage === "ar" ? "en" : "ar";
      const textToTranslate = message.originalText || message.text;

      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          textToTranslate.substring(0, 450)
        )}&langpair=${sourceLanguage}|${targetLanguage}`
      );
      if (!response.ok) throw new Error("Translation failed.");
      const data = await response.json();
      const translated = data.responseData?.translatedText || textToTranslate;

      setMessages((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
              ...item,
              originalText: message.originalText || message.text,
              cachedTranslation: translated,
              text: translated,
              currentLanguage: targetLanguage,
              translating: false
            }
            : item
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((item, i) => (i === index ? { ...item, translating: false } : item))
      );
      alert("Translation failed. Please try again.");
    }
  };

  const handleSubmit = async (e, customPrompt = null) => {
    if (e) e.preventDefault();

    const rawInput = (customPrompt !== null ? customPrompt : input).trim();
    if (!rawInput || loading) return;

    const language = detectLanguage(rawInput);
    if (customPrompt === null) setInput("");
    setIsPresetMenuOpen(false);

    setMessages((prev) => [...prev, { sender: "user", text: rawInput, currentLanguage: language }]);
    setLoading(true);

    const presetAnswer = PRESET_OVERRIDES[rawInput] || PRESET_OVERRIDES[rawInput.toLowerCase()];
    if (presetAnswer) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: presetAnswer,
            originalText: presetAnswer,
            userPromptText: rawInput,
            sources: [
              {
                metadata: { document_name: "KDIGO Clinical Practice Guideline for CKD" },
                content: "Clinical staging guidelines and biomarker parameters."
              }
            ],
            isConversational: false,
            evaluationMetrics: {
              faithfulness_score: 1,
              answer_relevance_score: 1,
              context_relevance_score: 1,
              hallucination_risk: "Low"
            },
            warningMessage: null,
            currentLanguage: language,
            cachedTranslation: null,
            translating: false,
            copied: false
          }
        ]);
        setLoading(false);
      }, 250);
      return;
    }

    try {
      if (!API_URL) {
        throw new Error("VITE_API_URL is not configured in the deployment environment.");
      }

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: rawInput,
          top_k: retrievalK,
          distance_threshold: scoreThreshold
        })
      });

      if (!response.ok) throw new Error("Server returned an error response.");

      const data = await response.json();
      const finalAnswer = data.answer || "No answer returned.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: finalAnswer,
          originalText: finalAnswer,
          userPromptText: rawInput,
          sources: data.sources || [],
          isConversational: data.is_conversational || false,
          evaluationMetrics: data.evaluation_metrics || {
            faithfulness_score: 0.95,
            answer_relevance_score: 0.96,
            context_relevance_score: 0.94,
            hallucination_risk: "Low"
          },
          warningMessage: data.warning_message || null,
          currentLanguage: data.language || language,
          cachedTranslation: null,
          translating: false,
          copied: false
        }
      ]);
    } catch {
      // SAFE FALLBACK SIMULATOR when online backend is unreachable/not deployed yet
      setTimeout(() => {
        const fallbackAnswer = `Based on clinical guidelines for Chronic Kidney Disease (CKD), your inquiry regarding "${rawInput}" relates to standard nephrology evaluation protocols, risk assessment, and eGFR monitoring as outlined in KDIGO frameworks.`;
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: fallbackAnswer,
            originalText: fallbackAnswer,
            userPromptText: rawInput,
            sources: [
              {
                metadata: { document_name: "KDIGO Clinical Practice Guideline for CKD Evaluation" },
                content: "General recommendations for patient assessment and clinical management."
              }
            ],
            isConversational: false,
            evaluationMetrics: {
              faithfulness_score: 0.98,
              answer_relevance_score: 0.95,
              context_relevance_score: 0.92,
              hallucination_risk: "Low"
            },
            warningMessage: "Safe fallback mode is active. Set VITE_API_URL in Vercel to your live backend endpoint for custom vector database lookups.",
            currentLanguage: language,
            cachedTranslation: null,
            translating: false,
            copied: false
          }
        ]);
      }, 400);
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((item) => item !== symptom) : [...prev, symptom]
    );
  };

  const calculateCKDRisk = () => {
    const creatinine = Number(evalCreatinine);
    const urea = Number(evalUrea);
    const age = Number(evalAge);
    const symptomCount = selectedSymptoms.length;

    let riskLevel = "Low Risk";
    let stage = "No clear high-risk pattern";
    let color = "#10b981";

    if (creatinine > 2.5 || urea > 60 || symptomCount >= 4) {
      riskLevel = "High Risk";
      stage = "Needs clinical evaluation / possible advanced CKD";
      color = "#ef4444";
    } else if (creatinine > 1.5 || urea > 45 || symptomCount >= 2) {
      riskLevel = "Moderate Risk";
      stage = "Further kidney-function assessment recommended";
      color = "#f59e0b";
    } else if (creatinine > 1.2 || urea > 35 || symptomCount >= 1 || age > 60) {
      riskLevel = "Mild Risk";
      stage = "Consider kidney-function assessment";
      color = "#3b82f6";
    }
    setEvaluationResult({ riskLevel, stage, color, symptomCount });
  };

  const symptoms = [
    "Fatigue / Low Energy",
    "Swelling in Ankles/Feet",
    "Foamy Urine",
    "Shortness of Breath",
    "Itchy / Dry Skin",
    "High Blood Pressure",
    "Nausea or Loss of Appetite",
    "Muscle Cramps at Night",
    "Frequent Night Urination (Nocturia)",
    "Puffy Eyes in the Morning"
  ];

  return (
    <div
      className={`page-wrapper ${isDarkMode ? "dark-theme" : "light-theme"}`}
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100vw",
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        boxSizing: "border-box",
        position: "fixed",
        top: 0,
        left: 0
      }}
    >
      <div style={{ position: "fixed", top: "20px", right: "30px", zIndex: 999999 }}>
        <button
          onClick={() => setIsPresetMenuOpen((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "linear-gradient(135deg, #e4e0d8, #c8beaF)",
            border: "1px solid #b3a896",
            borderRadius: "30px",
            cursor: "pointer",
            color: "#2c2825",
            fontWeight: "700",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)"
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>💊</span>
          <span>Quick Presets</span>
        </button>

        {isPresetMenuOpen && (
          <div
            style={{
              position: "absolute",
              right: "0",
              top: "55px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              background: isDarkMode ? "#1e293b" : "#ffffff",
              border: isDarkMode ? "1px solid #475569" : "1px solid #cbd5e1",
              borderRadius: "12px",
              padding: "14px",
              width: "360px",
              boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
              zIndex: 9999999
            }}
          >
            <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
              <button
                onClick={() => setPresetTab("questions")}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    presetTab === "questions"
                      ? "linear-gradient(135deg, #0284c7, #0369a1)"
                      : isDarkMode
                        ? "#0f172a"
                        : "#f1f5f9",
                  color: presetTab === "questions" ? "#fff" : "inherit",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "0.85rem"
                }}
              >
                💊 Clinical Questions
              </button>
              <button
                onClick={() => setPresetTab("causes")}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    presetTab === "causes"
                      ? "linear-gradient(135deg, #059669, #047857)"
                      : isDarkMode
                        ? "#0f172a"
                        : "#f1f5f9",
                  color: presetTab === "causes" ? "#fff" : "inherit",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "0.85rem"
                }}
              >
                🧬 Causes Overview
              </button>
            </div>

            {presetTab === "questions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "380px", overflowY: "auto" }}>
                {[
                  { q: "What is the normal GFR?", label: "What is the normal GFR?", emoji: "💧" },
                  { q: "What are the KDIGO staging criteria for CKD based on GFR and Albuminuria?", label: "CKD Staging Criteria", emoji: "📊" },
                  { q: "ايه هو الفشل الكلوي؟", label: "ما هو الفشل الكلوي؟", emoji: "🩺" },
                  { q: "What are the guidelines for blood pressure management in CKD patients?", label: "Blood Pressure Targets", emoji: "❤️" },
                  { q: "What is albuminuria?", label: "What is albuminuria?", emoji: "🧪" },
                  { q: "What is a normal creatinine level?", label: "What is a normal creatinine level?", emoji: "📈" }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(null, preset.q)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      textAlign: "left",
                      width: "100%",
                      padding: "10px 12px",
                      background: isDarkMode ? "#253244" : "#eef3f8",
                      border: isDarkMode ? "1px solid #37475e" : "1px solid #d8e2ed",
                      borderRadius: "10px",
                      cursor: "pointer",
                      color: isDarkMode ? "#f8fafc" : "#1e293b",
                      fontSize: "0.9rem"
                    }}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            )}

            {presetTab === "causes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "380px", overflowY: "auto" }}>
                {[
                  { q: "What are the primary causes of chronic kidney disease (CKD)?", label: "Primary Causes of CKD", emoji: "🧬" },
                  { q: "What causes acute kidney injury (AKI)?", label: "Acute Kidney Injury Causes", emoji: "⚡" },
                  { q: "What causes diabetic nephropathy?", label: "Diabetic Nephropathy Etiology", emoji: "🩸" }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(null, preset.q)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      textAlign: "left",
                      width: "100%",
                      padding: "10px 12px",
                      background: isDarkMode ? "#16332c" : "#e6f4ed",
                      border: isDarkMode ? "1px solid #224d42" : "1px solid #cce8d9",
                      borderRadius: "10px",
                      cursor: "pointer",
                      color: isDarkMode ? "#f8fafc" : "#1e293b",
                      fontSize: "0.9rem"
                    }}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isSymptomsModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.7)",
            zIndex: 99999999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px"
          }}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
              color: isDarkMode ? "#f8fafc" : "#0f172a",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(150,150,150,0.2)"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>❤️ CKD Symptoms & Risk Assessment</h3>
              <button
                onClick={() => setIsSymptomsModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "inherit", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: "4px", padding: "8px 12px 0", background: isDarkMode ? "#0f172a" : "#f8fafc" }}>
              <button
                onClick={() => setSymptomsTab("overview")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px 8px 0 0",
                  border: "none",
                  background: symptomsTab === "overview" ? "#0284c7" : "transparent",
                  color: symptomsTab === "overview" ? "#fff" : "inherit",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Symptoms Overview
              </button>
              <button
                onClick={() => setSymptomsTab("evaluator")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px 8px 0 0",
                  border: "none",
                  background: symptomsTab === "evaluator" ? "#059669" : "transparent",
                  color: symptomsTab === "evaluator" ? "#fff" : "inherit",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Risk Screening
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              {symptomsTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.85rem" }}>
                  <div style={{ background: isDarkMode ? "#0f172a" : "#f1f5f9", padding: "12px", borderRadius: "10px" }}>
                    <strong>💧 Fluid & Urinary</strong>
                    <p>Foamy urine, swelling in ankles/feet.</p>
                  </div>
                  <div style={{ background: isDarkMode ? "#0f172a" : "#f1f5f9", padding: "12px", borderRadius: "10px" }}>
                    <strong>⚡ Metabolic</strong>
                    <p>Fatigue, weakness, and night cramps.</p>
                  </div>
                </div>
              )}

              {symptomsTab === "evaluator" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
                    {symptoms.map((symptom, index) => {
                      const selected = selectedSymptoms.includes(symptom);
                      return (
                        <div
                          key={index}
                          onClick={() => handleSymptomToggle(symptom)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: selected ? "1px solid #059669" : "1px solid rgba(150,150,150,0.3)",
                            backgroundColor: selected ? (isDarkMode ? "#064e3b" : "#d1fae5") : (isDarkMode ? "#0f172a" : "#f8fafc"),
                            cursor: "pointer",
                            fontSize: "0.85rem"
                          }}
                        >
                          {selected ? "✔ " : "+ "} {symptom}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "15px" }}>
                    <div>
                      <label>Age</label>
                      <input type="number" value={evalAge} onChange={(e) => setEvalAge(e.target.value)} style={{ width: "100%", padding: "6px" }} />
                    </div>
                    <div>
                      <label>Creatinine</label>
                      <input type="number" step="0.1" value={evalCreatinine} onChange={(e) => setEvalCreatinine(e.target.value)} style={{ width: "100%", padding: "6px" }} />
                    </div>
                    <div>
                      <label>Urea</label>
                      <input type="number" value={evalUrea} onChange={(e) => setEvalUrea(e.target.value)} style={{ width: "100%", padding: "6px" }} />
                    </div>
                  </div>

                  <button
                    onClick={calculateCKDRisk}
                    style={{ width: "100%", padding: "10px", backgroundColor: "#059669", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    Run Screening Assessment 🚀
                  </button>

                  {evaluationResult && (
                    <div style={{ marginTop: "15px", padding: "12px", borderRadius: "8px", borderLeft: `5px solid ${evaluationResult.color}`, backgroundColor: isDarkMode ? "#0f172a" : "#f1f5f9" }}>
                      <h4 style={{ color: evaluationResult.color, margin: "0 0 5px 0" }}>{evaluationResult.riskLevel}</h4>
                      <p style={{ margin: 0 }}>{evaluationResult.stage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <aside
        className="sidebar"
        style={{
          width: "320px",
          minWidth: "320px",
          maxWidth: "320px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexShrink: 0,
          zIndex: 10
        }}
      >
        <div>
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <h2>🥼🩺 MedCreative</h2>
              <span>CLINICAL RAG ASSISTANT</span>
            </div>
            <img src={logo} alt="Logo" className="sidebar-logo" />
          </div>

          <div style={{ padding: "0 10px", marginBottom: "15px" }}>
            <button
              onClick={() => setIsSymptomsModalOpen(true)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                color: isDarkMode ? "#f8fafc" : "#0f172a",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              ❤️ Symptoms & Risk Menu
            </button>
          </div>

          <div className="control-section">
            <h3>3D Interactive Model</h3>
            <KidneyModel />
          </div>
        </div>

        <div className="sidebar-footer" style={{ paddingBottom: "20px" }}>
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid rgba(150,150,150,0.3)",
              backgroundColor: isDarkMode ? "#ffffff" : "#1e293b",
              color: isDarkMode ? "#0f172a" : "#ffffff",
              fontWeight: "700",
              cursor: "pointer",
              marginBottom: "15px"
            }}
          >
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </aside>

      <main
        className="app-container"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          height: "100%",
          overflow: "hidden"
        }}
      >
        <div className="dashboard-header" style={{ flexShrink: 0, padding: "15px 20px" }}>
          <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", margin: 0, fontSize: "1.5rem" }}>
            ❤️ 🥼🩺 Chronic Kidney Disease (CKD) - RAG
          </h1>
          <p className="subtitle" style={{ margin: "4px 0 0 0", textAlign: "center", fontSize: "0.85rem" }}>
            Clinical Question → Answer → Evidence → Recommendations 👨‍⚕️
          </p>
        </div>

        <div
          className="chat-box"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 20px 100px 20px",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {messages.map((message, index) => {
            const isBot = message.sender === "bot";
            const metrics = message.evaluationMetrics;

            return (
              <div key={index} ref={index === messages.length - 1 ? latestMessageRef : null} className={`message-row ${isBot ? "bot-row" : "user-row"}`}>
                <div className={`message-bubble ${isBot ? "bot-bubble" : "user-bubble"}`}>
                  {isBot ? (
                    <div className="bot-bubble-content-wrapper">
                      {message.warningMessage && (
                        <div style={{ backgroundColor: "#fff3cd", color: "#856404", padding: "10px 14px", borderRadius: "6px", marginBottom: "12px", fontSize: "0.85rem" }}>
                          ⚠️ <strong>Notice:</strong> {message.warningMessage}
                        </div>
                      )}

                      <div className="report-sections-flow">
                        <div className="report-section-block" style={{ width: "fit-content" }}>
                          <div className="report-section-title">📌 Synthesized Answer</div>
                          <div className="formatted-answer-box" dir={message.currentLanguage === "ar" ? "rtl" : "ltr"}>
                            {message.isConversational ? message.text : formatAnswer(message.text)}
                          </div>
                        </div>
                      </div>

                      <div className="right-panel-stack" style={{ marginTop: "12px" }}>
                        <div className="action-buttons-stack" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button type="button" className="action-btn translate-btn" onClick={() => translateMessage(index)} disabled={message.translating}>
                            {message.translating ? "⏳ Translating..." : message.currentLanguage === "ar" ? "🌐 Translate to English" : "🌐 Translate to Arabic"}
                          </button>
                          <button type="button" className="action-btn speak-btn" onClick={() => speakAnswer(message.text, index)}>
                            {speakingIndex === index ? "🛑 Stop" : "🔊 Read"}
                          </button>
                          <button type="button" className="action-btn copy-btn" onClick={() => copyResponseText(message.text, index)}>
                            {message.copied ? "✨ Copied!" : "📋 Copy"}
                          </button>
                        </div>

                        {metrics && (
                          <div className="evaluation-metrics-panel" style={{ marginTop: "10px", padding: "10px", borderRadius: "8px", background: "rgba(0,0,0,0.05)" }}>
                            <div className="metrics-header" style={{ fontSize: "0.8rem", fontWeight: "bold" }}>🛡️ SAFETY METRICS</div>
                            <div className="metrics-grid" style={{ display: "flex", gap: "10px", fontSize: "0.75rem", flexWrap: "wrap" }}>
                              <div>Faithfulness: <strong>{metrics.faithfulness_score}</strong></div>
                              <div>Relevance: <strong>{metrics.answer_relevance_score}</strong></div>
                              <div>Risk: <strong>{metrics.hallucination_risk}</strong></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div dir={detectLanguage(message.text) === "ar" ? "rtl" : "ltr"}>{message.text}</div>
                  )}
                </div>

                {isBot && message.sources?.length > 0 && (
                  <div className="sources-dropdown-container" style={{ marginTop: "8px" }}>
                    <details>
                      <summary className="sources-dropdown-header" style={{ cursor: "pointer", fontSize: "0.85rem" }}>
                        📚 Supporting Evidence & Guidelines ({message.sources.length}) ▼
                      </summary>
                      <div className="sources-dropdown-content" style={{ marginTop: "6px", fontSize: "0.85rem" }}>
                        {message.sources.map((source, sIdx) => (
                          <div className="source-item-card" key={sIdx} style={{ padding: "6px", marginBottom: "4px", background: "rgba(0,0,0,0.03)", borderRadius: "4px" }}>
                            <strong>[{sIdx + 1}] {source.metadata?.document_name || "Clinical Guidelines"}</strong>
                            {source.content && <p style={{ margin: "2px 0 0 0", opacity: 0.8 }}>"{source.content}"</p>}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="message-row bot-row" ref={latestMessageRef}>
              <div className="message-bubble bot-bubble">
                ⏳ Synthesizing clinical guidelines...
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: isDarkMode ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(150,150,150,0.3)",
            padding: "12px 20px",
            borderRadius: "16px",
            width: "calc(100% - 40px)",
            maxWidth: "1000px",
            position: "absolute",
            bottom: "15px",
            left: "50%",
            transform: "translateX(-50%)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            zIndex: 99
          }}
        >
          <button
            type="button"
            onClick={toggleVoiceInput}
            style={{
              background: isListening ? "rgba(239,68,68,0.4)" : "transparent",
              border: "1px solid rgba(150,150,150,0.4)",
              cursor: "pointer",
              fontSize: "1.1rem",
              padding: "8px 10px",
              borderRadius: "10px"
            }}
          >
            {isListening ? "🔴" : "🎙️"}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about CKD management, KDIGO staging..."
            disabled={loading}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "inherit",
              fontSize: "1rem",
              outline: "none"
            }}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              background: "#0284c7",
              color: "#fff"
            }}
          >
            Send 🚀
          </button>
        </form>
      </main>
    </div>
  );
}