# 🤖 Bereifung24 KI Shopfloor - Roadmap

**Status:** � Geplant (startet nach HR Management Completion)  
**Start:** Nach Fertigstellung HR Management System  
**Vision:** Selbstoptimierendes, intelligentes Betriebssystem für Bereifung24

---

## ⚠️ WICHTIG: Roadmap Status

**Diese Roadmap wird NACH Abschluss des HR Management Systems implementiert.**

**Aktuelle Prioritäten:**
1. ✅ Buchhaltungssystem (Phase 1 abgeschlossen)
2. 🟡 HR Management System (Phase 2 läuft - fast fertig)
3. 🔴 KI Shopfloor (wartet auf HR-Completion)

**HR Management Status:**
- ✅ Datenbank-Schema (33 HR-Felder)
- ✅ HR Dashboard & Mitarbeiter-Liste
- ✅ HR-Datenformular (692 Zeilen, 6 Sektionen)
- ✅ API-Integration
- ✅ Berechtigungssystem
- ✅ Admin-Dashboard-Karte
- 🟡 Testing & Validation (ausstehend)
- [ ] Gehaltsabrechnungs-Engine (Phase 3)

**KI Shopfloor startet nach HR Management Phase 2 Completion!**

---


---

## 📋 Executive Summary

Der **KI Shopfloor** ist das zentrale Nervensystem von Bereifung24. Er versteht das gesamte Business, beobachtet alle Bereiche kontinuierlich, leitet optimale Workflows ab und erzeugt konkrete, priorisierte Aufgaben. Das System lernt aus jedem Ereignis und wird kontinuierlich intelligenter.

**Kernidee:** Von reaktivem Management zu proaktiver, KI-gesteuerter Optimierung.

---

## 🎯 Hauptziele

### 1. System verstehen
- **Architektur-Mapping:** Alle Module, Services, APIs, Datenflüsse
- **Business-Logic-Extraktion:** Anfragen, Angebote, Workflows, Integrationen
- **Rollen & Prozesse:** Wer macht was, wann, warum
- **Dependency-Graph:** Technische und organisatorische Abhängigkeiten

### 2. Workflows identifizieren & optimieren
- **Implizite Prozesse im Code erkennen**
- **Explizite Workflows dokumentieren**
- **Engpässe und Fehlerquellen finden**
- **Priorisierung nach Impact** (Umsatz, Stabilität, Zufriedenheit)

### 3. Alle Geschäftsbereiche unterstützen
- **Operations:** Anfrage-Routing, Qualitätssicherung, Eskalation
- **Marketing:** Kampagnen-Timing, A/B-Tests, ROI-Analyse
- **Support:** Ticket-Priorisierung, Wissensdatenbank, Automatisierung
- **Finance:** Cash-Flow-Prognosen, Buchhaltungs-Workflows
- **HR:** Recruiting, Onboarding, Performance-Tracking
- **Tech:** Code-Quality, Deployment-Automation, Incident-Response

### 4. Kontinuierlich lernen
- **Code-Änderungen analysieren** (Git commits, PRs)
- **Logs & Errors auswerten** (PM2, Sentry, Database)
- **Externes Wissen einbeziehen** (Best Practices, Benchmarks)
- **Feedback-Loops** (Success-Metrics, User-Feedback)

### 5. Als Agent agieren
- **Natural Language Interface:** Workflows in natürlicher Sprache definieren
- **Automatische Dokumentation:** Prozesse selbstständig dokumentieren
- **Proaktive Vorschläge:** "Ich habe bemerkt, dass..."
- **Risiko-Erkennung:** Frühwarnsystem für Probleme
- **Task-Strukturierung:** Aufgaben priorisieren und zuweisen

---

## 🏗️ Technische Architektur

### Komponenten-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                     KI SHOPFLOOR CORE                        │
│  (Orchestration Layer - Next.js App im Bereifung24 System)  │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┬─────────────┬───────────────┐
        │                       │             │               │
┌───────▼───────┐   ┌───────────▼──────┐   ┌─▼────────┐   ┌──▼─────────┐
│  Data Layer   │   │  AI Brain Layer  │   │  Action  │   │  Monitor   │
│               │   │                  │   │  Layer   │   │   Layer    │
│ • PostgreSQL  │   │ • OpenAI GPT-4   │   │          │   │            │
│ • Prisma      │   │ • Claude 3.5     │   │ • GitHub │   │ • PM2 Logs │
│ • Redis Cache │   │ • LangChain      │   │ • Prisma │   │ • Sentry   │
│ • Vector DB   │   │ • RAG System     │   │ • APIs   │   │ • Analytics│
└───────────────┘   └──────────────────┘   └──────────┘   └────────────┘
```

### Technologie-Stack (Empfehlung)

**Backend (bereits vorhanden):**
- ✅ Next.js 14 (App Router)
- ✅ PostgreSQL (Haupt-Datenbank)
- ✅ Prisma ORM
- 🆕 Redis (Caching + Queue)
- 🆕 BullMQ (Job Queue für Background Tasks)

**KI & Machine Learning:**
- 🆕 **OpenAI GPT-4 Turbo** (Haupt-LLM für Reasoning)
- 🆕 **Anthropic Claude 3.5 Sonnet** (Backup + spezifische Tasks)
- 🆕 **LangChain** (AI Orchestration Framework)
- 🆕 **Pinecone oder Qdrant** (Vector Database für Embeddings)
- 🆕 **LangSmith** (LLM Observability & Debugging)

**Code-Analyse:**
- 🆕 **ts-morph** (TypeScript AST parsing)
- 🆕 **OpenAI Codex** (Code Understanding)
- ✅ GitHub API (bereits im Projekt verwendet)

**Monitoring & Observability:**
- ✅ PM2 (bereits in Verwendung)
- 🆕 **Sentry** (Error Tracking)
- 🆕 **Prometheus + Grafana** (Metrics)
- 🆕 **Axiom** (Log Aggregation & Analytics)

**Frontend (Dashboard):**
- ✅ React + shadcn/ui (bereits vorhanden)
- 🆕 **Recharts** (Visualisierungen)
- 🆕 **React Flow** (Workflow-Visualisierung)
- 🆕 **Monaco Editor** (Code-Ansicht)

---

## 📊 Implementierungs-Phasen

### Phase 0: Foundation (Woche 1-2) 🔴 AKTUELL

**Ziel:** Infrastruktur vorbereiten

**Tasks:**
- [ ] Neue Datenbank-Tabellen erstellen:
  - `ShopfloorTask` (Aufgaben mit Priorisierung)
  - `ShopfloorWorkflow` (Workflow-Definitionen)
  - `ShopfloorInsight` (Erkenntnisse und Learnings)
  - `ShopfloorMetric` (Performance-Metriken)
  - `ShopfloorLog` (Event-History)
- [ ] Redis installieren und konfigurieren
- [ ] BullMQ Queue-System einrichten
- [ ] OpenAI API Key konfigurieren
- [ ] Vector Database (Pinecone) Setup
- [ ] Admin-Seite `/admin/shopfloor` erstellen
- [ ] Basis-Dashboard mit Status-Übersicht

**Deliverables:**
- Datenbank-Schema deployed
- Queue-System funktionsfähig
- Admin-Interface erreichbar

---

### Phase 1: System Mapping (Woche 3-4)

**Ziel:** Bereifung24 vollständig verstehen

#### 1.1 Code-Base Analyse
**Aufgabe:** Alle TypeScript/JavaScript-Dateien einlesen und analysieren

**Implementation:**
```typescript
// lib/shopfloor/codeAnalyzer.ts
- Alle Dateien im Projekt scannen
- AST parsen mit ts-morph
- Extrahieren:
  - API Routes (500+ endpoints)
  - Prisma Models (50+ tables)
  - React Components (1000+ components)
  - Utility Functions
  - Business Logic
