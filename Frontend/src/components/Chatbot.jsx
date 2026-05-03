
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, ChevronRight, HelpCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const KNOWLEDGE_BASE = [
  {
    q: "How do I check in for the day?",
    a: "Go to the **Attendance** page and click the green 'Check In' button. Note that you must be within office hours (usually 9 AM - 6 PM) to check in live."
  },
  {
    q: "How can I view my payslip?",
    a: "Navigate to the **Payroll** page. You can see your payment history there and click the 'View Details' icon to see a full breakdown."
  },
  {
    q: "How do I apply for leave?",
    a: "Go to the **Time Off** page. Click 'Request Leave', fill in the dates and reason, and submit for manager approval."
  },
  {
    q: "Can I edit my profile information?",
    a: "Yes! Go to **My Profile** from the sidebar. You can update your contact details and view your professional information."
  },
  {
    q: "As an Admin, how do I correct attendance?",
    a: "On the **Attendance** page, click 'View History' for any employee. In the history popup, click the purple edit icon in the 'Actions' column."
  },
  {
    q: "How do I change my password?",
    a: "Click on your name in the top **Header** or go to **My Profile**, and you will find the option to change your security credentials."
  }
]

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Hi! I'm EmPay Assistant. How can I help you today?", time: new Date() }
  ])
  const [inputValue, setInputValue] = useState('')
  const { user } = useAuthStore()
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (text) => {
    if (!text.trim()) return

    const userMsg = { role: 'user', content: text, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')

    // Simple matching logic
    setTimeout(() => {
      const lower = text.toLowerCase()
      let answer = "I'm sorry, I don't have information on that yet. Try asking about attendance, payroll, or leave!"
      
      const match = KNOWLEDGE_BASE.find(k => 
        lower.includes(k.q.toLowerCase()) || 
        k.q.toLowerCase().split(' ').some(word => word.length > 3 && lower.includes(word))
      )

      if (match) answer = match.a

      setMessages(prev => [...prev, { role: 'bot', content: answer, time: new Date() }])
    }, 600)
  }

  const handleQuickAction = (qa) => {
    handleSend(qa.q)
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, fontFamily: "'DM Sans', sans-serif" }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              width: 360, height: 500, background: '#fff', borderRadius: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', border: '1px solid #E2E8F0', marginBottom: 16
            }}
          >
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', padding: '20px', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>EmPay Assistant</div>
                    <div style={{ fontSize: 11, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /> Online
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7 }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: '#F8FAFC' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: m.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                    background: m.role === 'user' ? '#7C3AED' : '#fff',
                    color: m.role === 'user' ? '#fff' : '#1E293B',
                    fontSize: 13, fontWeight: 500, lineHeight: 1.5,
                    boxShadow: m.role === 'user' ? '0 4px 12px rgba(124,58,237,0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
                    border: m.role === 'bot' ? '1px solid #E2E8F0' : 'none'
                  }}>
                    {m.content}
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                    {m.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}

              {messages.length === 1 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>Quick Questions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {KNOWLEDGE_BASE.slice(0, 4).map((kb, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(kb)}
                        style={{
                          textAlign: 'left', padding: '10px 14px', borderRadius: 12, background: '#fff',
                          border: '1px solid #E2E8F0', color: '#475569', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569' }}
                      >
                        {kb.q} <ChevronRight size={14} opacity={0.5} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
              <input
                type="text"
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 12, border: '1px solid #E2E8F0',
                  background: '#F8FAFC', fontSize: 13, outline: 'none', fontFamily: 'inherit'
                }}
              />
              <button
                onClick={() => handleSend(inputValue)}
                style={{
                  width: 40, height: 40, borderRadius: 12, background: '#7C3AED',
                  color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 4px 10px rgba(124,58,237,0.3)'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
          color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.4)', position: 'relative'
        }}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && (
          <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#F43F5E', border: '2px solid #fff', borderRadius: '50%' }} />
        )}
      </motion.button>
    </div>
  )
}

export default Chatbot
