"use client"

import { useState } from "react"
import TailwindAndAnimations from "../components/TailwindAndAnimations"
import FloatingBackground from "../components/FloatingBackground"
import FileUpload from "../components/FileUpload"
import ActionButtons from "../components/ActionButtons"
import ResultsDisplay from "../components/ResultsDisplay"
import QuickQueryBar from "../components/QuickQueryBar"
import Sidebar from "../components/Sidebar"

import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/UIComponents"
import Header from "../components/Header"
import { motion, AnimatePresence } from "framer-motion"

export default function Chat() {
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [theme, setTheme] = useState("dark")
  const [refreshSidebar, setRefreshSidebar] = useState(0)

  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [activeTab, setActiveTab] = useState("upload")
  const [results, setResults] = useState({
    summaries: [],
    research: [],
    graphs: [],
    recommendations: [],
  })
  const [quickQuery, setQuickQuery] = useState("")
  const [showAuthPopup, setShowAuthPopup] = useState(false)

  const handleAction = (action) => {
    if (!localStorage.getItem("token")) {
      setShowAuthPopup(true)
      return
    }

    const mockResult = {
      id: Date.now(),
      title: `${action} Result`,
      content: `This is a mock ${action.toLowerCase()} result for your uploaded files.`,
      timestamp: new Date().toLocaleTimeString(),
    }

    setResults((prev) => ({
      ...prev,
      [action.toLowerCase()]: [mockResult, ...(prev[action.toLowerCase()] || [])],
    }))
    setActiveTab("results")
  }

  const handleQuickQuery = (e) => {
    e.preventDefault()
    if (!quickQuery.trim()) return

    if (!localStorage.getItem("token")) {
      setShowAuthPopup(true)
      return
    }

    const mockResult = {
      id: Date.now(),
      title: "Quick Query Response",
      content: `Response to: "${quickQuery}"`,
      timestamp: new Date().toLocaleTimeString(),
    }

    setResults((prev) => ({
      ...prev,
      summaries: [mockResult, ...prev.summaries],
    }))
    setQuickQuery("")
    setActiveTab("results")
  }

  const handleFileUpload = async (file) => {
    if (!localStorage.getItem("token")) {
      setShowAuthPopup(true)
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    const BASE_URL = import.meta.env.VITE_BASIC_URL
    const endpoint = `${BASE_URL}documents/upload/`

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Token ${localStorage.getItem("token")}`,
      },
      body: formData,
    })

    const data = await res.json()
    console.log("Uploaded file response:", data)

    if (res.ok && data.id) {
      setUploadedFiles((prev) => [
        ...prev,
        {
          id: Date.now(),
          backendId: data.id,
          name: file.name,
          size: file.size,
          type: file.type,
        },
      ])
    } else {
      console.error("Upload failed:", data)
      throw new Error(data.error || "Upload failed")
    }
  }

  const handleSummarize = async () => {
    if (!uploadedFiles.length) return alert("Upload at least one file first!")

    setIsSummarizing(true) // ✅ show loader right away

    try {
      const token = localStorage.getItem("token")
      const fileIds = uploadedFiles.map((f) => f.backendId)
      const BASE_URL = import.meta.env.VITE_BASIC_URL

      // Simulate short delay so loader is visible even on fast errors
      await new Promise((res) => setTimeout(res, 1000))

      const res = await fetch(`${BASE_URL}documents/summarize/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ files: fileIds }),
      })

      const data = await res.json()
      console.log("Summarize response:", data)

      if (res.ok && data.summary) {
  const newResult = {
    id: Date.now(),
    title: "Summary Result",
    content: data.summary,
    timestamp: new Date().toLocaleTimeString(),
  }

  setResults((prev) => ({
    ...prev,
    summaries: [newResult, ...prev.summaries],
  }))
  setActiveTab("results")

  // --- NEW: if backend returned session data, add it to the sidebar immediately ---
  // preferred backend response: { summary: "...", session_id: 42, title: "...", created_at: "..." }
  const sid = data.session_id || data.session?.id || null
  if (sid) {
    const newSession = {
      id: sid,
      title: data.title || data.session?.title || `Summarization "${uploadedFiles?.[0]?.name || sid}"`,
      created_at: data.created_at || data.session?.created_at || new Date().toISOString(),
      summary_text: data.summary,
    }

    // 1) add to parent sessions state (optional)
    setSessions((prev) => {
      if (prev.find((p) => String(p.id) === String(newSession.id))) return prev
      return [newSession, ...prev]
    })

    // 2) dispatch a custom event the Sidebar listens to (ensures instant UI update)
    try {
      window.dispatchEvent(new CustomEvent("summaries:added", { detail: newSession }))
    } catch (err) {
      // fallback for older browsers
      window.dispatchEvent(new Event("storage"))
    }
  }

  // 3) always nudge sidebar to re-fetch (defensive)
  setRefreshSidebar((prev) => prev + 1)
}
 else {
        alert(data.error || "Summarization failed")
      }
    } catch (err) {
      console.error("Summarize error:", err)
      alert("Error while summarizing")
    } finally {
      setIsSummarizing(false) // ✅ always hide loader
    }
  }

  const handleSelectSession = (session) => {
    setActiveSession(session)
    setResults((prev) => ({
      ...prev,
      summaries: [
        {
          id: session.id,
          title: session.title,
          content: session.summary_text || "No content yet",
          timestamp: new Date(session.created_at).toLocaleTimeString(),
        },
      ],
    }))
    setActiveTab("results")
  }


  return (
    <div
    className={`min-h-screen transition-colors duration-300 font-sans overflow-hidden relative ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"
    }`}
    >
      <Header />
      <TailwindAndAnimations />
      <FloatingBackground />

      {/* Main Flex Layout: Sidebar + Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          onSelectSession={handleSelectSession}
          onCreateLocalSession={(session) => {
            setSessions((prev) => [session, ...prev])
            handleSelectSession(session)
          }}
          refreshTrigger={refreshSidebar}   // trigger re-fetch after summarize
        />

        {/* Main Content */}
        <div className="flex-1 relative z-10 ml-72">

          <section className="py-20 px-6 text-center animate-fade-in">
            <div className="container mx-auto max-w-5xl">
              <h1 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-tight">
                Your Personal Knowledge Lab
              </h1>
              <p className="text-xl md:text-2xl text-white/70 mb-12 leading-relaxed max-w-3xl mx-auto">
                Upload documents, explore insights, and transform knowledge into
                action with AI-powered intelligence.
              </p>
            </div>
          </section>

          <div className="container mx-auto px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-12">
                <TabsList className="grid grid-cols-2 w-full max-w-md">
                  <TabsTrigger value="upload">Upload & Actions</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="upload" className="space-y-12">
                <FileUpload
                  uploadedFiles={uploadedFiles}
                  setUploadedFiles={setUploadedFiles}
                  handleFileUpload={handleFileUpload}
                />
                <ActionButtons
                  uploadedFiles={uploadedFiles}
                  handleSummarize={handleSummarize}
                  isSummarizing={isSummarizing} // ✅ loader state passed down
                />
              </TabsContent>

              <TabsContent value="results" className="space-y-8">
                <ResultsDisplay results={results} />
              </TabsContent>
            </Tabs>

            <div className="mt-12 mb-8">
              <QuickQueryBar
                quickQuery={quickQuery}
                setQuickQuery={setQuickQuery}
                handleQuickQuery={handleQuickQuery}
                activeSessionId={activeSession ? activeSession.id : null}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Auth Popup */}
      <AnimatePresence>
        {showAuthPopup && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-pink-400">Hold Up! 🚀</h2>
              <p className="text-gray-300 mb-6">
                You need to{" "}
                <span className="text-blue-400 font-semibold">sign up</span> or{" "}
                <span className="text-green-400 font-semibold">sign in</span> to
                upload documents and use AI features.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => (window.location.href = "/signup")}>
                  Sign Up
                </Button>
                <Button onClick={() => (window.location.href = "/signin")}>
                  Sign In
                </Button>
                <Button variant="ghost" onClick={() => setShowAuthPopup(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}