- Embeddings erstellen mit OpenAI text-embedding-3
- In Vector DB speichern
```

**Output:**
- Vollständiger Code-Graph
- Searchable Code-Knowledge-Base
- API-Documentation (auto-generiert)

#### 1.2 Datenfluss-Analyse
**Aufgabe:** Verstehen, wie Daten durch das System fließen

**Implementation:**
```typescript
// lib/shopfloor/dataFlowAnalyzer.ts
- Prisma Schema analysieren
- Foreign Keys und Relations mappen
- API-Calls tracken
- Datenbank-Queries loggen
- Dependency Graph erstellen
```

**Output:**
- Entity-Relationship-Diagramm (visualisiert)
- Datenfluss-Dokumentation
- Kritische Pfade identifiziert

#### 1.3 Business-Process Mining
**Aufgabe:** Geschäftsprozesse aus Code extrahieren

**Implementation:**
```typescript
// lib/shopfloor/processDiscovery.ts
- Workflows aus API-Sequenzen erkennen
- State-Machines dokumentieren (z.B. Offer-Lifecycle)
- Prozess-Templates erstellen
- Happy Path vs. Edge Cases
```

**Output:**
- 20-30 dokumentierte Core-Workflows
- BPMN-Diagramme (Business Process Model)
- Prozess-Katalog

**Deliverables:**
- Code-Knowledge-Base (searchable)
- System-Architecture-Dokumentation
- Business-Process-Katalog

---

### Phase 2: Intelligent Monitoring (Woche 5-6)

**Ziel:** Alle Bereiche kontinuierlich überwachen

#### 2.1 Real-Time Data Collection
**Aufgabe:** Daten aus allen Quellen sammeln

**Data Sources:**
1. **Database (PostgreSQL):**
   - Neue Anfragen (tire_requests)
   - Angebote (offers)
   - Buchungen (bookings)
   - Kunden (customers)
   - Werkstätten (workshops)
   - Mitarbeiter-Aktivitäten (activity_logs)

2. **Application Logs (PM2):**
   - Error rates
   - API response times
   - Memory usage
   - CPU load

3. **Business Metrics:**
   - Conversion Rates
   - Average Response Time (Werkstatt → Kunde)
   - Customer Satisfaction
   - Revenue per day

4. **Git Activity:**
   - Commits per day
   - PRs open/merged
   - Code churn

**Implementation:**
```typescript
// lib/shopfloor/collectors/
- databaseCollector.ts (Prisma queries)
- logCollector.ts (PM2 API)
- githubCollector.ts (GitHub API)
- metricsCollector.ts (Custom metrics)

// Cron Jobs (BullMQ)
- Every 5 minutes: Critical metrics
- Every hour: Aggregated stats
- Daily: Full analysis
```

#### 2.2 Anomaly Detection
**Aufgabe:** Abweichungen automatisch erkennen

**Examples:**
- Plötzlicher Anstieg von Fehlern (> 5% Error Rate)
- Conversion-Rate-Drop (> 10% weniger als Vorwoche)
- Langsame API-Responses (> 2s)
- Ungewöhnlich viele Support-Tickets
- Werkstatt-Inaktivität (keine Angebote seit 48h)

**Implementation:**
```typescript
// lib/shopfloor/anomalyDetector.ts
- Statistical analysis (Z-Score, Moving Average)
- AI-based pattern recognition
- Threshold alerts
- Severity classification (Low, Medium, High, Critical)
```

**Deliverables:**
- Real-Time Monitoring Dashboard
- Alert-System (E-Mail + Admin-Dashboard)
- Historical Trend-Charts

---

### Phase 3: AI Brain (Woche 7-10)

**Ziel:** Intelligente Analyse und Empfehlungen

#### 3.1 Context-Aware AI Agent
**Aufgabe:** KI mit vollständigem Business-Kontext ausstatten

**Implementation:**
```typescript
// lib/shopfloor/aiAgent.ts

// Context Builder
async function buildContext(query: string) {
  return {
    // 1. Code-Kontext (aus Vector DB)
    relevantCode: await vectorSearch(query, 'code'),
    
    // 2. Business-Kontext
    recentMetrics: await getMetrics(last7Days),
    activeWorkflows: await getActiveWorkflows(),
    openIssues: await getOpenTasks(),
    
    // 3. Historical Context
    similarPastSituations: await findSimilarCases(query),
    learnedLessons: await getInsights(query),
    
    // 4. External Context
    industryBenchmarks: await fetchBenchmarks(),
    bestPractices: await searchWeb(query)
  }
}

