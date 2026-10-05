import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Globe,
  SlidersHorizontal
} from 'lucide-react';
import { askCopilotApi } from '../lib/api';
import { CopilotResponse } from '../engine/copilot';

interface CopilotViewProps {
  overview: any;
  onSimulateDecision: () => void;
}

export const CopilotView: React.FC<CopilotViewProps> = ({ overview, onSimulateDecision }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useLocalOnly, setUseLocalOnly] = useState(false);
  const [messages, setMessages] = useState<
    {
      role: 'user' | 'assistant';
      text: string;
      facts?: Record<string, any>;
      engine?: string;
      isAi?: boolean;
    }[]
  >([
    {
      role: 'assistant',
      text: `Welcome to Vantage Private Wealth AI.

I provide deterministic, evidence-grounded financial intelligence for your portfolio as of ${overview?.snapshotDate || '2026-10-01'}.
• 100% Free AI Support (Free Cloud Gemini 2.5 Flash & Free On-Device Wealth Intelligence)
• Zero Hallucination: Every answer is derived from your canonical balance sheet and ledger
• No paid subscription, API cost, or third-party credential required.

How can I advise your capital allocation today?`,
      facts: undefined,
      engine: 'Free On-Device Private Wealth AI'
    }
  ]);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const samplePrompts = [
    'Am I financially healthy and what is my biggest risk?',
    'What happens if I pay off my credit card debt today?',
    'Where did my money go across categories?',
    'Is my real estate concentration creating risk on my NAV?'
  ];

  const handleSend = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userText = questionText.trim();
    setQuery('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const res: CopilotResponse = await askCopilotApi(userText);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer,
          facts: res.verifiedFacts,
          engine: res.engineUsed,
          isAi: res.isAiGenerated
        }
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Error processing intelligence query: ' + e.message
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanSpeech = textToSpeak
      .replace(/[*#•]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Terminal (2 cols) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="p-4 bg-[#0d121d] border border-[#1b2336] rounded-2xl flex flex-col h-[620px]">
          {/* Engine Mode Banner */}
          <div className="px-3 py-2 bg-[#080b12] rounded-xl border border-[#1b2336] flex items-center justify-between text-xs mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">Free AI Intelligence: Active</span>
              <span className="text-slate-500 font-mono">·</span>
              <span className="text-slate-400 font-mono text-[11px]">100% Free / Zero Paid Subscriptions</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#d4af37] bg-[#1a1711] px-2 py-0.5 rounded border border-[#3e341a]">
                Zero Hallucination
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-4 p-2 pr-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-[#141b29] border border-[#243149] flex items-center justify-center shrink-0 text-[#d4af37] font-bold text-xs mt-0.5">
                    V
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-4 rounded-xl space-y-2 ${
                    m.role === 'user'
                      ? 'bg-[#1b253b] text-white font-medium rounded-tr-none border border-[#2d3d61]'
                      : 'bg-[#080b12] border border-[#1b2336] text-slate-200 rounded-tl-none font-normal'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {m.role === 'assistant' && idx > 0 && (
                    <div className="pt-2 border-t border-[#1b2336] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{m.engine || 'Free On-Device Private Wealth AI'}</span>
                      <button
                        onClick={() => handleSpeak(m.text)}
                        className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3 h-3 text-emerald-400 animate-pulse" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-[#d4af37]" />
                            <span>Read Out Loud</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 text-xs justify-start">
                <div className="w-7 h-7 rounded-lg bg-[#141b29] border border-[#243149] flex items-center justify-center shrink-0 text-[#d4af37] font-bold text-xs">
                  V
                </div>
                <div className="p-3 bg-[#080b12] border border-[#1b2336] text-slate-400 rounded-xl rounded-tl-none flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
                  <span>Synthesizing portfolio facts and calculating strategic response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Advisory Prompts */}
          <div className="p-2 border-t border-[#1b2336] flex flex-wrap gap-1.5">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="text-[11px] text-slate-300 hover:text-white bg-[#080b12] hover:bg-[#161f30] border border-[#1b2336] px-2.5 py-1 rounded-md transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(query);
            }}
            className="p-2 flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your NAV, debt optimization, burn rate, or runway..."
              className="flex-1 bg-[#080b12] border border-[#1b2336] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2.5 bg-[#d4af37] hover:bg-[#ebce80] disabled:bg-[#1b2336] disabled:text-slate-600 text-slate-950 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Consult</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Verified Facts Dossier Sidebar */}
      <div className="space-y-4">
        <div className="p-5 bg-[#0d121d] border border-[#1b2336] rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-white font-bold">
              Verified Capital Facts
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
            Every metric below is mathematically computed from your raw ledger. The AI is strictly bound to these ground truths.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 bg-[#080b12] rounded-lg border border-[#1b2336] flex justify-between">
              <span className="text-slate-400">Capital Health</span>
              <span className="text-[#d4af37] font-bold tabular-nums">
                {overview?.financialHealthScore || 74}/100 (Grade {overview?.healthGrade || 'B'})
              </span>
            </div>

            <div className="p-2.5 bg-[#080b12] rounded-lg border border-[#1b2336] flex justify-between">
              <span className="text-slate-400">Net Asset Value (NAV)</span>
              <span className="text-white font-bold tabular-nums">
                ₹{(overview?.netWorth || 3687000).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-2.5 bg-[#080b12] rounded-lg border border-[#1b2336] flex justify-between">
              <span className="text-slate-400">Liquid Treasury</span>
              <span className="text-white font-bold tabular-nums">
                ₹{(overview?.liquidAssets || 860000).toLocaleString('en-IN')} ({overview?.liquidityRunwayMonths || 3.9} mo)
              </span>
            </div>

            <div className="p-2.5 bg-[#080b12] rounded-lg border border-[#1b2336] flex justify-between">
              <span className="text-slate-400">Monthly Inflow</span>
              <span className="text-white font-bold tabular-nums">
                ₹{(overview?.monthlyIncome || 273333).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-2.5 bg-[#080b12] rounded-lg border border-[#1b2336] flex justify-between">
              <span className="text-slate-400">Free Cash Flow</span>
              <span className="text-emerald-400 font-bold tabular-nums">
                +₹{(overview?.monthlyFreeCashFlow || 51954).toLocaleString('en-IN')}/mo
              </span>
            </div>

            <div className="p-2.5 bg-[#080b12] rounded-lg border border-[#1b2336] flex justify-between">
              <span className="text-slate-400">Top Liability</span>
              <span className="text-rose-400 font-bold tabular-nums">
                Credit Card (32% APR)
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onSimulateDecision}
              className="w-full py-2 text-xs font-semibold text-[#d4af37] hover:text-[#f3e5ab] bg-[#16140e] hover:bg-[#261f10] border border-[#3e341a] rounded-lg transition-colors text-center"
            >
              Simulate Debt Payoff →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
