__FEATURE\-SPEZIFIKATION__

__FREELANCER\-DASHBOARD__

Technische Spezifikation für die Entwicklung

__Bereifung24 GmbH__

__Dokument:__

Feature\-Spezifikation Freelancer\-Dashboard

__Version:__

1\.0

__Datum:__

März 2026

__Route:__

/freelancer/dashboard/\*

__Rolle:__

FREELANCER \(neue Benutzerrolle\)

__Status:__

__ENTWURF – VERTRAULICH__

# Inhaltsübersicht

1. Kontext & Ziele
2. Benutzerrolle & Berechtigungen
3. Dashboard\-Module im Überblick
4. Modul 1: Übersicht & KPIs
5. Modul 2: Meine Werkstätten
6. Modul 3: Lead\-Pipeline & CRM
7. Modul 4: Provisionen & Einnahmen
8. Modul 5: Abrechnung & Rechnungen
9. Modul 6: Vertriebsmaterialien
10. Modul 7: Mein Profil & Einstellungen
11. Datenmodell \(Prisma\)
12. API\-Endpunkte
13. Sicherheit & Datenschutz
14. Implementierungsreihenfolge

# 1\. Kontext & Ziele

Bereifung24 setzt auf freie Vertriebsmitarbeiter \(Freelancer\), die auf rein erfolgsbasierter Provisionsbasis neue Werkstätten für die Plattform akquirieren\. Das Freelancer\-Dashboard ist das zentrale Arbeitstool für diese Vertriebspartner\.

## 1\.1 Ziele des Dashboards

- __Transparenz: __Freelancer sieht jederzeit seine Einnahmen, Performance und den Status seiner Werkstätten
- __Arbeitstool: __Lead\-Management, Werkstatt\-Onboarding\-Tracking und Nachbetreuung an einem Ort
- __Selbstverwaltung: __Provisionsabrechnungen exportieren, Stammdaten pflegen, Rechnungsgrundlagen generieren
- __Motivation: __Gamification durch Stufensystem, Fortschrittsbalken und Vergleichszeiträume
- __Minimaler Admin\-Aufwand: __Automatisierte Provisionsberechnung, kein manuelles Tracking durch B24\-Team

## 1\.2 Abgrenzung

__Was der Freelancer NICHT sehen darf__

Finanzdaten anderer Freelancer • Endkunden\-Personendaten \(Name, E\-Mail, Telefon\) • Werkstatt\-Details fremder Freelancer • Interne B24\-Margen und Gesamtumsätze • Admin\-Panel\-Funktionen • Buchhaltungsdaten • HR\-Modul • Andere Freelancer\-Profile oder deren Performance

# 2\. Benutzerrolle & Berechtigungen

## 2\.1 Neue Rolle: FREELANCER

Im bestehenden Rollen\-System \(CUSTOMER, WORKSHOP, ADMIN, B24\_EMPLOYEE\) wird eine neue Rolle FREELANCER eingeführt\. Diese Rolle hat einen eigenen Berechtigungsscope:

__Bereich__

__Zugriff__

__Details__

__Eigene Werkstätten__

Lesen

Nur Werkstätten mit freelancerId = eigene ID

__Werkstatt\-Buchungen__

Aggregiert \(nur Zahlen\)

Anzahl \+ Volumen, keine Kundendaten

__Eigene Leads__

Lesen, Erstellen, Bearbeiten

Vollzugriff auf eigene Pipeline

__Provisionen__

Lesen

Nur eigene Provisionshistorie

__Abrechnungen__

Lesen, Exportieren

PDF\-Export der eigenen Abrechnung

__Vertriebsmaterialien__

Lesen, Herunterladen

Zugriff auf freigegebene Dokumente

__Eigenes Profil__

Lesen, Bearbeiten

Stammdaten, Gewerbedaten, Bankdaten

## 2\.2 Authentifizierung

- Login über bestehenden Auth\-Flow \(E\-Mail \+ Passwort oder Magic Link\)
- Registrierung nur per Einladungslink vom Admin \(kein Self\-Signup\)
- Middleware\-Check: role === 'FREELANCER' für alle /freelancer/\* Routen
- Session\-Token enthält freelancerId für alle API\-Aufrufe

# 3\. Dashboard\-Module im Überblick

Das Freelancer\-Dashboard besteht aus 7 Modulen, erreichbar über eine Sidebar\-Navigation:

__\#__

__Modul__

__Zweck__

__Route__

__Prio__

__1__

__Übersicht & KPIs__

Startseite mit allen wichtigen Kennzahlen

/

__MUST__

__2__

__Meine Werkstätten__

Status & Gesundheitscheck aller akquirierten WS

/workshops

__MUST__

__3__

__Lead\-Pipeline__

CRM für Akquise: Leads anlegen, tracken, nachfassen

/leads

__MUST__

__4__

__Provisionen__

Einnahmenübersicht, Aufschlüsselung nach WS

/earnings

__MUST__

__5__

__Abrechnung__

Monatsabrechnungen, PDF\-Export, Rechnungsvorlage

/billing

__MUST__

__6__

__Materialien__

Downloads: Präsentationen, Vorlagen, Affiliate\-Link

/materials

__SHOULD__

__7__

__Mein Profil__

Stammdaten, Gewerbedaten, Bankverbindung

/profile

__MUST__

# 4\. Modul 1: Übersicht & KPIs

Die Startseite zeigt dem Freelancer auf einen Blick, wie es läuft\. Sie besteht aus KPI\-Karten, einem Aktivitäts\-Chart und einem Stufenfortschritt\.

## 4\.1 KPI\-Karten \(oberer Bereich\)

__Feature__

__Beschreibung__

__Priorität__

__Status__

__Provision aktueller Monat__

Summe der bisher angefallenen Provision im laufenden Monat in €, mit Vergleich zum Vormonat in %

__MUST__

Neu

__Aktive Werkstätten__

Anzahl der Werkstätten mit Status AKTIV, die dem Freelancer zugeordnet sind

__MUST__

Neu

__Buchungen diesen Monat__

Gesamtzahl der Buchungen über seine Werkstätten im aktuellen Monat

__MUST__

Neu

__Offene Leads__

Anzahl Leads in der Pipeline mit Status ≠ ABGESCHLOSSEN und ≠ VERLOREN

__MUST__

Neu

__Conversion Rate__

Leads → aktive Werkstätten in %, berechnet über alle Zeiten

__SHOULD__

Neu

## 4\.2 Aktivitäts\-Chart

- Liniendiagramm: Buchungen und Provisionen der letzten 6 Monate
- Umschaltbar zwischen: Buchungsanzahl, Buchungsvolumen, Provisionseinnahmen
- Bibliothek: Recharts \(bereits im Stack\)

## 4\.3 Stufenfortschritt

Visueller Fortschrittsbalken zur nächsten Provisionsstufe:

__Stufe__

__Bedingung__

__Revenue Share__

__Farbe__

__Starter__

1–10 aktive Werkstätten

20%

Grau / Bronze

__Pro__

11–30 aktive Werkstätten

25%

Blau / Silber

__Expert__

31\+ aktive Werkstätten

30%

Orange / Gold

Anzeige: „Du bist Pro\-Freelancer \(18/30 Werkstätten\) – noch 12 Werkstätten bis Expert\!“ mit visuellem Fortschrittsbalken\.

## 4\.4 Letzte Aktivitäten

- Feed mit den letzten 10 Ereignissen: Neue Buchung bei WS X, Lead Y hat sich registriert, Provision ausgezahlt, etc\.
- Jeder Eintrag mit Zeitstempel, Icon und Link zur Detailansicht

# 5\. Modul 2: Meine Werkstätten

Herzstück der Nachbetreuung: Der Freelancer sieht alle Werkstätten, die über seinen Affiliate\-Link registriert wurden, und kann deren „Gesundheit“ monitoren\.

## 5\.1 Werkstatt\-Liste

__Feature__

__Beschreibung__

__Priorität__

__Status__

__Filterable Liste__

Tabelle aller zugeordneten Werkstätten mit Suche, Sortierung und Statusfilter

__MUST__

Neu

__Status\-Badges__

ONBOARDING → AKTIV → INAKTIV \(keine Buchung seit 60 Tagen\) → ABGEWANDERT \(keine Buchung seit 120 Tagen\)

__MUST__

Neu

__Buchungszahlen__

Buchungen aktueller Monat und Trend vs\. Vormonat \(↑ ↓ →\)

__MUST__

Neu

__Provisionsanteil__