// AI Agent
async function analyzeAndRecommend(situation: string) {
  const context = await buildContext(situation)
  
  const prompt = `
    Du bist der KI Shopfloor Manager von Bereifung24.
    
    SITUATION:
    ${situation}
    
    KONTEXT:
    ${JSON.stringify(context, null, 2)}
    
    AUFGABE:
    1. Analysiere die Situation
    2. Identifiziere Root-Cause
    3. Bewerte Impact (Umsatz, Kunden, Stabilität)
    4. Schlage konkrete Maßnahmen vor
    5. Priorisiere nach Dringlichkeit
    
    FORMAT:
    {
      "analysis": "...",
      "rootCause": "...",
      "impact": { "revenue": "high/medium/low", ... },
      "recommendations": [
        {
          "action": "...",
          "priority": "critical/high/medium/low",
          "effort": "hours/days/weeks",
          "expectedImpact": "...",
          "steps": ["...", "..."]
        }
      ]
    }
  `
  
  return await callLLM(prompt)
}
```

#### 3.2 Workflow Optimizer
**Aufgabe:** Bestehende Prozesse optimieren

**Use Cases:**
1. **Offer-Response-Time Optimization**
   - Analyse: Warum dauert es 4h bis Werkstatt antwortet?
   - Vorschlag: Automatische Reminder nach 2h
   
2. **Customer Journey Optimization**
   - Analyse: 30% Drop-Off bei Angebotsauswahl
   - Vorschlag: Vereinfachte UI, mehr Infos, besseres Ranking

3. **Workshop-Activation-Funnel**
   - Analyse: Nur 60% der registrierten Werkstätten werden aktiv
   - Vorschlag: Onboarding-Workflow verbessern, persönlicher Kontakt

**Implementation:**
```typescript
// lib/shopfloor/workflowOptimizer.ts

// Workflow analysieren
const workflow = await analyzeWorkflow('offer-lifecycle')

// Engpässe finden
const bottlenecks = await findBottlenecks(workflow)

// Optimierungen vorschlagen
const optimizations = await generateOptimizations(bottlenecks)

// Impact simulieren
const simulation = await simulateImpact(optimizations)
```

#### 3.3 Predictive Analytics
**Aufgabe:** Zukunft vorhersagen

**Predictions:**
- **Revenue Forecast:** Nächste 30 Tage (basierend auf Seasonality + Trends)
- **Capacity Planning:** Wann brauchen wir mehr Server?
- **Customer Churn:** Welche Kunden werden inaktiv?
- **Workshop Performance:** Welche Werkstätten werden Top-Performer?
- **Support Load:** Wann kommen viele Tickets?

**Implementation:**
```typescript
// lib/shopfloor/forecaster.ts
- Time-Series Analysis (Prophet, ARIMA)
- Machine Learning Models (XGBoost, Random Forest)
- Feature Engineering (Seasonality, Trends, Events)
- Confidence Intervals
```

**Deliverables:**
- AI Agent API (`POST /api/shopfloor/analyze`)
- Optimization Reports (täglich generiert)
- Predictive Dashboards

---

### Phase 4: Autonomous Actions (Woche 11-14)

**Ziel:** Automatische Ausführung von Routine-Tasks

#### 4.1 Task Automation Framework
**Aufgabe:** System kann selbstständig handeln (mit Safety-Checks)

**Automation-Levels:**
1. **Level 0 - Manual:** Mensch muss alles machen
2. **Level 1 - Assisted:** System schlägt vor, Mensch entscheidet
3. **Level 2 - Semi-Auto:** System handelt nach Freigabe
4. **Level 3 - Full Auto:** System handelt selbstständig (mit Audit-Log)

**Safe-to-Automate Tasks:**
- **Datenbank-Cleanup:** Alte Logs löschen (> 90 Tage)
- **Email-Reminder:** Werkstätten an ausstehende Angebote erinnern
- **Report-Generation:** Wöchentliche Performance-Reports
- **Code-Documentation:** README-Updates bei neuen Features
- **Monitoring-Alerts:** Tickets in Jira/Linear erstellen
- **Cache-Invalidation:** Stale Caches aufräumen
- **Backup-Verification:** Prüfen, ob Backups funktionieren

**Implementation:**
```typescript
// lib/shopfloor/automator.ts

interface AutomationRule {
  id: string
  name: string
  trigger: {
    type: 'schedule' | 'event' | 'condition'
    config: any
  }
  conditions: {
    check: string // z.B. "errorRate > 5%"
    aiApproval: boolean // Muss KI zustimmen?
    humanApproval: boolean // Muss Mensch zustimmen?
  }
  actions: Action[]
  safetyChecks: SafetyCheck[]
  rollbackPlan: string
}

// Example
const reminderRule: AutomationRule = {
  id: 'workshop-reminder',
  name: 'Workshop Offer Reminder',
  trigger: {
    type: 'schedule',
    config: { cron: '0 */2 * * *' } // Every 2 hours
  },
  conditions: {
    check: 'offer.status === "PENDING" AND age > 2h',
    aiApproval: false,
    humanApproval: false
  },
  actions: [
    { type: 'sendEmail', template: 'offer-reminder' },
    { type: 'createNotification', target: 'workshop-dashboard' }
  ],
  safetyChecks: [
    { type: 'rateLimit', max: 100, period: 'hour' }
  ],
  rollbackPlan: 'No rollback needed (notification only)'
}
```

#### 4.2 Self-Healing Systems
**Aufgabe:** Automatische Fehler-Behebung

**Examples:**
- **Database Connection Lost:** Automatic reconnect
- **Memory Leak Detected:** Restart PM2 process
- **Disk Space Low:** Delete old logs, compress files
- **API Rate Limit Hit:** Implement exponential backoff
- **SSL Certificate Expiring:** Renew via Certbot

**Implementation:**
```typescript
// lib/shopfloor/selfHealing.ts

interface IncidentResponse {
  symptom: string
  diagnosis: string
  remedy: Action[]
  prevention: Action[]
}

