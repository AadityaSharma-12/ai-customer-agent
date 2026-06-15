import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquareCode, Send } from "lucide-react";
import { Button } from "../ui/button";

export interface LiveChatMessage {
  sender: "customer" | "ai";
  text: string;
  timestamp: string;
}

interface LiveChatProps {
  messages: LiveChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
}

export const LiveChat: React.FC<LiveChatProps> = ({ messages, loading, onSend }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [draft, setDraft] = React.useState("");

  const handleSend = () => {
    const text = draft.trim();
    if (!text || loading) return;
    onSend(text);
    setDraft("");
  };

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="glass-panel rounded-xl flex flex-col h-[500px] lg:h-full relative overflow-hidden">
      <div className="px-4 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/20">
        <div className="flex items-center gap-2">
          <MessageSquareCode size={16} className="text-purple-400" />
          <span className="text-xs font-semibold tracking-wide uppercase text-zinc-300">
            Live Conversation
          </span>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-medium">
          Live Agent
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 && !loading && (
          <div className="h-full flex items-center justify-center text-center px-6">
            <p className="text-xs text-zinc-500">
              Pick a customer ID and send a message to start a real conversation
              with the cancellation agent.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isAI = msg.sender === "ai";
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex gap-3 max-w-[85%] ${
                  isAI ? "mr-auto" : "ml-auto flex-row-reverse"
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center font-mono text-[10px] font-bold border ${
                    isAI
                      ? "bg-purple-950/40 border-purple-800 text-purple-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-300"
                  }`}
                >
                  {isAI ? <Sparkles size={11} className="text-purple-400" /> : "C"}
                </div>

                <div className="space-y-1">
                  <div
                    className={`rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                      isAI
                        ? "bg-zinc-900/60 text-zinc-200 border border-zinc-800/80 backdrop-blur-sm shadow-sm"
                        : "bg-purple-600/10 text-zinc-100 border border-purple-500/20"
                    }`}
                  >
                    {msg.text.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-2" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                  <div
                    className={`text-[9px] text-zinc-500 font-mono ${
                      isAI ? "text-left" : "text-right"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 max-w-[80%] mr-auto"
          >
            <div className="h-7 w-7 rounded-lg bg-purple-950/40 border border-purple-800 flex items-center justify-center">
              <Sparkles size={11} className="text-purple-400 animate-pulse" />
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-3.5 py-2.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/40 relative">
        <div className="relative flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
            placeholder={
              loading ? "Agent is processing your request..." : "Type a message to the agent..."
            }
            className="flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={loading || !draft.trim()}
            className="flex items-center gap-1.5 text-xs shrink-0"
          >
            <Send size={12} />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