Wie viel Provision hat diese Werkstatt dem Freelancer im aktuellen Monat eingebracht

__MUST__

Neu

__Registrierungsdatum__

Wann wurde die Werkstatt registriert \(Dauer auf Plattform\)

__SHOULD__

Neu

## 5\.2 Werkstatt\-Detailansicht

Klick auf eine Werkstatt öffnet eine Detailseite mit:

__Feature__

__Beschreibung__

__Priorität__

__Status__

__Profilvollständigkeit__

Fortschrittsbalken: Profilbild, Öffnungszeiten, Services, Beschreibung, Bilder – mit Hinweisen was fehlt

__MUST__

Neu

__Buchungs\-Timeline__

Monatsübersicht der Buchungsanzahl als Balkendiagramm \(letzte 6 Monate\)

__MUST__

Neu

__Bewertungs\-Score__

Durchschnittsbewertung und Anzahl Bewertungen der Werkstatt

__SHOULD__

Neu

__Services gelistet__

Welche Services die Werkstatt anbietet \(Reifenwechsel, Ölwechsel, HU/AU etc\.\)

__SHOULD__

Neu

__Kontaktdaten WS__

Telefon, E\-Mail, Ansprechpartner der Werkstatt für Nachbetreuung

__MUST__

Neu

__Notizen__

Freitextfeld für Freelancer\-Notizen zur Werkstatt \(z\.B\. „Inhaber will mehr Services listen“\)

__SHOULD__

Neu

## 5\.3 Gesundheits\-Ampel

Automatische Einstufung jeder Werkstatt:

__Ampel__

__Bedingung__

__Empfohlene Aktion__

__🟢 GRÜN__

5\+ Buchungen im letzten Monat, Profil vollständig

Keine Aktion nötig

__🟡 GELB__

1–4 Buchungen oder Profil unvollständig

Nachfassen: Profil optimieren, Services ergänzen

__🔴 ROT__

0 Buchungen seit 30\+ Tagen

Dringend: Kontakt aufnehmen, Ursache klären

Auf der Werkstatt\-Übersichtsseite werden Werkstätten mit roter Ampel immer oben angezeigt, damit der Freelancer sofort sieht, wo Handlungsbedarf besteht\.

# 6\. Modul 3: Lead\-Pipeline & CRM

Mini\-CRM für die Akquisearbeit des Freelancers\. Hier verwaltet er seine Kontakte von der Erstansprache bis zum erfolgreichen Onboarding\.

## 6\.1 Pipeline\-Stufen

__Status__

__Beschreibung__

__Nächster Schritt__

__NEU__

Werkstatt identifiziert, noch nicht kontaktiert

Erstansprache planen

__KONTAKTIERT__

Erste Kontaktaufnahme erfolgt \(Telefon, E\-Mail, Besuch\)

Follow\-up terminieren

__DEMO__

Demo der Plattform vereinbart oder durchgeführt

Entscheidung einholen

__ONBOARDING__

Werkstatt hat sich registriert, Profil wird eingerichtet

Profil vervollständigen

__AKTIV__

Werkstatt ist live und erhält Buchungen → automatischer Übergang zu Modul 2

– \(Nachbetreuung\)

__VERLOREN__

Werkstatt hat abgelehnt oder reagiert nicht mehr

Grund dokumentieren

## 6\.2 Lead\-Features

__Feature__

__Beschreibung__

__Priorität__

__Status__

__Kanban\-Board__

Drag & Drop\-Ansicht der Pipeline\-Stufen \(wie Trello\) – alternativ Tabellenansicht

__MUST__

Neu

__Lead erstellen__

Formular: Werkstattname, Ansprechpartner, Telefon, E\-Mail, Adresse, Notizen

__MUST__

Neu

__Wiedervorlage__

Datum \+ Uhrzeit für nächsten Kontakt, erscheint als Reminder auf der Übersicht

__MUST__

Neu

__Aktivitäten\-Log__

Chronologisches Log pro Lead: Anruf, E\-Mail, Besuch, Notiz – mit Timestamp

__MUST__

Neu

__Verlustgrund__

Bei Status VERLOREN: Dropdown mit Gründen \(kein Interesse, nutzt Wettbewerber, zu klein, etc\.\)

__SHOULD__

Neu

__Automatische Übernahme__

Wenn Lead sich über Affiliate\-Link registriert → Status wechselt automatisch zu ONBOARDING

