# VANTAGE 

VANTAGE transforms raw, heterogeneous financial CSV files into an evidence-backed answer to:
> **"Am I financially healthy, what changed, what is risky, and what should I do next?"**

It is a deterministic financial intelligence engine paired with an AI explanation layer. The system normalizes diverse CSV formats into canonical financial models, cleans data without silent destruction, computes 100% reproducible metrics, evaluates a 0–100 Financial Health Score, and provides interactive decision simulations.

---

## Architecture Principle

```text
RAW CSV → Schema Detection → Column Normalization → Validation → Canonical Models → Financial Engine → REST API → UI Presentation
                                                                                        ↓
                                                                             Verified Structured Facts → AI Explanation Layer
```

---

## Tech Stack

- **Backend & Core Engine**: TypeScript, Node.js, Express, Pydantic-style validation models
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons
- **Voice / Audio**: Web Speech API executive audio briefing

---

## Project Structure

```text
vantage/
├── data/                       # Source CSV files (Transactions, Assets, Liabilities)
│   ├── transactions.csv        # 817 transactions across 24 billing periods
│   ├── assets.csv              # 8 portfolio assets (Oct 2026 snapshot)
│   └── liabilities.csv         # 3 loan obligations & APRs
├── src/
│   ├── engine/                 # Deterministic Financial Intelligence Core
│   │   ├── models.ts           # Canonical models & interfaces
│   │   ├── ingestion.ts        # Multi-format CSV parser, schema detector, alias mapper
│   │   ├── validation.ts       # Data cleaning & issue classifier (Duplicates, Reused IDs, Outliers)
│   │   ├── classification.ts   # Flows: Income, Consumption, Debt Service, Wealth Building
│   │   ├── analytics.ts        # Balance sheet, net worth, cash flow, runway, concentration
│   │   ├── trends.ts           # 3m/6m/12m trend engine & "What Changed?" insights
│   │   ├── anomalies.ts        # Statistical IQR & deterministic outlier detection
│   │   ├── scoring.ts          # 0-100 Health Score, Resilience, and Data Confidence
│   │   ├── recommendations.ts  # Prioritized recommendations with traceable evidence
│   │   ├── scenarios.ts        # What-If / Decision simulator
│   │   ├── copilot.ts          # Grounded assistant with strict facts injection
│   │   ├── defaultData.ts      # Challenge dataset & multi-format test fixtures
│   │   └── vantageManager.ts   # Central platform orchestrator
│   ├── components/             # Polished UI views (Overview, Wealth, Cash Flow, Risks, Decisions, Ledger, Copilot)
│   ├── lib/                    # API client and currency formatters
│   ├── App.tsx                 # Main application shell
│   └── main.tsx                # Entry point
├── tests/
│   └── runTests.ts             # 40-test automated verification suite
├── server.ts                   # Full-stack Express server with REST endpoints
└── package.json
```

---

## Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 3. Run Automated Tests
```bash
npx tsx tests/runTests.ts
```

---

## Key Features

1. **Intelligent Schema Normalization**:
   - Detects whether a CSV represents transactions, assets, or liabilities based on header aliases, data types, and value signatures.
   - Supports 4+ transaction layouts (e.g. `Amount + Type`, `Debit + Credit`, `Merchant + Value`).
   - Safely parses Indian currency and numbering (e.g., `₹1,00,000` is parsed to `100000`).

2. **No Silent Destruction of Data**:
   - Classifies rows into `VALID`, `WARNING`, `EXACT_DUPLICATE`, `REUSED_ID`, `FUTURE_DATED`, and `OUTLIER`.
   - Quarantines future transactions from current snapshot averages while preserving them in the ledger.

3. **Deterministic Financial Health Score (0–100)**:
   - Evaluates 6 weighted components:
     - Liquidity Resilience (20%)
     - Debt Risk (20%)
     - Cash Flow Strength (20%)
     - Wealth Growth (15%)
     - Wealth Concentration (15%)
     - Behavioral Stability (10%)

4. **Interactive Decision Simulator**:
   - Test "What-If" decisions (e.g., paying off credit card debt, increasing SIP investments, income shocks, or asset purchases) with before/after comparisons and health score deltas.

5. **Traceable Evidence Drawer**:
   - Every claim links to its mathematical formula, metric value, and contributing record IDs.

6. **Grounded AI Copilot & Spoken Brief**:
   - Explains verified financial state without hallucinating numbers; includes spoken audio playback.