// AI-powered diagnosis
const incident = await detectIncident()
const response = await aiAgent.diagnose(incident)
await executeRemedy(response.remedy)
await implementPrevention(response.prevention)
```

**Deliverables:**
- Automation Rule Engine
- Self-Healing Monitors
- Audit Log (jede Aktion wird protokolliert)

---

### Phase 5: Cross-Functional Intelligence (Woche 15-18)

**Ziel:** Alle Bereiche vernetzt optimieren

#### 5.1 Operations Intelligence

**Features:**
- **Anfrage-Routing-Optimizer:** Welche Werkstatt bekommt welche Anfrage?
- **Quality-Score-Predictor:** Welche Werkstatt wird gutes Angebot machen?
- **Eskalations-Detector:** Welche Anfragen werden problematisch?
- **Peak-Load-Manager:** Demand-Spitzen vorhersehen und puffern

**Dashboard:**
- Live-Map: Anfragen & Angebote in Real-Time
- Conversion-Funnel mit Optimierungsvorschlägen
- Workshop-Performance-Ranking
- SLA-Tracker (Response-Time, Acceptance-Rate)

#### 5.2 Marketing Intelligence

**Features:**
- **Campaign-ROI-Analyzer:** Welche Kampagne bringt am meisten?
- **Channel-Optimizer:** Google Ads vs. Facebook vs. Influencer
- **A/B-Test-Recommender:** Was sollten wir als nächstes testen?
- **Content-Performance:** Welche Landing-Pages konvertieren?
- **SEO-Monitor:** Rankings, Keywords, Backlinks

**Dashboard:**
- Marketing-Spend vs. Revenue
- Customer-Acquisition-Cost (CAC)
- Lifetime-Value (LTV)
- Channel-Mix-Optimizer

#### 5.3 Support Intelligence

**Features:**
- **Ticket-Priorisierung:** Dringlichkeit automatisch erkennen
- **Auto-Response:** Häufige Fragen automatisch beantworten
- **Knowledge-Base-Builder:** Aus Support-Tickets lernen
- **Sentiment-Analysis:** Kunde ist frustriert → Eskalation
- **Proactive Support:** Probleme erkennen bevor Kunde sich meldet

**Dashboard:**
- Ticket-Backlog mit AI-Priorisierung
- Support-Agent-Performance
- Knowledge-Base-Coverage
- Customer-Satisfaction-Trends

#### 5.4 Finance Intelligence

**Features:**
- **Cash-Flow-Forecaster:** 30/60/90-Tage Prognosen
- **Payment-Delay-Predictor:** Welche Rechnungen werden spät bezahlt?
- **Cost-Optimizer:** Wo können wir sparen?
- **Profitability-Analyzer:** Welche Services sind profitabel?
- **Tax-Compliance-Monitor:** Buchhaltung komplett?

**Dashboard:**
- Cash-Flow-Chart mit Prognose
- P&L-Statement (automatisch generiert)
- Cost-per-Service-Breakdown
- Payment-Status-Tracker

#### 5.5 HR Intelligence

**Features:**
- **Recruiting-Funnel-Optimizer:** Wo verlieren wir Kandidaten?
- **Onboarding-Tracker:** Neuer Mitarbeiter on-track?
- **Performance-Predictor:** Wer wird High-Performer?
- **Churn-Risk-Detector:** Wer ist unzufrieden?
- **Skill-Gap-Analyzer:** Welche Skills fehlen im Team?

**Dashboard:**
- Hiring-Funnel mit Conversion-Rates
- Employee-Happiness-Score
- Skill-Matrix des Teams
- Training-Needs-Assessment

#### 5.6 Tech Intelligence

**Features:**
- **Code-Quality-Monitor:** Complexity, Test-Coverage, Tech-Debt
- **Deployment-Analyzer:** Success-Rate, Rollback-Frequency
- **Incident-Response-Tracker:** MTTR (Mean Time To Repair)
- **Performance-Optimizer:** Slow-Queries, N+1-Problems
- **Security-Scanner:** Vulnerabilities, Dependencies

**Dashboard:**
- System-Health-Score (0-100)
- Deployment-Frequency vs. Stability
- Tech-Debt-Heatmap
- Security-Posture

**Deliverables:**
- 6 spezialisierte Dashboards (Operations, Marketing, Support, Finance, HR, Tech)
- Cross-Functional Reports (z.B. "Marketing → Operations Impact")
- Unified Metrics API

---

### Phase 6: Natural Language Interface (Woche 19-22)

**Ziel:** Mit dem Shopfloor in natürlicher Sprache kommunizieren

#### 6.1 Chat-Interface
**Aufgabe:** Slack-ähnlicher Chat für Bereifung24-Team

**Features:**
```
User: "Wie viele Anfragen hatten wir gestern?"
AI: "Gestern hatten wir 247 Anfragen, 12% mehr als Durchschnitt. 
     Top-Region: Berlin (43), Top-Service: Reifenwechsel (189)."

User: "Warum ist die Conversion-Rate diese Woche so niedrig?"
AI: "Conversion-Rate ist 23% (normal: 31%). Analyse:
     1. Werkstatt-Response-Time +30% (4.2h statt 3.2h)
     2. 3 Top-Werkstätten im Urlaub
     3. Wetter schlecht (weniger Impulskäufe)
     Vorschlag: Mehr Werkstätten aktivieren, Reminder früher senden."

User: "Erstelle einen Performance-Report für letzte Woche und sende ihn an das Team."
AI: "✓ Report generiert. Highlights:
     - Revenue: €47,300 (+8% vs. Vorwoche)
     - Neue Kunden: 134
     - Top-Werkstatt: AutoService München (€2,400 Umsatz)
     ✓ Versandt an 12 Teammitglieder."

User: "Warum ist bereifung24.de gerade so langsam?"
AI: "⚠️ Performance-Issue erkannt:
     - Response-Time: 2.8s (normal: 0.8s)
     - Root-Cause: Database-Query in /api/workshops (N+1 Problem)
     - Betroffene User: ~30 (letzte 10 Min)
     🔧 Empfehlung: Query optimieren mit Prisma include.
     📝 Ich habe bereits ein Task-Ticket erstellt: TECH-1834"