__MUST__

Neu

__Bulk\-Import__

CSV\-Import von Werkstattlisten \(Name, Adresse, Telefon\)

__COULD__

Neu

# 7\. Modul 4: Provisionen & Einnahmen

Volle Transparenz über alle Einnahmen – aufgeschlüsselt nach Werkstatt, Monat und Buchung\.

## 7\.1 Übersicht

__Feature__

__Beschreibung__

__Priorität__

__Status__

__Monatsübersicht__

Tabelle: Monat | Buchungen | Buchungsvolumen | B24\-Netto | Mein Anteil | Stufe | Status \(ausstehend/ausgezahlt\)

__MUST__

Neu

__Aufschlüsselung nach WS__

Pro Monat expandierbar: Welche Werkstatt hat wie viel beigetragen

__MUST__

Neu

__Jahresübersicht__

Gesamteinnahmen pro Kalenderjahr \(wichtig für Steuererklärung\)

__MUST__

Neu

__Einnahmen\-Chart__

Balkendiagramm der monatlichen Provisionen \(letzte 12 Monate\)

__SHOULD__

Neu

__Top\-Werkstätten__

Ranking der 5 umsatzstärksten Werkstätten des Freelancers

__SHOULD__

Neu

## 7\.2 Berechnungslogik

Die Provision wird pro Buchung berechnet und dem Freelancer zugeordnet:

__Schritt__

__Berechnung__

1\. Buchungswert

booking\.totalAmount

2\. B24\-Brutto\-Provision

totalAmount × 0,069

3\. Stripe\-Gebühren

totalAmount × 0,014 \+ 0,25

4\. B24\-Netto\-Provision

B24\-Brutto – Stripe\-Gebühren

__5\. Freelancer\-Anteil__

__B24\-Netto × freelancer\.tierPercentage \(20%/25%/30%\)__

Die Stufe wird monatlich neu berechnet basierend auf der Anzahl aktiver Werkstätten \(Status = AKTIV\) zum Stichtag des letzten Tages im Monat\. Ein Downgrade ist möglich, wenn Werkstätten inaktiv werden\.

## 7\.3 Auszahlungszyklus

- Abrechnungszeitraum: 1\.–31\. des Monats
- Abrechnung erstellt: automatisch am 1\. des Folgemonats
- Prüfung durch Admin: bis zum 10\. des Folgemonats
- Auszahlung: zum 15\. des Folgemonats
- Status\-Tracking: BERECHNET → GEPRÜFT → AUSGEZAHLT

# 8\. Modul 5: Abrechnung & Rechnungen

Dieses Modul löst den administrativen Aufwand für beide Seiten: Der Freelancer bekommt eine druckfertige Provisionsabrechnung, die er als Grundlage für seine Rechnung nutzen kann\.

## 8\.1 Features

__Feature__

__Beschreibung__

__Priorität__

__Status__

__Monatsabrechnung PDF__

Automatisch generierte Abrechnung mit allen Buchungen, Berechnungen und Endbetrag\. Enthält: Zeitraum, Werkstätten, Buchungsanzahl, Volumen, Provisionsstufe, Nettobetrag

__MUST__

Neu

__Rechnungsvorlage__

Vorausgefüllte Rechnungsvorlage mit den Daten des Freelancers \(Gewerbedaten, Steuernr\.\) und B24 als Empfänger\. Freelancer muss nur prüfen und absenden\.

__SHOULD__

Neu

__Rechnungs\-Upload__

Freelancer kann seine fertige Rechnung als PDF hochladen\. Status: HOCHGELADEN → AKZEPTIERT → BEZAHLT

__MUST__

Neu

__Abrechnungshistorie__

Liste aller vergangenen Abrechnungen mit Download\-Link und Zahlungsstatus

__MUST__

Neu

__Jahresabrechnung__

Zusammenfassung aller Provisionen eines Kalenderjahres \(für Steuererklärung\)

__SHOULD__

Neu

## 8\.2 Provisionsabrechnung – Inhalt

Die automatisch generierte PDF\-Abrechnung enthält:

