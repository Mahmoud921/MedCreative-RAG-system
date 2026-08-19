import React, { useState, useRef, useEffect } from 'react';
import logo from './assets/logo.png';
import KidneyModel from './CKDCalculatorWidget';
import './App.css';

// ─── Read saved theme or fall back to dark ───
const getSavedTheme = () =>
  localStorage.getItem('medcreative-theme') || 'dark';

export default function App() {
  const [theme, setTheme] = useState(getSavedTheme);

  // Apply theme to <html> so CSS vars work everywhere
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('medcreative-theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I'm MedCreative, your clinical assistant ready to help with CKD. How may I help you today? 😊 🌹",
      sources: [],
      isConversational: true,
      evaluationMetrics: {
        faithfulness_score: 1.0,
        answer_relevance_score: 1.0,
        context_relevance_score: 1.0,
        hallucination_risk: "None (Conversational)"
      }
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retrievalK, setRetrievalK] = useState(3);
  const [scoreThreshold, setScoreThreshold] = useState(0.85);

  // New Voice States
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
  
  const chatBoxRef = useRef(null);
  const latestMessageRef = useRef(null);

  useEffect(() => {
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages, loading]);

  // Clean text-to-speech handler (reads only the answer text cleanly)
  const speakAnswer = (text, index) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeakingMessageIndex(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;

    utterance.onstart = () => setSpeakingMessageIndex(index);
    utterance.onend = () => setSpeakingMessageIndex(null);
    utterance.onerror = () => setSpeakingMessageIndex(null);

    window.speechSynthesis.speak(utterance);
  };

  // Voice recognition handler for patients with typing difficulties
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
    };

    recognition.start();
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    
    if (!text.includes('\n-') && !text.includes('\n*') && !text.startsWith('-') && !text.startsWith('*')) {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return (
        <div className="normal-line">
          <span>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </span>
        </div>
      );
    }

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let cleanLine = line.trim();
      let isBullet = false;
      let isSubBullet = false;

      if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
        isBullet = true;
        cleanLine = cleanLine.substring(1).trim();
      } else if (cleanLine.startsWith('•') || cleanLine.startsWith('◦') || /^\d+\./.test(cleanLine)) {
        isSubBullet = true;
        if (!/^\d+\./.test(cleanLine)) {
          cleanLine = cleanLine.substring(1).trim();
        }
      }

      let colorEmoji = null;
      const lower = cleanLine.toLowerCase();
      if (lower.includes('green') || lower.startsWith('green')) colorEmoji = '🟢';
      else if (lower.includes('yellow') || lower.startsWith('yellow')) colorEmoji = '🟡';
      else if (lower.includes('orange') || lower.startsWith('orange')) colorEmoji = '🟠';
      else if (lower.includes('red') || lower.startsWith('red')) colorEmoji = '🔴';

      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

      return (
        <div 
          key={idx} 
          className={isSubBullet ? 'sub-bullet-line' : isBullet ? 'bullet-line' : 'normal-line'}
        >
          {isBullet && <span className="bullet-dot">{colorEmoji || '🩺'}</span>}
          {isSubBullet && <span className="sub-bullet-dot">{colorEmoji || '🔹'}</span>}
          {!isBullet && !isSubBullet && colorEmoji && <span className="inline-color-emoji">{colorEmoji} </span>}
          <span>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </span>
        </div>
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          top_k: retrievalK,
          distance_threshold: scoreThreshold
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response from backend.');
      }

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.answer || "No response received.",
          sources: data.sources || [],
          isConversational: data.is_conversational || false,
          evaluationMetrics: data.evaluation_metrics || null
        }
      ]);
    } catch (error) {
      console.error('Error connecting to backend:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: "⚠️ **Connection Error**: Unable to reach the backend server. Please ensure FastAPI is running on port 8000.",
          sources: [],
          isConversational: false,
          evaluationMetrics: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" data-theme={theme}>
      {/* Background overlay image — switches per theme via inline style */}
      <div
        className="bg-overlay"
        style={{
          backgroundImage:
            theme === 'light'
              ? 'url(/background_light.png)'
              : 'url(/background.png)',
        }}
      />

      {/* Sidebar Controls */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <h2>🥼🩺 MedCreative</h2>
              <span>CLINICAL RAG ASSISTANT</span>
            </div>
            <img src={logo} alt="MedCreative Logo" className="sidebar-logo" />
          </div>

          <div className="control-section">
            <h3>Parameters</h3>
            <div className="control-group">
              <label htmlFor="retrievalK">Retrieval K: {retrievalK}</label>
              <input 
                id="retrievalK"
                type="range" 
                min="1" 
                max="10" 
                value={retrievalK} 
                onChange={(e) => setRetrievalK(Number(e.target.value))} 
              />
            </div>

            <div className="control-group">
              <label htmlFor="scoreThreshold">Distance Threshold: {scoreThreshold}</label>
              <input 
                id="scoreThreshold"
                type="range" 
                min="0.1" 
                max="1.5" 
                step="0.05" 
                value={scoreThreshold} 
                onChange={(e) => setScoreThreshold(Number(e.target.value))} 
              />
            </div>
          </div>

          {/* 3D Interactive Widget Section */}
          <div className="control-section">
            <h3>3D Interactive Model</h3>
            <KidneyModel />
          </div>
        </div>

        <div className="sidebar-footer">
          {/* Theme Toggle */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span className="theme-toggle-icon">
              {theme === 'dark' ? '☀️' : '🌙'}
            </span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <p style={{ marginTop: '12px' }}>KDIGO Guidelines v2.0</p>
        </div>
      </aside>

      <main className="app-container">
        <div className="dashboard-header">
          <h1>🥼🩺 Chronic Kidney Disease (CKD) - RAG</h1>
          <p className="subtitle">Ask clinical questions or query official guidelines with RAG system 👨‍⚕️</p>
        </div>

        {/* Chat Feed */}
        <div className="chat-box" ref={chatBoxRef}>
          {messages.map((msg, index) => {
            const isLatest = index === messages.length - 1;
            const isHighRisk = msg.evaluationMetrics && 
              (msg.evaluationMetrics.hallucination_risk.toLowerCase().includes('high') || 
               msg.evaluationMetrics.faithfulness_score < 0.8);

            return (
              <div 
                key={index} 
                ref={isLatest ? latestMessageRef : null}
                className={`message-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}
              >
                <div className={`message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'} ${msg.isConversational ? 'conversational-bubble' : ''}`}>
                  {msg.sender === 'bot' ? (
                    <div className="bot-bubble-content-wrapper">
                      <div className="formatted-answer-box">
                        {msg.isConversational ? (
                          <div className="normal-line">
                            <span>{msg.text}</span>
                          </div>
                        ) : (
                          renderFormattedText(msg.text)
                        )}
                      </div>

                      {/* Text-to-Speech Audio Readout Button (Reads only answer text) */}
                      <div style={{ marginTop: '10px' }}>
                        <button 
                          type="button"
                          onClick={() => speakAnswer(msg.text, index)}
                          style={{
                            background: speakingMessageIndex === index ? '#ff4d4d' : '#2b6cb0',
                            color: '#white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItem: 'center',
                            gap: '5px'
                          }}
                        >
                          {speakingMessageIndex === index ? '🛑 Stop Reading' : '🔊 Read Answer Aloud'}
                        </button>
                      </div>

                      {/* RAG Triad & Evaluation Metrics Panel */}
                      {msg.evaluationMetrics && (
                        <div className={`evaluation-metrics-panel ${isHighRisk ? 'panel-risk-high' : 'panel-risk-low'}`}>
                          <div className="metrics-header">🛡️ RAG Triad Report</div>
                          <div className="metrics-grid">
                            <div className="metric-tag">
                              Faithfulness:
                              <strong>
                                {msg.evaluationMetrics.faithfulness_score >= 0.8 ? ' 🟢 ✔️' : ' 🔴 ❌'} {msg.evaluationMetrics.faithfulness_score}
                              </strong>
                            </div>
                            <div className="metric-tag">
                              Answer Relevance:<strong>{msg.evaluationMetrics.answer_relevance_score}</strong>
                            </div>
                            <div className="metric-tag">
                              Context Relevance:<strong>{msg.evaluationMetrics.context_relevance_score}</strong>
                            </div>
                            <div className={`metric-tag risk-${isHighRisk ? 'high' : 'low'}`}>
                              Risk:<strong>{msg.evaluationMetrics.hallucination_risk}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>

                {/* Collapsible Source Dropdown */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="sources-dropdown-container">
                    <details>
                      <summary className="sources-dropdown-header">
                        <span>📚 Retrieved Sources ({msg.sources.length})</span>
                        <span>▼</span>
                      </summary>
                      <div className="sources-dropdown-content">
                        {msg.sources.map((source, sIdx) => (
                          <div key={sIdx} className="source-item-card">
                            <div className="source-stack">
                              <span className="source-tag">Source [{sIdx + 1}]</span>
                              <span className="source-filename">
                                {source.metadata?.filename || source.metadata?.source || "Document"}
                              </span>
                              {source.metadata?.page && <span className="source-page"> Page: {source.metadata.page}</span>}
                              {source.score !== undefined && (
                                <span className="source-score"> | Distance Score: {Number(source.score).toFixed(4)}</span>
                              )}
                              {source.content && <p className="source-snippet">"{source.content}"</p>}
                            </div>
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
                <div className="loading-row">
                  <div className="loading-spinner"></div>
                  <span>Evaluating RAG Triad & analyzing clinical guidelines...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar with Voice Recognition */}
        <form className="chat-form" onSubmit={handleSubmit}>
          <label className="input-label" htmlFor="chatInput">Clinical Query / Message (Type or Voice)</label>
          <div className="input-wrapper" style={{ display: 'flex', gap: '8px' }}>
            <input 
              id="chatInput"
              type="text" 
              className="chat-input"
              placeholder="Ask a clinical question or use voice input..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              onClick={handleVoiceInput} 
              disabled={loading}
              style={{
                background: isListening ? '#e53e3e' : '#4a5568',
                color: '#fff',
                border: 'none',
                padding: '0 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              title="Speak query for accessibility"
            >
              {isListening ? "🎙️ Listening..." : "🎤 Speak"}
            </button>
            <button type="submit" className="chat-button" disabled={loading}>
              Send
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}