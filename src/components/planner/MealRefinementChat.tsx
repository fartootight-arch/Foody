"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  mealPlanId: number;
  onUpdated: (suggestion: any) => void;
}

const QUICK_TWEAKS = [
  "I don't have that, use something from my cupboard",
  "Make it quicker to cook",
  "Swap the protein for something else I have",
  "Remove any ingredients I'd need to buy",
  "Make it heartier / more filling",
  "Make it lighter / healthier",
  "Suggest a vegetarian version",
  "I don't like one of the ingredients — pick a substitute",
];

export function MealRefinementChat({ mealPlanId, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/meal-plans/${mealPlanId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to refine");
      }

      const data = await res.json();
      const notes = data.suggestion?.planningNotes ?? "Done! I've updated the meal.";
      setMessages((prev) => [...prev, { role: "assistant", text: notes }]);
      onUpdated(data.suggestion);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't make that change. Try rephrasing?" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/40">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <CardTitle className="text-base flex items-center justify-between text-orange-700">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Tweak this meal with Foody
          </span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CardTitle>
        {!open && (
          <p className="text-xs text-orange-500 mt-0.5">
            "swap the noodles for rice", "I don't have soy sauce", "make it quicker"…
          </p>
        )}
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 pt-0">
          {/* Quick tweaks */}
          {messages.length === 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TWEAKS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading}
                    onClick={() => send(q)}
                    className="text-xs px-2.5 py-1 rounded-full border border-orange-200 bg-white text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat history */}
          {messages.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-orange-500 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <p className="text-[10px] font-semibold text-orange-500 mb-0.5">Foody</p>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-xl rounded-bl-sm px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                    <span className="text-xs text-gray-500">Foody is thinking…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={messages.length === 0
                ? "e.g. swap the mushrooms for courgette, or I don't have soy sauce…"
                : "Ask another tweak…"}
              rows={2}
              disabled={loading}
              className="resize-none text-sm bg-white"
            />
            <Button
              size="icon"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="bg-orange-500 hover:bg-orange-600 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          <p className="text-[10px] text-gray-400">
            Press Enter to send · Shift+Enter for new line · Changes are saved automatically
          </p>
        </CardContent>
      )}
    </Card>
  );
}