- Abrechnungszeitraum \(z\.B\. 01\.03\.2026 – 31\.03\.2026\)
- Freelancer\-Stammdaten \(Name, Adresse, Steuernummer\)
- Tabelle: Werkstatt | Buchungsanzahl | Buchungsvolumen | B24\-Netto | Freelancer\-Anteil
- Provisionsstufe im Abrechnungszeitraum
- Netto\-Gesamtbetrag
- Hinweis: „Diese Abrechnung dient als Grundlage für Ihre Rechnung an Bereifung24 GmbH“
- Bankverbindung von B24 für die Rechnungsstellung

# 9\. Modul 6: Vertriebsmaterialien

Zentraler Download\-Bereich für alles, was der Freelancer für seine Arbeit braucht\.

## 9\.1 Features

__Feature__

__Beschreibung__

__Priorität__

__Status__

__Dokumenten\-Bibliothek__

Kategorisierte Liste: Präsentationen, One\-Pager, Broschüren, E\-Mail\-Vorlagen\. Vom Admin gepflegt\.

__SHOULD__

Neu

__Affiliate\-Link__

Persönlicher Registrierungslink mit Tracking\-Parameter \(?ref=FREELANCER\_ID\)\. Kopierfunktion und QR\-Code\.

__MUST__

Neu

__QR\-Code Generator__

QR\-Code des Affiliate\-Links als PNG/SVG Download – für Visitenkarten oder Flyer

__SHOULD__

Neu

__E\-Mail\-Vorlagen__

Kopierbare Vorlagen: Erstansprache, Follow\-up, Demo\-Einladung, Nachfass\-Mail

__SHOULD__

Neu

__FAQ\-Dokument__

Häufige Fragen und Einwände von Werkstätten mit Antwortvorschlägen

__SHOULD__

Neu

__Versionierung__

Admin kann neue Versionen hochladen, Freelancer sieht immer die aktuelle Version

__COULD__

Neu

# 10\. Modul 7: Mein Profil & Einstellungen

## 10\.1 Stammdaten

__Feature__

__Beschreibung__

__Priorität__

__Status__

__Persönliche Daten__

Name, E\-Mail, Telefon, Adresse

__MUST__

Neu

__Gewerbedaten__

Firmenname, Gewerbeanmeldung\-Nr\., Steuernummer, USt\-IdNr\. \(wenn vorhanden\)

__MUST__

Neu

__Bankverbindung__

IBAN, BIC, Kontoinhaber – für Provisionszahlungen

__MUST__

Neu

__Profilbild__

Optional, wird im CRM und ggf\. auf Werkstatt\-Kontaktseite angezeigt

__COULD__

Neu

__Vertragsunterlagen__

Download des eigenen Freelancer\-Vertrags und NDA

__SHOULD__

Neu

## 10\.2 Einstellungen

__Feature__

__Beschreibung__

__Priorität__

__Status__

__Benachrichtigungen__

E\-Mail\-Benachrichtigungen ein/aus: Neue Buchung, Lead\-Reminder, Abrechnung verfügbar, Werkstatt\-Warnung

__SHOULD__

Neu

__Passwort ändern__

Standard\-Passwortänderung

__MUST__

Besteht

__Sprache__

DE/EN Umschaltung \(für spätere DACH\-Expansion\)

__COULD__

Neu

__Region / PLZ\-Bereich__

Zugewiesene Vertriebsregion \(vom Admin gesetzt, nur lesbar\)

__SHOULD__

Neu

# 11\. Datenmodell \(Prisma\-Erweiterung\)

Die folgenden neuen Models und Felder werden benötigt\. Sie erweitern das bestehende Prisma\-Schema\.

## 11\.1 Model: Freelancer

__Feld__

__Typ__

__Beschreibung__

__Pflicht__

id

String @id @default\(cuid\(\)\)

Primärschlüssel

Auto

userId

String @unique

Referenz auf User\-Model \(1:1\)

Ja

companyName

String?

Firmenname \(Gewerbe\)

Nein

taxNumber

String?

Steuernummer

Nein

vatId

String?

USt\-IdNr\.

Nein

tradeRegNumber

String?

Gewerbeanmeldung\-Nr\.

Nein

iban

String?

Bankverbindung IBAN

Nein

bic

String?

Bankverbindung BIC

Nein

accountHolder

String?

Name des Kontoinhabers

Nein

affiliateCode

String @unique

Persönlicher Affiliate\-Code \(z\.B\. FL\-XXXX\)

Auto

tier

Enum\(STARTER,PRO,EXPERT\)

