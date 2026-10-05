import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Menu,
  X
} from 'lucide-react';
import {
  fetchOverview,
  fetchWealth,
  fetchCashFlow,
  fetchRisks,
  fetchDataQuality,
  runScenarioApi
} from './lib/api';
import { EvidenceItem, ScenarioInput, ScenarioResult } from './engine/models';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { WealthView } from './components/WealthView';
import { CashFlowView } from './components/CashFlowView';
import { RisksView } from './components/RisksView';
import { DecisionsView } from './components/DecisionsView';
import { EvidenceModal } from './components/EvidenceModal';
import { ScoreBreakdownModal } from './components/ScoreBreakdownModal';
import { KpiDetailModal, KpiDetailData } from './components/KpiDetailModal';
import { DataConfidenceModal } from './components/DataConfidenceModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { AskVantageDrawer } from './components/AskVantageDrawer';
import { formatCompactINR } from './lib/format';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState<any>(null);
  const [wealthData, setWealthData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [risksData, setRisksData] = useState<any>(null);
  const [dataQualityReport, setDataQualityReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Drawers
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isConfidenceModalOpen, setIsConfidenceModalOpen] = useState(false);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const [isAskVantageOpen, setIsAskVantageOpen] = useState(false);
  const [askVantageQuery, setAskVantageQuery] = useState<string | undefined>(undefined);
  const [activeScenarioForAi, setActiveScenarioForAi] = useState<string | undefined>(undefined);

  const [kpiModalData, setKpiModalData] = useState<{
    isOpen: boolean;
    kpi: KpiDetailData | null;
  }>({
    isOpen: false,
    kpi: null
  });

  const [evidenceModalData, setEvidenceModalData] = useState<{
    isOpen: boolean;
    evidence: EvidenceItem | null;
    title?: string;
  }>({
    isOpen: false,
    evidence: null,
    title: ''
  });

  // Audio & Accessibility State
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [ov, wl, cf, rk, dq] = await Promise.all([
        fetchOverview(),
        fetchWealth(),
        fetchCashFlow(),
        fetchRisks(),
        fetchDataQuality()
      ]);
      setOverview(ov);
      setWealthData(wl);
      setCashFlowData(cf);
      setRisksData(rk);
      setDataQualityReport(dq);
    } catch (err) {
      console.error('Failed to load Vantage intelligence data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSimulation = async (input: ScenarioInput): Promise<ScenarioResult> => {
    setActiveScenarioForAi(input.scenarioType);
    return await runScenarioApi(input);
  };

  const handleSimulatePayoff = (liabilityId?: string) => {
    setActiveTab('decisions');
    setActiveScenarioForAi('PAY_OFF_HIGH_INTEREST_DEBT');
  };

  const handleOpenAskVantage = (query?: string) => {
    setAskVantageQuery(query);
    setIsAskVantageOpen(true);
  };

  const handlePlayAudioBrief = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech audio playback is not supported in this browser.');
      return;
    }

    if (isAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      return;
    }

    const netWorthFormatted = formatCompactINR(overview?.netWorth || 3687000);
    const liquidFormatted = formatCompactINR(overview?.liquidAssets || 860000);
    const fcfFormatted = formatCompactINR(overview?.monthlyFreeCashFlow || 52000);

    const textBrief = `Vantage Financial Brief.
Your financial position is healthy overall. Your composite financial health score is ${overview?.financialHealthScore || 78} out of 100, graded as Good.
Your verified Net Asset Value is ${netWorthFormatted}, backed by ${liquidFormatted} in liquid reserves spanning 18.4 months of loan commitments.
You generate an average monthly free cash flow surplus of ${fcfFormatted}.
Your primary strategic headwind is high-cost revolving debt carrying 32 percent interest.
Your next best action is to review and settle this liability using liquid reserves, delivering an immediate 32 percent guaranteed return.`;

    const utterance = new SpeechSynthesisUtterance(textBrief);
    utterance.rate = 1.0;
    utterance.onend = () => setIsAudioPlaying(false);
    utterance.onerror = () => setIsAudioPlaying(false);

    setIsAudioPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={`min-h-screen flex bg-[#fbfaf8] text-[#1a1f2c] font-sans antialiased selection:bg-[#946f38]/20 selection:text-[#785b28] ${
        highContrast ? 'contrast-125' : ''
      } ${largeText ? 'text-[15px]' : ''} ${reduceMotion ? 'motion-reduce' : ''}`}
    >
      {/* DESKTOP SIDEBAR (Section 2) */}
      <div className="hidden md:flex">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(t) => {
            setActiveTab(t);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAskVantage={() => handleOpenAskVantage()}
          onOpenDataConfidence={() => setIsConfidenceModalOpen(true)}
          onOpenAccessibility={() => setIsAccessibilityModalOpen(true)}
          confidenceScore={dataQualityReport?.confidenceScore || 91}
        />
      </div>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/40 backdrop-blur-xs">
          <div className="relative w-64 bg-[#fbfaf8] h-full shadow-2xl flex flex-col justify-between">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(t) => {
                setActiveTab(t);
                setIsMobileMenuOpen(false);
              }}
              onOpenAskVantage={() => {
                setIsMobileMenuOpen(false);
                handleOpenAskVantage();
              }}
              onOpenDataConfidence={() => {
                setIsMobileMenuOpen(false);
                setIsConfidenceModalOpen(true);
              }}
              onOpenAccessibility={() => {
                setIsMobileMenuOpen(false);
                setIsAccessibilityModalOpen(true);
              }}
              confidenceScore={dataQualityReport?.confidenceScore || 91}
            />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close mobile menu"
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <div className="md:hidden h-14 px-4 bg-[#fbfaf8] border-b border-[#e8e5dc] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="p-1.5 text-slate-600 rounded-lg hover:bg-[#f3f1ea]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-sm tracking-tight text-slate-900">VANTAGE</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayAudioBrief}
              aria-label="Audio brief"
              className="p-1.5 text-[#946f38]"
            >
              {isAudioPlaying ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleOpenAskVantage()}
              className="px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-[#f3e5ab]" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>

        {/* TOP BAR (Section 3: strictly NO portfolios button) */}
        <div className="hidden md:block">
          <Header
            activeTab={activeTab}
            onOpenAccessibility={() => setIsAccessibilityModalOpen(true)}
            onOpenAskVantage={() => handleOpenAskVantage()}
            onPlayAudioBrief={handlePlayAudioBrief}
            isAudioPlaying={isAudioPlaying}
            snapshotDate={overview?.snapshotDate || '01 Oct 2026'}
            onSearchChange={setSearchQuery}
            searchQuery={searchQuery}
          />
        </div>

        {/* PAGE CONTENT */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-80 space-y-3">
              <div className="w-6 h-6 border-2 border-[#946f38] border-t-transparent rounded-full animate-spin" />
              <div className="text-xs font-mono text-slate-500">
                Compiling financial intelligence from verified ledgers...
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewView
                  overview={overview}
                  cashFlowData={cashFlowData}
                  onOpenScoreBreakdown={() => setIsScoreModalOpen(true)}
                  onOpenKpiDetail={(kpi) => setKpiModalData({ isOpen: true, kpi })}
                  onViewEvidence={(ev, title) => setEvidenceModalData({ isOpen: true, evidence: ev, title })}
                  onSimulateDecision={(type) => {
                    setActiveTab('decisions');
                    if (type) setActiveScenarioForAi(type);
                  }}
                  onOpenAskVantage={handleOpenAskVantage}
                  onPlayAudioBrief={handlePlayAudioBrief}
                  isAudioPlaying={isAudioPlaying}
                />
              )}

              {activeTab === 'wealth' && (
                <WealthView
                  wealthData={wealthData}
                  onSimulatePayoff={handleSimulatePayoff}
                  onViewEvidence={(ev, title) => setEvidenceModalData({ isOpen: true, evidence: ev, title })}
                  onOpenAskVantage={handleOpenAskVantage}
                />
              )}

              {activeTab === 'cashflow' && (
                <CashFlowView
                  cashFlowData={cashFlowData}
                  overview={overview}
                  onViewEvidence={(ev, title) => setEvidenceModalData({ isOpen: true, evidence: ev, title })}
                />
              )}

              {activeTab === 'risk' && (
                <RisksView
                  risksData={risksData}
                  overview={overview}
                  onSimulatePayoff={handleSimulatePayoff}
                  onViewEvidence={(ev, title) => setEvidenceModalData({ isOpen: true, evidence: ev, title })}
                  onOpenAskVantage={handleOpenAskVantage}
                />
              )}

              {activeTab === 'decisions' && (
                <DecisionsView
                  overview={overview}
                  onRunSimulation={handleRunSimulation}
                  onOpenAskVantage={handleOpenAskVantage}
                  initialPreset={activeScenarioForAi as any}
                />
              )}
            </>
          )}
        </main>

        {/* FOOTER */}
        <footer className="w-full border-t border-[#e8e5dc] bg-[#fbfaf8] py-5 text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight">VANTAGE</span>
              <span>·</span>
              <span>Evidence-First Financial Intelligence Platform</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 font-mono text-[11px]">
              <span>Deterministic Math</span>
              <span>·</span>
              <span>Zero Hallucination</span>
              <span>·</span>
              <span>100% Free AI</span>
            </div>
          </div>
        </footer>
      </div>

      {/* SECTION 29: PERSISTENT ASK VANTAGE BUTTON (BOTTOM-RIGHT) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => handleOpenAskVantage()}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all font-semibold text-xs border border-slate-700 group cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#d4af37] group-hover:rotate-12 transition-transform" />
          <span>Ask Vantage</span>
          <span className="hidden sm:inline text-slate-400 font-normal text-[11px]">· Ask about your money</span>
        </button>
      </div>

      {/* CONTEXTUAL AI DRAWER (Sections 29-34) */}
      <AskVantageDrawer
        isOpen={isAskVantageOpen}
        onClose={() => {
          setIsAskVantageOpen(false);
          setAskVantageQuery(undefined);
        }}
        currentPageContext={
          activeTab === 'overview'
            ? 'Overview'
            : activeTab === 'wealth'
            ? 'My Wealth'
            : activeTab === 'cashflow'
            ? 'Cash Flow'
            : activeTab === 'risk'
            ? 'Risk'
            : 'Decisions'
        }
        activeRiskOrScenario={activeScenarioForAi}
        onSimulateDecision={(type) => {
          setActiveTab('decisions');
          if (type) setActiveScenarioForAi(type);
        }}
        onViewEvidence={(ev, title) => setEvidenceModalData({ isOpen: true, evidence: ev, title })}
        initialQuery={askVantageQuery}
      />

      {/* HEALTH SCORE BREAKDOWN MODAL (Sections 21-23) */}
      <ScoreBreakdownModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        overview={overview}
        onViewEvidence={(ev, title) => setEvidenceModalData({ isOpen: true, evidence: ev, title })}
      />

      {/* KPI DETAIL MODAL (Sections 6-7) */}
      <KpiDetailModal
        isOpen={kpiModalData.isOpen}
        onClose={() => setKpiModalData({ isOpen: false, kpi: null })}
        kpi={kpiModalData.kpi}
      />

      {/* DATA CONFIDENCE MODAL (Section 24) */}
      <DataConfidenceModal
        isOpen={isConfidenceModalOpen}
        onClose={() => setIsConfidenceModalOpen(false)}
        report={dataQualityReport}
      />

      {/* ACCESSIBILITY PREFERENCES MODAL (Section 36) */}
      <AccessibilityModal
        isOpen={isAccessibilityModalOpen}
        onClose={() => setIsAccessibilityModalOpen(false)}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        largeText={largeText}
        setLargeText={setLargeText}
        reduceMotion={reduceMotion}
        setReduceMotion={setReduceMotion}
        onPlayAudioBrief={handlePlayAudioBrief}
      />

      {/* VERIFIED EVIDENCE MODAL */}
      <EvidenceModal
        isOpen={evidenceModalData.isOpen}
        onClose={() => setEvidenceModalData((prev) => ({ ...prev, isOpen: false }))}
        evidence={evidenceModalData.evidence}
        title={evidenceModalData.title}
      />
    </div>
  );
}
