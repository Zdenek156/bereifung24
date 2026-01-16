# Sales & CRM Module - Roadmap

## Phase 1: Prospect Search & Management ✅
- [x] Google Places API Integration
- [x] Advanced search filters (city, rating, lead score, status)
- [x] Prospect list with pagination
- [x] Lead scoring system
- [x] Territory assignment

## Phase 2: Prospect Detail Dialog ✅
- [x] Tab Navigation (Info, Notizen, Aufgaben, Aktivitäten)
- [x] Info Tab: Prospect details, lead score, Google Maps
- [x] Notizen Tab: CRUD operations, auto-create ProspectWorkshop
- [x] Aufgaben Tab: Task creation with employee assignment, priority, due date
- [x] Unified Status System (Offen, In Arbeit, Abgeschlossen)
- [x] Delete permissions (creator-only)
- [x] Aktivitäten Tab: Timeline combining notes, tasks, interactions

## Phase 3: Advanced Sales Features (PLANNED)

### Option 1: 📧 Email-Integration
- [ ] Email senden direkt aus Activity Tab
- [ ] Email-Templates für Outreach
- [ ] Email-Tracking (geöffnet, geklickt)
- [ ] Email-Thread-Verlauf in Timeline
- [ ] Automatische Email-Logging aus Employee Email-Accounts

### Option 2: 📞 Call Logging
- [ ] Call-Log Dialog mit Datum, Dauer, Outcome
- [ ] Call-Notizen und Follow-up Actions
- [ ] Call-History in Activity Timeline
- [ ] Call-Outcome-Kategorien (Interested, Not Interested, Callback, etc.)
- [ ] Integration mit VoIP-System (optional)

### Option 3: 📅 Meeting Scheduling
- [ ] Meeting direkt im Prospect Dialog vereinbaren
- [ ] Google Calendar Integration
- [ ] Meeting-Reminder per Email
- [ ] Meeting-Notes nach Termin
- [ ] Video-Call-Links (Google Meet/Zoom)

### Option 4: 🔄 Prospect Conversion Workflow ⭐ (NEXT)
- [ ] Status-Pipeline: New → Contacted → Qualified → Negotiation → Converted → Lost
- [ ] Conversion-Button im Detail Dialog
- [ ] Automatische Workshop-Erstellung aus Prospect
- [ ] Datenübernahme (Name, Adresse, Google Place Data)
- [ ] Conversion-Tracking & Analytics
- [ ] Lost-Reason-Kategorien
- [ ] Re-engagement für Lost Prospects

### Option 5: 📊 Sales Pipeline Dashboard
- [ ] Kanban Board für Lead Status
- [ ] Drag & Drop zwischen Status-Spalten
- [ ] Pipeline-Metrics (Conversion Rate, Avg. Time per Stage)
- [ ] Forecast-Berechnung
- [ ] Activity-Heatmap
- [ ] Sales Team Performance Dashboard

## Phase 4: Automation & Intelligence (FUTURE)
- [ ] Automated Lead Scoring basierend auf Interaktionen
- [ ] Auto-Assignment nach Territory/Workload
- [ ] Email-Sequences & Drip Campaigns
- [ ] Duplicate Detection & Merge
- [ ] Sales Assistant AI (Next Best Action)
- [ ] Integration mit WhatsApp Business API

## Integration Points
- ✅ Employee Task System (unified tasks)
- ✅ Employee Dashboard (open tasks count)
- ✅ ProspectWorkshop auto-creation
- 🔄 Workshop Registration (conversion target)
- 🔄 Google Calendar (meeting scheduling)
- 🔄 Email System (outreach tracking)
- 🔄 Notification System (reminders, alerts)

## Technical Debt & Improvements
- [ ] Optimize Google Places API calls (caching)
- [ ] Add real-time updates (WebSocket for team collaboration)
- [ ] Export prospects to CSV/Excel
- [ ] Bulk actions (assign, update status, delete)
- [ ] Advanced filters (custom date ranges, multi-select)
- [ ] Mobile-optimized views