Aktuelle Provisionsstufe

Auto

region

String?

Zugewiesener PLZ\-Bereich / Region

Nein

contractStartDate

DateTime

Vertragsbeginn

Ja

contractEndDate

DateTime?

Vertragsende \(null = aktiv\)

Nein

status

Enum\(ACTIVE,PAUSED,TERMINATED\)

Vertragsstatus

Auto

createdAt

DateTime @default\(now\(\)\)

Erstellungszeitpunkt

Auto

updatedAt

DateTime @updatedAt

Letzte Änderung

Auto

## 11\.2 Model: FreelancerLead

__Feld__

__Typ__

__Beschreibung__

__Pflicht__

id

String @id @default\(cuid\(\)\)

Primärschlüssel

Auto

freelancerId

String

Zuordnung zum Freelancer

Ja

workshopName

String

Name der Werkstatt

Ja

contactPerson

String?

Ansprechpartner

Nein

phone

String?

Telefonnummer

Nein

email

String?

E\-Mail\-Adresse

Nein

address

String?

Adresse der Werkstatt

Nein

status

Enum\(NEW,CONTACTED,DEMO,ONBOARDING,ACTIVE,LOST\)

Pipeline\-Status

Ja

lostReason

String?

Verlustgrund \(bei Status LOST\)

Nein

nextFollowUp

DateTime?

Nächste Wiedervorlage

Nein

notes

String?

Freitext\-Notizen

Nein

workshopId

String? @unique

Referenz auf Workshop \(wenn registriert\)

Auto

createdAt

DateTime @default\(now\(\)\)

Erstellungszeitpunkt

Auto

updatedAt

DateTime @updatedAt

Letzte Änderung

Auto

## 11\.3 Model: FreelancerLeadActivity

__Feld__

__Typ__

__Beschreibung__

__Pflicht__

id

String @id @default\(cuid\(\)\)

Primärschlüssel

Auto

leadId

String

Zuordnung zum Lead

Ja

type

Enum\(CALL,EMAIL,VISIT,NOTE,STATUS\_CHANGE\)

Art der Aktivität

Ja

description

String

Beschreibung / Notiz

Ja

createdAt

DateTime @default\(now\(\)\)

Zeitpunkt

Auto

## 11\.4 Model: FreelancerCommission

__Feld__

__Typ__

__Beschreibung__

__Pflicht__

id

String @id @default\(cuid\(\)\)

Primärschlüssel

Auto

freelancerId

String

Zuordnung zum Freelancer

Ja

bookingId

String

Zuordnung zur Buchung

Ja

workshopId

String

Zuordnung zur Werkstatt

Ja

bookingAmount

Decimal

Buchungswert in €

Ja

b24GrossCommission

Decimal

B24\-Brutto \(6,9%\)

Ja

stripeFee

Decimal

Stripe\-Gebühr

Ja

b24NetCommission

Decimal

B24\-Netto nach Stripe

Ja

freelancerPercentage

Decimal

Freelancer\-% zum Zeitpunkt \(20/25/30\)

Ja

freelancerAmount

Decimal

Freelancer\-Betrag in €

Ja

period

String

Abrechnungsperiode \(YYYY\-MM\)

Ja

createdAt

DateTime @default\(now\(\)\)

Erstellungszeitpunkt

Auto

## 11\.5 Model: FreelancerPayout

__Feld__

__Typ__

__Beschreibung__

__Pflicht__

id

String @id @default\(cuid\(\)\)

Primärschlüssel

Auto

freelancerId

String

Zuordnung zum Freelancer

Ja

period

String

Abrechnungsperiode \(YYYY\-MM\)

Ja

totalBookings

Int

Gesamtanzahl Buchungen

Ja

totalVolume

Decimal

Gesamt\-Buchungsvolumen

Ja

totalCommission

Decimal

Gesamt\-Provisionsanspruch

Ja

tier

Enum\(STARTER,PRO,EXPERT\)

Stufe in diesem Monat

Ja

status

Enum\(CALCULATED,REVIEWED,INVOICED,PAID\)

Auszahlungsstatus

Ja

invoiceUrl

String?

Hochgeladene Rechnung des Freelancers

Nein

paidAt

DateTime?

Auszahlungsdatum

Nein

statementUrl

String?

Generierte Provisionsabrechnung PDF

Auto

createdAt