```

**Implementation:**
```typescript
// app/admin/shopfloor/chat/page.tsx
- Chat-UI mit shadcn/ui
- Message-History (persistent)
- Streaming-Responses (wie ChatGPT)
- Code-Blocks, Charts inline
- Quick-Actions (Buttons für häufige Fragen)

// lib/shopfloor/chatAgent.ts
- LangChain Agent mit Tools
- Tools: queryDatabase, analyzeCode, generateReport, createTask, etc.
- Memory: Conversation-History + Kontext
- RAG: Vector-Search für relevante Infos
```

#### 6.2 Voice Interface (Optional)
**Aufgabe:** Sprachsteuerung via Mikrofon

**Use Case:**
```
"Shopfloor, wie läuft's heute?"
→ AI gibt Status-Update

"Erstelle eine neue Aufgabe: Newsletter verschicken"
→ AI erstellt Task und fragt nach Details
```

**Implementation:**
- Whisper API (OpenAI) für Speech-to-Text
- Text-to-Speech für Antworten
- Wake-Word-Detection (optional)

**Deliverables:**
- Chat-Interface `/admin/shopfloor/chat`
- Slack-Integration (Shopfloor-Bot in Team-Slack)
- Mobile-App-Integration (optional)

---

### Phase 7: Continuous Learning (Woche 23-26)

**Ziel:** System wird selbstständig besser

#### 7.1 Feedback-Loop-System
**Aufgabe:** Aus Erfolgen und Fehlern lernen

**Feedback-Quellen:**
1. **Implicit Feedback:**
   - Wurden AI-Empfehlungen umgesetzt? (Ja/Nein)
   - Hat es geholfen? (Metrik-Verbesserung)

2. **Explicit Feedback:**
   - Thumbs-Up/Down bei Chat-Antworten
   - Kommentare zu Insights
   - Task-Resolution-Status

3. **Outcome-Tracking:**
   - Metric: Conversion-Rate
   - Action: Neue Reminder-Email
   - Result: +5% Conversion
   - Learning: Reminder-Timing ist wichtig

**Implementation:**
```typescript
// lib/shopfloor/learningEngine.ts

interface Learning {
  id: string
  situation: string // "Low conversion rate"
  action: string // "Sent reminder emails earlier"
  outcome: {
    metric: string // "conversionRate"
    before: number // 0.28
    after: number // 0.33
    change: number // +17.9%
  }
  confidence: number // 0.85
  timestamp: Date
}

// Nach jeder Action tracken
await trackOutcome({
  actionId: 'reminder-optimization',
  metrics: ['conversionRate', 'responseTime'],
  timeframe: '7d'
})

// Learnings extrahieren
const learnings = await extractLearnings()

// In Knowledge-Base speichern
await storeInVectorDB(learnings)

// Zukünftige Empfehlungen verbessern
const improvedRecommendation = await getRecommendation({
  situation: 'low-conversion',
  pastLearnings: learnings
})
```

#### 7.2 A/B-Testing-Engine
**Aufgabe:** Systematisch experimentieren

**Framework:**
```typescript
interface Experiment {
  id: string
  hypothesis: string // "Frühere Reminder erhöhen Conversion"
  variants: {
    control: Action // Status Quo
    treatment: Action // Neue Strategie
  }
  metrics: string[] // ['conversionRate', 'responseTime']
  sampleSize: number
  duration: string // '14d'
  status: 'running' | 'completed' | 'paused'
  result?: {
    winner: 'control' | 'treatment' | 'inconclusive'
    significance: number // p-value
    lift: number // % improvement
  }
}

// Automatische Experiment-Vorschläge
const suggestedExperiments = await aiAgent.suggestExperiments({
  area: 'operations',
  goal: 'increase-conversion'
})

// Experiment starten
await startExperiment(suggestedExperiments[0])

// Nach Ende: Automatische Auswertung
const result = await analyzeExperiment(experimentId)
if (result.winner === 'treatment' && result.significance < 0.05) {
  await rolloutToProduction(result.treatment)
}
```

#### 7.3 Self-Improvement-Cycle
**Aufgabe:** System optimiert sich selbst

**Cycle:**
1. **Observe:** Metrics sammeln, Probleme erkennen
2. **Hypothesize:** AI schlägt Lösungen vor
3. **Experiment:** A/B-Test durchführen
4. **Learn:** Ergebnisse auswerten
5. **Optimize:** Bessere Variante ausrollen
6. **Repeat:** Nächstes Problem angehen

**Auto-Optimization-Areas:**
- Prompt-Engineering (welche Prompts liefern beste Ergebnisse?)
- Feature-Engineering (welche Features sind prädiktiv?)
- Threshold-Tuning (wann ist Alert sinnvoll?)
- Resource-Allocation (Server, Datenbank, Caching)

**Deliverables:**
- Learning-Dashboard (Was haben wir gelernt?)
- Experiment-Tracker (Laufende Tests)
- Knowledge-Base (Searchable Insights)

---

### Phase 8: Enterprise Features (Woche 27-30)

**Ziel:** Production-Ready & Skalierbar

#### 8.1 Security & Compliance
- **Audit-Log:** Jede AI-Action wird protokolliert
- **Role-Based-Access:** Wer darf Shopfloor nutzen?
- **Data-Privacy:** GDPR-konform (Daten-Anonymisierung)
- **API-Keys-Management:** Sichere Speicherung
- **Rate-Limiting:** Missbrauch verhindern

#### 8.2 Multi-Tenancy (Optional)
- **Use Case:** Shopfloor als SaaS für andere Unternehmen
- **Tenant-Isolation:** Daten strikt getrennt
- **Custom-Rules:** Jeder Tenant eigene Workflows

#### 8.3 Performance & Scalability
- **Caching:** Redis für häufige Queries
- **Query-Optimization:** Datenbank-Indizes
- **Background-Jobs:** Queue-System (BullMQ)
- **Load-Balancing:** Mehrere Worker-Nodes
- **Horizontal-Scaling:** Mehr Server bei Bedbedarf

#### 8.4 Monitoring & Observability
- **Prometheus Metrics:** Alle KPIs exportieren
- **Grafana Dashboards:** Visualisierung
- **Sentry Error-Tracking:** Fehler sofort erkennen
- **LangSmith LLM-Tracing:** AI-Calls debuggen
- **Uptime-Monitoring:** 99.9% Verfügbarkeit

**Deliverables:**
- Production-Deployment
- Security-Audit bestanden
- Performance-Benchmarks erfüllt

---

## 🛠️ Technische Implementation

### Datenbank-Schema (Prisma)

```prisma
// prisma/schema.prisma

