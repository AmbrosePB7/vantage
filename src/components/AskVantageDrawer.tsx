import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, ArrowRight, ShieldCheck, FileText, CornerDownRight, Volume2 } from 'lucide-react';
import { askCopilotApi } from '../lib/api';
import { CopilotResponse } from '../engine/copilot';
import { EvidenceItem } from '../engine/models';

interface AskVantageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageContext: string;
  activeRiskOrScenario?: string;
  onSimulateDecision?: (type?: string) => void;
  onViewEvidence?: (evidence: EvidenceItem, title?: string) => void;
  initialQuery?: string;
}

export const AskVantageDrawer: React.FC<AskVantageDrawerProps> = ({
  isOpen,
  onClose,
  currentPageContext,
  activeRiskOrScenario,
  onSimulateDecision,
  onViewEvidence,
  initialQuery
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<
    {
      role: 'user' | 'assistant';
      text: string;
      engine?: string;
      contextTag?: string;
      actionable?: {
        viewEvidenceTitle?: string;
        simulateType?: string;
      };
    }[]
  >([]);

  // Suggested starting questions (Section 30)
  const suggestedQuestions = [
    { label: "What's my biggest risk?", q: "What is my biggest financial risk?" },
    { label: 'Why did my score change?', q: 'Why is my financial health score at its current level?' },
    { label: 'What changed recently?', q: 'What changed recently in my cash flow and spending?' },
    { label: 'Where did my money go?', q: 'Where did my money go across major categories?' },
    { label: 'What should I do next?', q: 'What is my next best strategic capital action?' }
  ];

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleAsk(initialQuery);
    }
  }, [initialQuery, isOpen]);

  if (!isOpen) return null;

  const handleAsk = async (questionText: string) => {
    if (!questionText.trim()) return;
    const cleanQ = questionText.trim();
    setQuery('');

    // Prepend context if user asks contextual query
    let contextAwareQuery = cleanQ;
    if (currentPageContext === 'Risk' && activeRiskOrScenario && (cleanQ.toLowerCase().includes('why') || cleanQ.toLowerCase().includes('this'))) {
      contextAwareQuery = `[Context: viewing ${activeRiskOrScenario} on Risk page] ${cleanQ}`;
    } else if (currentPageContext === 'Decisions' && activeRiskOrScenario && (cleanQ.toLowerCase().includes('worth') || cleanQ.toLowerCase().includes('this'))) {
      contextAwareQuery = `[Context: simulating ${activeRiskOrScenario} on Decisions page] ${cleanQ}`;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: cleanQ,
        contextTag: currentPageContext
      }
    ]);
    setIsLoading(true);

    try {
      const res: CopilotResponse = await askCopilotApi(contextAwareQuery);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer,
          engine: res.engineUsed,
          actionable: {
            viewEvidenceTitle: cleanQ.toLowerCase().includes('debt') || cleanQ.toLowerCase().includes('risk') ? 'Debt Risk Evidence' : 'Audit Trail Evidence',
            simulateType: cleanQ.toLowerCase().includes('debt') || cleanQ.toLowerCase().includes('pay') ? 'PAY_OFF_HIGH_INTEREST_DEBT' : undefined
          }
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `We couldn't reach the online AI endpoint: ${err.message}. Your underlying deterministic calculations remain 100% verified.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEvidence = (title = 'Verified Ledger Facts') => {
    if (onViewEvidence) {
      onViewEvidence({
        claim: 'Verified balance sheet figures and cash flow run-rate',
        metric: 'Audit Trail Records',
        value: 'Derived from active balance sheet',
        calculation: 'Deterministic engine aggregation over valid CSV records',
        confidence: 91
      }, title);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ask-vantage-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md bg-white border-l border-[#e5e3dc] h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#f0eee6] bg-[#faf9f6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f0eee6] text-[#946f38] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="ask-vantage-title" className="text-base font-bold text-slate-900">
                  Ask Vantage
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Free AI
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Context: {currentPageContext} Page
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Ask Vantage"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#edebe4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {/* Default state when empty */}
          {messages.length === 0 && (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-[#fbfaf8] border border-[#eeebe2] rounded-xl space-y-1">
                <div className="font-semibold text-slate-900 text-sm">
                  What would you like to know?
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Vantage AI acts as an evidence-first private wealth intelligence partner. All statements are grounded strictly in your verified financial data.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Suggested Questions
                </div>
                <div className="flex flex-col gap-1.5">
                  {suggestedQuestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(s.q)}
                      className="px-3 py-2 text-left bg-white hover:bg-[#faf9f6] text-slate-800 rounded-lg border border-[#e8e5dc] hover:border-[#946f38]/60 transition-all font-medium text-xs flex items-center justify-between group"
                    >
                      <span>{s.label}</span>
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#946f38] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl space-y-2 ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white ml-6'
                  : 'bg-[#faf9f6] border border-[#e8e5dc] text-slate-800 mr-2'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed text-xs">
                {m.text}
              </div>

              {m.role === 'assistant' && (
                <div className="pt-2 border-t border-[#ede9df] space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Based on your financial data</span>
                    </span>
                    <span>{m.engine || 'Free AI'}</span>
                  </div>

                  {/* Contextual Action Buttons (Section 31 & 32) */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => handleOpenEvidence(m.actionable?.viewEvidenceTitle || 'Verified Evidence')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-[#ddd9cd] font-medium text-[11px] transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-[#946f38]" />
                      <span>View evidence</span>
                    </button>

                    {m.actionable?.simulateType && onSimulateDecision && (
                      <button
                        onClick={() => {
                          onSimulateDecision(m.actionable?.simulateType);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-[#946f38] hover:bg-[#7d5d2e] text-white rounded font-medium text-[11px] transition-colors flex items-center gap-1"
                      >
                        <span>Simulate payoff</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="p-3.5 bg-[#faf9f6] border border-[#e8e5dc] rounded-xl text-xs text-slate-600 font-mono flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#946f38] animate-ping" />
              <span>Synthesizing concise financial verdict...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#faf9f6] border-t border-[#f0eee6]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your money..."
              className="flex-1 bg-white border border-[#e5e3dc] rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#946f38] transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1"
            >
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