DateTime @default\(now\(\)\)

Erstellungszeitpunkt

Auto

## 11\.6 Erweiterung bestehender Models

Am bestehenden Workshop\-Model wird ein optionales Feld ergänzt:

__Feld__

__Typ__

__Beschreibung__

__Pflicht__

freelancerId

String?

Zuordnung zum akquirierenden Freelancer \(Lifetime\)

Nein

freelancerAcquiredAt

DateTime?

Datum der Akquise\-Zuordnung

Auto

# 12\. API\-Endpunkte

Alle Endpunkte unter /api/freelancer/\* erfordern authentifizierten Zugriff mit Rolle FREELANCER\. Der freelancerId wird aus der Session abgeleitet\.

## 12\.1 Dashboard & KPIs

__Methode__

__Endpunkt__

__Beschreibung__

__GET__

/api/freelancer/dashboard/kpis

KPI\-Karten: Provision, Werkstätten, Buchungen, Leads, Conversion

__GET__

/api/freelancer/dashboard/chart

Chart\-Daten: Buchungen/Provisionen der letzten 6 Monate \(query: type\)

__GET__

/api/freelancer/dashboard/activity

Letzte 10 Aktivitäten \(Buchungen, Leads, Auszahlungen\)

__GET__

/api/freelancer/dashboard/tier

Aktuelle Stufe, Fortschritt zur nächsten Stufe

## 12\.2 Werkstätten

__Methode__

__Endpunkt__

__Beschreibung__

__GET__

/api/freelancer/workshops

Liste eigener Werkstätten \(filter: status, sort, search\)

__GET__

/api/freelancer/workshops/\[id\]

Detailansicht einer Werkstatt \(Profil, Buchungen, Gesundheit\)

__GET__

/api/freelancer/workshops/\[id\]/bookings

Buchungsstatistiken der Werkstatt \(aggregiert, keine Kundendaten\)

__PUT__

/api/freelancer/workshops/\[id\]/notes

Freelancer\-Notizen zur Werkstatt speichern

## 12\.3 Lead\-Pipeline

__Methode__

__Endpunkt__

__Beschreibung__

__GET__

/api/freelancer/leads

Alle eigenen Leads \(filter: status, sort, search\)

__POST__

/api/freelancer/leads

Neuen Lead erstellen

__PUT__

/api/freelancer/leads/\[id\]

Lead bearbeiten \(Status, Daten, Wiedervorlage\)

__DELETE__

/api/freelancer/leads/\[id\]

Lead löschen \(nur Status NEW\)

__POST__

/api/freelancer/leads/\[id\]/activities

Aktivität zum Lead hinzufügen

__GET__

/api/freelancer/leads/\[id\]/activities

Aktivitäten\-Log eines Leads

__POST__

/api/freelancer/leads/import

CSV\-Bulk\-Import von Leads

## 12\.4 Provisionen

__Methode__

__Endpunkt__

__Beschreibung__

__GET__

/api/freelancer/commissions

Monatsübersicht aller Provisionen \(paginiert\)

__GET__

/api/freelancer/commissions/\[period\]

Detail einer Abrechnungsperiode \(YYYY\-MM\)

__GET__

/api/freelancer/commissions/\[period\]/by\-workshop

Aufschlüsselung nach Werkstatt für eine Periode

__GET__

/api/freelancer/commissions/yearly/\[year\]

Jahresübersicht \(für Steuererklärung\)

## 12\.5 Abrechnung

__Methode__

__Endpunkt__

__Beschreibung__

__GET__

/api/freelancer/payouts

Liste aller Abrechnungen mit Status

__GET__

/api/freelancer/payouts/\[id\]/statement

Provisionsabrechnung als PDF herunterladen

__POST__

/api/freelancer/payouts/\[id\]/invoice

Rechnung als PDF hochladen

__GET__

/api/freelancer/payouts/yearly/\[year\]

Jahresabrechnung PDF

## 12\.6 Materialien & Profil

__Methode__

__Endpunkt__

__Beschreibung__

__GET__

/api/freelancer/materials

Liste aller verfügbaren Vertriebsmaterialien

__GET__

/api/freelancer/materials/\[id\]/download

Datei herunterladen

__GET__

/api/freelancer/profile

Eigene Stamm\- und Gewerbedaten abrufen

__PUT__

/api/freelancer/profile