// ============= SHOPFLOOR MODELS =============

model ShopfloorTask {
  id          String   @id @default(cuid())
  title       String
  description String?
  area        String   // 'operations', 'marketing', 'support', 'finance', 'hr', 'tech'
  priority    String   // 'critical', 'high', 'medium', 'low'
  status      String   @default("open") // 'open', 'in_progress', 'completed', 'cancelled'
  effort      String?  // 'hours', 'days', 'weeks'
  impact      Json?    // { revenue: 'high', stability: 'medium', ... }
  
  assignedTo  String?
  assignedAt  DateTime?
  completedAt DateTime?
  dueDate     DateTime?
  
  createdBy   String   // 'ai' or userId
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  workflow    ShopfloorWorkflow? @relation(fields: [workflowId], references: [id])
  workflowId  String?
  
  insights    ShopfloorInsight[]
  
  @@index([area, status])
  @@index([priority])
  @@index([createdAt])
}

model ShopfloorWorkflow {
  id           String   @id @default(cuid())
  name         String
  description  String?
  area         String
  
  // Workflow-Definition (JSON)
  definition   Json     // { steps: [...], triggers: [...], conditions: [...] }
  
  // Metrics
  executionCount Int    @default(0)
  successRate    Float  @default(0)
  avgDuration    Float  @default(0)
  
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  tasks        ShopfloorTask[]
  logs         ShopfloorLog[]
  
  @@index([area])
  @@index([isActive])
}

model ShopfloorInsight {
  id          String   @id @default(cuid())
  title       String
  description String
  category    String   // 'optimization', 'risk', 'opportunity', 'learning'
  
  // Kontext
  area        String
  relatedData Json?    // IDs von betroffenen Entitäten
  
  // Wichtigkeit
  priority    String   // 'critical', 'high', 'medium', 'low'
  confidence  Float    // 0.0 - 1.0
  
  // Action
  suggestedActions Json? // [{ action: '...', steps: [...] }]
  
  // Feedback
  helpful     Boolean?
  feedback    String?
  
  // Relations
  task        ShopfloorTask? @relation(fields: [taskId], references: [id])
  taskId      String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([area, priority])
  @@index([createdAt])
}

model ShopfloorMetric {
  id        String   @id @default(cuid())
  name      String   // 'conversionRate', 'avgResponseTime', etc.
  area      String
  value     Float
  unit      String?  // '%', 'seconds', 'EUR', etc.
  
  // Kontext
  dimensions Json?   // { region: 'Berlin', service: 'tire-change' }
  
  timestamp DateTime @default(now())
  
  @@index([name, timestamp])
  @@index([area])
}

model ShopfloorLog {
  id         String   @id @default(cuid())
  type       String   // 'task_created', 'workflow_executed', 'insight_generated', 'action_taken'
  message    String
  
  // Kontext
  area       String?
  entityType String?  // 'task', 'workflow', 'metric', etc.
  entityId   String?
  
  // Details
  details    Json?
  
  // Relations
  workflow   ShopfloorWorkflow? @relation(fields: [workflowId], references: [id])
  workflowId String?
  
  createdAt  DateTime @default(now())
  
  @@index([type, createdAt])
  @@index([area])
}

model ShopfloorAutomationRule {
  id          String   @id @default(cuid())
  name        String
  description String?
  
  // Trigger
  triggerType   String // 'schedule', 'event', 'condition'
  triggerConfig Json   // { cron: '...', event: '...', condition: '...' }
  
  // Conditions
  conditions    Json
  
  // Actions
  actions       Json   // [{ type: '...', config: {...} }]
  
  // Safety
  safetyChecks  Json?
  rollbackPlan  String?
  
  // Approval
  requiresAiApproval    Boolean @default(false)
  requiresHumanApproval Boolean @default(false)
  
  // Status
  isActive      Boolean @default(true)
  lastExecuted  DateTime?
  executionCount Int    @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([isActive])
}

model ShopfloorExperiment {
  id          String   @id @default(cuid())
  name        String
  hypothesis  String
  
  // Variants
  control     Json     // { name: 'Control', config: {...} }
  treatment   Json     // { name: 'Treatment', config: {...} }
  
  // Metrics
  metrics     String[] // ['conversionRate', 'responseTime']
  
  // Configuration
  sampleSize  Int
  duration    String   // '14d'
  
  // Status
  status      String   @default("draft") // 'draft', 'running', 'completed', 'paused'
  
  // Results
  result      Json?    // { winner: 'treatment', significance: 0.03, lift: 0.15 }
  
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status])
}
```

### API-Struktur

```
/api/shopfloor/
├── analyze                  POST   AI-Analyse (Natural Language)
├── chat                     POST   Chat-Interface
├── tasks
│   ├── GET                         Liste aller Tasks
│   ├── POST                        Neuen Task erstellen
│   └── [id]
│       ├── GET                     Task-Details
│       ├── PATCH                   Task aktualisieren
│       └── DELETE                  Task löschen
├── workflows
│   ├── GET                         Liste aller Workflows
│   ├── POST                        Neuen Workflow erstellen
│   └── [id]
│       ├── GET                     Workflow-Details
│       ├── POST /execute           Workflow ausführen
│       └── GET /logs               Execution-Logs
├── insights
│   ├── GET                         Aktuelle Insights
│   └── [id]/feedback    POST      Feedback geben
├── metrics
│   ├── GET                         Metrics abfragen
│   └── POST                        Metric speichern
├── automation
│   ├── rules
│   │   ├── GET                    Liste aller Rules
│   │   ├── POST                   Neue Rule erstellen
│   │   └── [id]
│   │       ├── GET                Rule-Details
│   │       ├── PATCH              Rule aktualisieren
│   │       └── POST /execute      Rule manuell ausführen
│   └── experiments
│       ├── GET                    Liste aller Experimente
│       ├── POST                   Neues Experiment starten
│       └── [id]
│           ├── GET                Experiment-Status
│           ├── POST /start        Experiment starten
│           ├── POST /pause        Experiment pausieren
│           └── POST /complete     Experiment beenden & auswerten
└── dashboards
    ├── /operations              GET  Operations-Dashboard-Daten
    ├── /marketing               GET  Marketing-Dashboard-Daten
    ├── /support                 GET  Support-Dashboard-Daten
    ├── /finance                 GET  Finance-Dashboard-Daten
    ├── /hr                      GET  HR-Dashboard-Daten
    └── /tech                    GET  Tech-Dashboard-Daten
