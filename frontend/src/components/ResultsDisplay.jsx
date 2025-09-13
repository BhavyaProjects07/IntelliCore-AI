"use client"
import { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./UIComponents"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const ResultsDisplay = ({ results }) => {
  // 🔹 Store chat Q&A in React state, synced with localStorage
  const [chatResults, setChatResults] = useState({})

  useEffect(() => {
    function loadChats() {
      const stored = JSON.parse(localStorage.getItem("chatResults") || "{}")
      setChatResults(stored)
    }

    loadChats() // load initially
    window.addEventListener("storage", loadChats)
    return () => window.removeEventListener("storage", loadChats)
  }, [])

  return (
    <div className="space-y-8">
      <Tabs defaultValue="summaries" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="summaries">Summaries</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="summaries" className="space-y-6">
          {results.summaries.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4 opacity-50">📋</div>
                <p className="text-white/60 text-lg">
                  No summaries yet. Upload files and run summarize to see results here.
                </p>
              </CardContent>
            </Card>
          ) : (
            results.summaries.map((item) => {
              // 🔹 load chats for this summary from state
              const chats = chatResults[item.id] || []

              return (
                <Card key={item.id} className="animate-slide-up shadow-lg">
                  <CardHeader className="border-b border-white/20 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-bold text-blue-300">
                        Summary Result
                      </CardTitle>
                      <Badge variant="secondary">{item.timestamp}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1
                            className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mt-8 mb-4"
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            className="text-2xl font-semibold text-blue-200 mt-6 mb-3 border-b border-white/20 pb-1"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            className="text-xl font-semibold text-indigo-300 mt-4 mb-2"
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            className="list-disc list-inside space-y-2 ml-4 marker:text-blue-400"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="list-decimal list-inside space-y-2 ml-4 marker:text-green-400"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="leading-relaxed text-white/90" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            className="bg-white/5 border-l-4 border-blue-400 pl-4 italic rounded-lg py-3 my-3 text-white/80"
                            {...props}
                          />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong
                            className="text-yellow-300 font-semibold bg-white/10 px-1 rounded"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="leading-relaxed text-white/80 my-3" {...props} />
                        ),
                      }}
                    >
                      {item.content}
                    </ReactMarkdown>
                  </CardContent>

                  {/* 🔹 Gemini Q&A Section */}
                  {chats.length > 0 && (
                    <CardContent className="mt-6 border-t border-white/10 pt-4">
                      <h3 className="text-lg font-semibold text-purple-300 mb-3">
                        Q&A with Gemini
                      </h3>
                      <div className="space-y-4">
                        {chats.map((c, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                          >
                            <p className="text-sm text-blue-300">
                              <strong>Q:</strong> {c.q}
                            </p>
                            <p className="text-sm text-green-300 mt-1">
                              <strong>A:</strong>{" "}
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {c.a}
                              </ReactMarkdown>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(c.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ResultsDisplay