Profildaten aktualisieren

__GET__

/api/freelancer/affiliate\-link

Persönlichen Affiliate\-Link \+ QR\-Code abrufen

# 13\. Sicherheit & Datenschutz

## 13\.1 Zugriffssteuerung

- Middleware prüft session\.user\.role === 'FREELANCER' für alle /freelancer/\* Routen
- Alle DB\-Queries filtern nach freelancerId aus der Session – nie aus dem Request\-Body
- Werkstatt\-Zugriff: WHERE workshop\.freelancerId === session\.freelancerId
- Keine JOIN\-Möglichkeit auf Kundendaten \(Booking → Customer wird nicht exponiert\)
- Rate Limiting auf allen API\-Endpunkten \(100 Requests/Minute\)

## 13\.2 Datenschutz \(DSGVO\)

- Freelancer sieht keine personenbezogenen Kundendaten – nur aggregierte Buchungszahlen
- Werkstatt\-Kontaktdaten sind geschäftliche Daten \(kein besonderer Schutz\)
- Bankdaten des Freelancers werden verschlüsselt gespeichert \(AES\-256\)
- Bei Vertragsende: Freelancer\-Account wird deaktiviert, Daten nach 12 Monaten Nachlauf gelöscht
- Auftragsverarbeitungsvertrag \(AVV\) im Freelancer\-Vertrag integriert

## 13\.3 NDA & Geheimhaltung

- Freelancer unterzeichnet NDA als Teil des Vertrags
- Lead\-Daten und Werkstatt\-Kontakte bleiben Eigentum von B24
- Export\-Funktion begrenzt: Keine Bulk\-Exportmöglichkeit für Werkstatt\-Kontaktdaten

# 14\. Implementierungsreihenfolge

Empfohlene Reihenfolge für die Umsetzung in Sprints:

## Phase 1: Foundation \(Sprint 1–2\)

- Prisma\-Schema erweitern: Freelancer, FreelancerCommission, FreelancerPayout
- Neue Rolle FREELANCER im Auth\-System
- Middleware \+ Routing für /freelancer/\*
- Profil\-Seite \(Stammdaten, Gewerbedaten, Bankverbindung\)
- Affiliate\-Link\-Generierung
- Workshop\-Model um freelancerId erweitern

## Phase 2: Core Dashboard \(Sprint 3–4\)

- Übersichtsseite mit KPI\-Karten
- Meine Werkstätten: Liste \+ Detailansicht \+ Gesundheits\-Ampel
- Provisionsübersicht: Monats\- und Werkstatt\-Aufschlüsselung
- Berechnungslogik für Provisionen \(Cronjob: monatliche Berechnung\)

## Phase 3: CRM & Pipeline \(Sprint 5–6\)

- Lead\-Pipeline: CRUD, Kanban\-Board, Aktivitäten\-Log
- Wiedervorlagen und Reminder \(E\-Mail\-Benachrichtigung\)
- Automatische Lead → Workshop Verknüpfung bei Registrierung
- Verlustgründe und Pipeline\-Analytics

## Phase 4: Abrechnung & Tools \(Sprint 7–8\)

- Provisionsabrechnung PDF\-Generierung
- Rechnungs\-Upload und Status\-Tracking
- Jahresabrechnung
- Vertriebsmaterialien\-Bereich
- E\-Mail\-Benachrichtigungen \(neue Buchung, Abrechnung, Werkstatt\-Warnung\)

## Phase 5: Polish & Admin \(Sprint 9–10\)

- Admin\-Panel: Freelancer\-Verwaltung, Vertragsmanagement
- Admin: Abrechnungen prüfen und freigeben
- Charts und Diagramme \(Recharts\)
- CSV\-Import für Leads
- QR\-Code\-Generator
- Stufenfortschritt und Gamification\-Elemente
- E2E\-Tests für alle Freelancer\-Flows

__Geschätzter Aufwand__

Gesamtumfang: ca\. 8–10 Sprints \(à 2 Wochen\) = 16–20 Wochen Entwicklungszeit\. Phase 1–2 \(Foundation \+ Core\) liefert bereits ein nutzbares Dashboard nach ca\. 8 Wochen\. Phase 3–5 können schrittweise nachgeliefert werden, während die ersten Freelancer bereits mit dem System arbeiten\.

Markgröningen, März 2026