```

---

## 📈 Success Metrics

### Phase 0-2 (Wochen 1-6)
- [ ] Datenbank-Schema deployed
- [ ] Code-Knowledge-Base erstellt (100% des Codes indexed)
- [ ] Monitoring-Dashboard zeigt Real-Time-Daten

### Phase 3-4 (Wochen 7-14)
- [ ] AI-Agent liefert relevante Insights (>80% Accuracy)
- [ ] Mindestens 5 Workflows automatisiert
- [ ] Self-Healing verhindert 1+ Outage

### Phase 5-6 (Wochen 15-22)
- [ ] 6 spezialisierte Dashboards live
- [ ] Chat-Interface wird täglich genutzt (>10 Fragen/Tag)
- [ ] AI-Empfehlungen werden umgesetzt (>50% Acceptance-Rate)

### Phase 7-8 (Wochen 23-30)
- [ ] System lernt kontinuierlich (5+ neue Insights/Woche)
- [ ] A/B-Tests laufen automatisch (2+ parallel)
- [ ] Production-Ready (99.9% Uptime, <500ms Response-Time)

---

## 💰 Kosten-Schätzung

### Infrastructure (monatlich)
- **Redis Cloud:** ~€30/Monat (256MB, für Caching + Queue)
- **Pinecone (Vector DB):** ~€70/Monat (Starter Plan)
- **Prometheus + Grafana Cloud:** ~€50/Monat
- **Sentry (Error Tracking):** ~€26/Monat (Team Plan)
- **Axiom (Logs):** ~€25/Monat (Starter)

**Subtotal Infrastructure:** ~€200/Monat

### AI/LLM-Kosten (monatlich)
- **OpenAI GPT-4 Turbo:**
  - ~500k Tokens Input/Tag @ $0.01/1k = €4.50/Tag = €135/Monat
  - ~100k Tokens Output/Tag @ $0.03/1k = €2.70/Tag = €81/Monat
- **OpenAI Embeddings (text-embedding-3):**
  - ~10M Tokens/Monat @ $0.00013/1k = €1.30/Monat
- **Claude 3.5 Sonnet (Backup):**
  - ~100k Tokens/Tag @ $0.003/1k = €0.27/Tag = €8.10/Monat

**Subtotal AI:** ~€225/Monat

### Development (einmalig)
- **Phase 0-2:** ~80 Stunden (Foundation + Monitoring)
- **Phase 3-4:** ~120 Stunden (AI Brain + Automation)
- **Phase 5-6:** ~100 Stunden (Cross-Functional + Chat)
- **Phase 7-8:** ~80 Stunden (Learning + Enterprise)

**Total Development:** ~380 Stunden

**Bei 100€/Stunde → €38,000 (einmalig)**

### Total Cost of Ownership (Erstes Jahr)
- Development: €38,000 (einmalig)
- Infrastructure + AI: €425/Monat × 12 = €5,100/Jahr
- **Total Year 1:** ~€43,000

**Ab Jahr 2:** ~€5,100/Jahr (nur laufende Kosten)

---

## 🎯 ROI-Prognose

### Erwartete Verbesserungen (Jahr 1)

| Bereich | Metrik | Aktuell | Target | Impact |
|---------|--------|---------|--------|--------|
| **Operations** | Conversion-Rate | 31% | 38% | +€150k/Jahr |
| **Operations** | Avg. Response-Time | 4.2h | 2.8h | +5% Conv. → +€50k |
| **Support** | Ticket-Resolution-Time | 8h | 4h | -50% Workload |
| **Marketing** | CAC (Customer-Acq.-Cost) | €45 | €35 | -22% → +€80k |
| **Tech** | Deployment-Frequency | 2x/Woche | 10x/Woche | +Velocity |
| **Tech** | MTTR (Mean Time to Repair) | 45min | 15min | -67% Downtime |
| **Finance** | Manual-Accounting-Hours | 20h/Monat | 5h/Monat | -€18k/Jahr |

**Estimated Total Impact:** +€280k/Jahr (konservativ)

**ROI:** €280k / €43k = **6.5x** im ersten Jahr

---

## ⚠️ Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| **AI-Kosten explodieren** | Mittel | Hoch | Rate-Limiting, Caching, Prompt-Optimization |
| **Datenqualität unzureichend** | Mittel | Hoch | Data-Cleaning, Validation-Rules |
| **Team-Adoption niedrig** | Hoch | Mittel | Onboarding, Training, Quick-Wins zeigen |
| **AI-Fehler verursachen Probleme** | Niedrig | Hoch | Human-in-the-Loop, Safety-Checks, Rollback-Plan |
| **Vendor-Lock-In (OpenAI)** | Niedrig | Mittel | Multi-LLM-Strategy (Claude als Backup) |
| **Complexity-Overload** | Mittel | Mittel | MVP-First, iterative Entwicklung |

---

## 🚀 Start-Voraussetzungen (vor Projektbeginn)

### ✅ MUSS ERLEDIGT SEIN:

1. **HR Management System Phase 2 abgeschlossen:**
   - [ ] HR-Formulare vollständig getestet
   - [ ] API-Integration validiert
   - [ ] Berechtigungssystem funktioniert
   - [ ] Admin-Dashboard vollständig
   - [ ] End-to-End-Tests erfolgreich

2. **Optional: HR Management Phase 3 (Gehaltsabrechnung):**
   - [ ] Payroll-Calculator implementiert
   - [ ] PDF-Generator für Gehaltsabrechnungen
   - [ ] Payroll-Management-UI

### Dann: KI Shopfloor Start

### Woche 1 (nach HR-Completion):
1. **Projekt-Kick-Off:** Grünes Licht für Shopfloor
2. **API-Keys besorgen:**
   - OpenAI API Key
   - Pinecone Account erstellen
3. **Datenbank-Schema erstellen:**
   - Prisma Models hinzufügen (siehe oben)
   - `npx prisma migrate dev --name shopfloor-init`
4. **Admin-Seite erstellen:**
   - `/admin/shopfloor` (Basis-Dashboard)
5. **Erster Proof-of-Concept:**
   - Einfache Metrik-Sammlung (z.B. "Anfragen pro Tag")
   - AI-Analyse: "Warum ist Conversion-Rate niedrig?"

### Woche 2:
- Redis + BullMQ Setup
- Erste Code-Analyse (alle API-Routes einlesen)
- Vector-DB-Integration (Embeddings erstellen)

### Ab Woche 3:
- Roadmap Schritt-für-Schritt abarbeiten

---

## 📚 Technologie-Dokumentation

### Empfohlene Libraries

**AI & LLM:**
```json
{
  "langchain": "^0.1.0",
  "@langchain/openai": "^0.0.14",
  "@anthropic-ai/sdk": "^0.10.0",
  "openai": "^4.24.0"
}
```

**Vector DB:**
```json
{
  "@pinecone-database/pinecone": "^1.1.2"
}
```

**Queue & Background Jobs:**
```json
{
  "bullmq": "^5.1.0",
  "ioredis": "^5.3.2"
}
```

**Code-Analyse:**
```json
{
  "ts-morph": "^21.0.0",
  "@typescript-eslint/parser": "^6.18.0"
}
```

**Monitoring:**
```json
{
  "@sentry/nextjs": "^7.99.0",
  "prom-client": "^15.1.0"
}
```

**Data Visualization:**
```json
{
  "recharts": "^2.10.0",
  "reactflow": "^11.10.0"
}
```

---

## 🎓 Learning Resources

### AI & LLM
- **LangChain Docs:** https://js.langchain.com/docs/
- **OpenAI Cookbook:** https://github.com/openai/openai-cookbook
- **Prompt Engineering Guide:** https://www.promptingguide.ai/

### Vector Databases
- **Pinecone Docs:** https://docs.pinecone.io/
- **RAG Tutorial:** https://www.pinecone.io/learn/retrieval-augmented-generation/

### Agent Systems
- **AutoGPT:** https://github.com/Significant-Gravitas/AutoGPT
- **LangGraph:** https://langchain-ai.github.io/langgraph/

### Business Process Mining
- **Process Mining Book:** https://www.processmining.org/
- **BPMN Tutorial:** https://www.bpmn.org/

---

## 🤝 Team & Rollen

### Empfohlene Rollen

**Phase 0-2 (Foundation):**
- 1x **Full-Stack Developer** (Next.js, Prisma, API)
- 1x **DevOps Engineer** (Redis, Queue, Monitoring)

**Phase 3-4 (AI Integration):**
- 1x **AI/ML Engineer** (LangChain, Embeddings, RAG)
- 1x **Backend Developer** (APIs, Automation)

**Phase 5-6 (Cross-Functional):**
- 1x **Frontend Developer** (Dashboards, Visualisierungen)
- 1x **UX Designer** (Chat-Interface, Workflows)

**Phase 7-8 (Enterprise):**
- 1x **Security Engineer** (Audit, Compliance)
- 1x **QA Engineer** (Testing, Monitoring)

**Ongoing:**
- 1x **Product Manager** (Roadmap, Priorisierung)
- 1x **Data Analyst** (Metrics, Reports)

---

## 🎉 Success Stories (Vorausschauend)

### Nach 3 Monaten:
> "Der Shopfloor hat uns gezeigt, dass 40% unserer Support-Tickets durch eine FAQ-Seite gelöst werden könnten. Wir haben die Seite gebaut und Tickets um 35% reduziert."

### Nach 6 Monaten:
> "Die AI hat erkannt, dass Werkstätten in Berlin 3x schneller antworten als in München. Wir haben das Recruiting-Team nach München geschickt und 12 neue Werkstätten aktiviert. Conversion-Rate in München ist jetzt auf Berlin-Niveau."

### Nach 12 Monaten:
> "Der Shopfloor managed jetzt 80% unserer Operations-Workflows automatisch. Das Team kann sich auf strategische Projekte konzentrieren. Revenue ist um 45% gestiegen, Team-Größe nur um 20%."

---

## 📞 Support & Fragen

**Für technische Fragen:**
- GitHub Issues erstellen im Bereifung24-Repo
- Tag: `shopfloor`

**Für Roadmap-Updates:**
- Siehe `AI_SHOPFLOOR_STATUS.md` (wird wöchentlich aktualisiert)

---

## ✅ Nächste Schritte

**JETZT (Priorität 1):**
1. [ ] HR Management System Phase 2 fertigstellen
2. [ ] HR-Formulare testen (End-to-End)
3. [ ] Berechtigungssystem validieren
4. [ ] Optional: Gehaltsabrechnungs-Engine implementieren

**DANACH (Priorität 2 - KI Shopfloor):**
1. [ ] Roadmap reviewen und Feedback geben
2. [ ] Budget & Resources freigeben
3. [ ] Team-Kick-Off-Meeting planen
4. [ ] OpenAI API Key beantragen
5. [ ] Phase 0 starten (Woche 1-2)

---

**Erstellt:** 11. Januar 2026  
**Letzte Aktualisierung:** 11. Januar 2026  
**Version:** 1.0  
**Status:** 🟡 Geplant (wartet auf HR-Completion)

---

**Erst HR fertig machen, dann Shopfloor starten! 🎯**
