const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const articles = [
  {
    slug: 'sommerreifen-wechsel-stuttgart-guide-2026',
    content: `<h2>Wann sollte man in Stuttgart auf Sommerreifen wechseln?</h2>
<p>Die "O bis O"-Regel (Oktober bis Ostern) ist vielen Autofahrern bekannt, doch in Stuttgart und Umgebung gibt es einige regionale Besonderheiten zu beachten. Das milde Klima im Neckartal sorgt oft für frühere Wechselmöglichkeiten als in anderen Regionen Baden-Württembergs.</p>

<h3>Die optimale Wechselzeit in der Region Stuttgart</h3>
<p>In Stuttgart und dem Großraum empfehlen Experten den Wechsel auf Sommerreifen idealerweise <strong>ab Mitte März bis Anfang April</strong>, sobald die Temperaturen konstant über 7°C liegen. Wichtige Faktoren:</p>

<ul>
    <li><strong>Temperatur:</strong> Sommerreifen bieten bei über 7°C deutlich bessere Fahreigenschaften</li>
    <li><strong>Wettervorhersage:</strong> Prüfen Sie die 14-Tage-Vorhersage auf Kälteeinbrüche</li>
    <li><strong>Höhenlage:</strong> In Stuttgart-Degerloch oder Filder kann es länger kälter sein als im Talkessel</li>
    <li><strong>Fahrprofil:</strong> Wer häufig Richtung Schwäbische Alb fährt, sollte später wechseln</li>
</ul>

<h3>Warum ist der richtige Zeitpunkt so wichtig?</h3>
<p>Winterreifen bei warmen Temperaturen haben mehrere Nachteile:</p>
<ul>
    <li>Längerer Bremsweg auf trockener Fahrbahn</li>
    <li>Erhöhter Kraftstoffverbrauch (bis zu 10% mehr)</li>
    <li>Schnellerer Verschleiß des Reifenprofils</li>
    <li>Schlechteres Fahrverhalten in Kurven</li>
</ul>

<h2>Kosten für Reifenwechsel in Stuttgart</h2>
<p>Die Preise in Stuttgart variieren je nach Werkstatt und Service-Umfang:</p>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background-color: #f5f5f5;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Service</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Preis</th>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Reifenwechsel (Umstecken)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">20-35€</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Auswuchten (pro Rad)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">8-15€</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">RDKS-Reset</td>
        <td style="padding: 10px; border: 1px solid #ddd;">15-25€</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Einlagerung (6 Monate)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">40-80€</td>
    </tr>
</table>

<h2>Die besten Werkstätten in Stuttgart</h2>
<p>Stuttgart bietet eine Vielzahl qualifizierter Werkstätten für den Reifenwechsel. Bei der Auswahl sollten Sie auf folgende Kriterien achten:</p>

<ul>
    <li>Zertifizierungen und Qualifikationen der Mechaniker</li>
    <li>Moderne Wuchtmaschinen und RDKS-Diagnosegeräte</li>
    <li>Klimatisierte Einlagerungsmöglichkeiten</li>
    <li>Online-Terminbuchung und flexible Öffnungszeiten</li>
    <li>Transparente Preisgestaltung ohne versteckte Kosten</li>
</ul>

<h2>Fazit</h2>
<p>Der Wechsel auf Sommerreifen in Stuttgart sollte <strong>ab Mitte März</strong> erfolgen, sobald keine Frostperioden mehr zu erwarten sind. Vereinbaren Sie frühzeitig einen Termin, um Wartezeiten zu vermeiden.</p>

<p><strong>Jetzt Termin online buchen und von unseren Frühbucher-Rabatten profitieren!</strong></p>`
  },
  {
    slug: 'rdks-reifendruckkontrollsystem-pflicht-2026',
    content: `<h2>Was ist RDKS und warum ist es Pflicht?</h2>
<p>Das <strong>Reifendruckkontrollsystem (RDKS)</strong>, auch TPMS (Tire Pressure Monitoring System) genannt, ist seit November 2014 für alle Neufahrzeuge in der EU Pflicht. Das System überwacht permanent den Luftdruck in allen Reifen und warnt bei zu niedrigem Druck.</p>

<h3>Warum wurde RDKS eingeführt?</h3>
<ul>
    <li><strong>Sicherheit:</strong> Unterdruck kann zu Reifenplatzer führen</li>
    <li><strong>Umwelt:</strong> Korrekter Reifendruck spart bis zu 6% Kraftstoff</li>
    <li><strong>Verschleiß:</strong> Falschdruck verkürzt Reifenlebensdauer um bis zu 30%</li>
    <li><strong>Fahrverhalten:</strong> Optimaler Druck verbessert Handling und Bremsweg</li>
</ul>

<h2>Zwei Arten von RDKS-Systemen</h2>

<h3>1. Direktes RDKS (dTPMS)</h3>
<p>Sensoren in jedem Rad messen den tatsächlichen Druck und übertragen die Daten per Funk:</p>
<ul>
    <li>✅ Präzise Druckanzeige für jedes Rad</li>
    <li>✅ Erkennt schleichenden Druckverlust sofort</li>
    <li>❌ Höhere Kosten bei Reparatur/Austausch</li>
    <li>❌ Batterie der Sensoren hält 5-7 Jahre</li>
</ul>

<h3>2. Indirektes RDKS (iTPMS)</h3>
<p>Nutzt ABS-Sensoren zur Erkennung von Druckabweichungen:</p>
<ul>
    <li>✅ Keine zusätzlichen Sensoren im Rad nötig</li>
    <li>✅ Günstigere Wartung</li>
    <li>❌ Weniger präzise als direktes RDKS</li>
    <li>❌ Muss nach Reifenwechsel neu kalibriert werden</li>
</ul>

<h2>RDKS beim Reifenwechsel: Das müssen Sie wissen</h2>

<h3>Direktes RDKS - Wichtige Schritte</h3>
<ol>
    <li><strong>Sensoren prüfen:</strong> Vor dem Wechsel Funktion und Batteriestatus checken</li>
    <li><strong>Anlernen:</strong> Nach Montage müssen Sensoren neu angelernt werden (20-50€)</li>
    <li><strong>Ersatzsensoren:</strong> Bei defekten Sensoren sind Originalsensoren oder Universalsensoren nötig</li>
    <li><strong>Ventilwechsel:</strong> RDKS-Ventile sollten bei jedem Reifenwechsel erneuert werden (5-10€/Stück)</li>
</ol>

<h2>Kosten für RDKS-Service in Werkstätten</h2>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background-color: #f5f5f5;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Service</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Preis</th>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">RDKS-Sensoren anlernen</td>
        <td style="padding: 10px; border: 1px solid #ddd;">20-50€</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Ersatz-Sensor (Original)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">50-120€</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Universal-Sensor</td>
        <td style="padding: 10px; border: 1px solid #ddd;">30-60€</td>
    </tr>
</table>

<h2>Gesetzliche Regelung und TÜV</h2>
<p>Seit 2018 gilt: Bei der HU (TÜV) wird geprüft, ob das RDKS funktioniert. Ein defektes RDKS führt zu:</p>
<ul>
    <li>❌ <strong>Erheblicher Mangel:</strong> Keine TÜV-Plakette</li>
    <li>❌ <strong>Nachuntersuchung:</strong> Innerhalb eines Monats nötig</li>
    <li>❌ <strong>Zusatzkosten:</strong> Reparatur + Nachprüfung</li>
</ul>

<h2>Fazit</h2>
<p>Das RDKS ist ein wichtiges Sicherheitssystem, das regelmäßige Wartung benötigt. Bei jedem Reifenwechsel sollten Sie RDKS-Sensoren auf Funktion prüfen lassen.</p>`
  },
  {
    slug: 'lokales-seo-werkstaetten-stuttgart-kunden-gewinnen',
    content: `<h2>Warum lokales SEO für Werkstätten unverzichtbar ist</h2>
<p>In Stuttgart und Umgebung suchen täglich hunderte Autofahrer nach Werkstätten in ihrer Nähe. <strong>85% aller lokalen Suchanfragen</strong> führen innerhalb von 24 Stunden zu einem Werkstattbesuch oder Anruf. Wer online nicht gefunden wird, verliert potenzielle Kunden an die Konkurrenz.</p>

<h3>Die wichtigsten Fakten</h3>
<ul>
    <li>92% der Verbraucher nutzen Google zur Werkstatt-Suche</li>
    <li>72% klicken nur auf die ersten 3 Google-Ergebnisse</li>
    <li>88% vertrauen Online-Bewertungen wie persönlichen Empfehlungen</li>
    <li>76% der lokalen mobilen Suchanfragen führen zu einem Besuch innerhalb eines Tages</li>
</ul>

<h2>Google My Business: Die Basis für lokale Sichtbarkeit</h2>

<h3>Schritt 1: Profil vollständig optimieren</h3>
<p>Ihr Google My Business (GMB) Profil ist Ihre digitale Visitenkarte. Füllen Sie <strong>alle Felder</strong> aus:</p>

<ul>
    <li><strong>Name:</strong> Offizieller Firmenname (keine Keyword-Stuffing)</li>
    <li><strong>Kategorie:</strong> "Autowerkstatt" als Hauptkategorie + bis zu 9 weitere</li>
    <li><strong>Adresse:</strong> Exakte Adresse mit Postleitzahl</li>
    <li><strong>Telefonnummer:</strong> Lokale Festnetznummer bevorzugt</li>
    <li><strong>Website:</strong> Optimierte Landing Page mit Leistungen</li>
    <li><strong>Öffnungszeiten:</strong> Immer aktuell halten, auch Feiertage</li>
</ul>

<h3>Schritt 2: Hochwertige Fotos hochladen</h3>
<p>Werkstätten mit Fotos erhalten <strong>42% mehr Anfragen</strong>:</p>

<ul>
    <li>Außenansicht der Werkstatt (bei Tag)</li>
    <li>Innenansicht mit moderner Ausrüstung</li>
    <li>Team-Fotos (schafft Vertrauen)</li>
    <li>Fahrzeuge in der Werkstatt</li>
    <li>Spezialwerkzeuge (z.B. Hebebühnen, Diagnosegeräte)</li>
</ul>

<h2>Bewertungen: Der wichtigste Ranking-Faktor</h2>

<h3>Warum Bewertungen so wichtig sind</h3>
<ul>
    <li>Bewertungen beeinflussen 67% der Kaufentscheidungen</li>
    <li>Werkstätten mit 4,5+ Sternen erhalten 3x mehr Anfragen</li>
    <li>Regelmäßige neue Bewertungen verbessern lokales Ranking</li>
</ul>

<h3>Strategie für mehr Bewertungen</h3>
<ol>
    <li><strong>Aktiv fragen:</strong> Nach jedem Service um Bewertung bitten</li>
    <li><strong>QR-Code:</strong> Direkt-Link zu Google-Bewertung auf Rechnung</li>
    <li><strong>E-Mail-Follow-up:</strong> 24-48h nach Service automatisiert</li>
    <li><strong>Negative Bewertungen:</strong> Professionell und zeitnah antworten</li>
</ol>

<h2>Website-Optimierung für lokales SEO</h2>

<h3>On-Page SEO Grundlagen</h3>
<ul>
    <li><strong>Title-Tags:</strong> "Autowerkstatt Stuttgart | [Stadtteil] | [Werkstattname]"</li>
    <li><strong>Meta-Descriptions:</strong> Lokale Keywords + Call-to-Action</li>
    <li><strong>H1-Überschrift:</strong> Hauptleistung + Standort</li>
    <li><strong>NAP-Konsistenz:</strong> Name, Adresse, Telefon überall gleich</li>
</ul>

<h2>Lokale Keyword-Strategie</h2>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background-color: #f5f5f5;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Keyword-Typ</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Beispiele</th>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Basis-Keywords</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Autowerkstatt Stuttgart</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Service-Keywords</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Reifenwechsel Stuttgart</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Long-Tail-Keywords</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Günstige Werkstatt Stuttgart</td>
    </tr>
</table>

<h2>Fazit</h2>
<p>Lokales SEO ist für Werkstätten in Stuttgart ein Muss. Starten Sie mit der Optimierung Ihrer Online-Präsenz!</p>`
  },
  {
    slug: 'reifenalterung-erkennen-wann-reifen-entsorgen',
    content: `<h2>Warum altern Reifen?</h2>
<p>Autoreifen bestehen aus einer komplexen Mischung aus Gummi, Chemikalien, Stahl und Textil. Auch wenn Reifen kaum gefahren werden, <strong>altern sie durch Umwelteinflüsse</strong>:</p>

<ul>
    <li><strong>UV-Strahlung:</strong> Zersetzt Gummimoleküle</li>
    <li><strong>Ozon:</strong> Verursacht Risse im Gummi</li>
    <li><strong>Temperaturschwankungen:</strong> Spröde Gummi</li>
    <li><strong>Feuchtigkeit:</strong> Korrosion der Stahlkarkasse</li>
</ul>

<h3>Faustregel für Reifenalter</h3>
<ul>
    <li>✅ <strong>0-6 Jahre:</strong> Unbedenklich bei regelmäßiger Nutzung</li>
    <li>⚠️ <strong>6-10 Jahre:</strong> Jährliche Prüfung empfohlen</li>
    <li>❌ <strong>10+ Jahre:</strong> Austausch dringend empfohlen</li>
</ul>

<h2>DOT-Nummer lesen: So bestimmen Sie das Reifenalter</h2>
<p>Jeder Reifen hat eine DOT-Nummer an der Reifenflanke. Diese vierstellige Zahl gibt Aufschluss über Produktionswoche und -jahr.</p>

<h3>Beispiel-DOT: 2519</h3>
<ul>
    <li><strong>25</strong> = 25. Kalenderwoche</li>
    <li><strong>19</strong> = Jahr 2019</li>
    <li>→ Der Reifen wurde in der 25. Woche 2019 produziert</li>
</ul>

<h2>Visuelle Anzeichen von Reifenalterung</h2>

<h3>1. Risse und Brüche</h3>
<p>Feine Risse in der Lauffläche oder Seitenwand sind <strong>Alarmsignale</strong>:</p>
<ul>
    <li><strong>Kleine Risse:</strong> Beginnende Alterung</li>
    <li><strong>Tiefe Risse:</strong> Sofortiger Austausch erforderlich</li>
    <li><strong>Netzartige Risse:</strong> UV-Schädigung</li>
</ul>

<h3>2. Beulen und Ausbuchtungen</h3>
<p>Beulen an der Reifenflanke sind <strong>lebensgefährlich</strong>:</p>
<ul>
    <li>Entstehen durch Schäden der inneren Karkasse</li>
    <li>Können jederzeit platzen</li>
    <li>Sofortiger Austausch ohne Diskussion!</li>
</ul>

<h2>Wann Reifen auf jeden Fall ersetzen?</h2>

<h3>Sofortiger Austausch erforderlich bei</h3>
<ul>
    <li>❌ Profiltiefe unter 1,6 mm</li>
    <li>❌ Reifen älter als 10 Jahre</li>
    <li>❌ Sichtbaren Karkassenfäden</li>
    <li>❌ Beulen oder Ausbuchtungen</li>
    <li>❌ Tiefen Schnitten oder Einstichen</li>
</ul>

<h2>Checkliste: Reifen-Inspektion</h2>

<p>Führen Sie alle <strong>3 Monate</strong> diese Prüfung durch:</p>

<ol>
    <li>✅ DOT-Nummer prüfen (Alter berechnen)</li>
    <li>✅ Profiltiefe messen</li>
    <li>✅ Sichtprüfung auf Risse und Beschädigungen</li>
    <li>✅ Reifendruck kontrollieren</li>
    <li>✅ Gleichmäßigkeit des Verschleißes überprüfen</li>
</ol>

<h2>Fazit</h2>
<p>Reifenalterung ist ein schleichender Prozess. <strong>Prüfen Sie Ihre Reifen regelmäßig</strong> auf Alter und Schäden!</p>`
  },
  {
    slug: 'e-auto-reifen-elektrofahrzeuge-besonderheiten',
    content: `<h2>Warum brauchen E-Autos andere Reifen?</h2>
<p>Elektrofahrzeuge stellen durch ihr Antriebskonzept und Gewicht <strong>besondere Anforderungen</strong> an Reifen:</p>

<h3>Die 4 Hauptunterschiede</h3>
<ul>
    <li><strong>Gewicht:</strong> E-Autos sind durch Batterien 200-400 kg schwerer</li>
    <li><strong>Drehmoment:</strong> Sofortiges maximales Drehmoment beim Anfahren</li>
    <li><strong>Rollwiderstand:</strong> Niedrigerer Widerstand = mehr Reichweite</li>
    <li><strong>Geräuschentwicklung:</strong> Ohne Motorengeräusch sind Reifen lauter</li>
</ul>

<h2>Spezielle Anforderungen an E-Auto-Reifen</h2>

<h3>1. Last- und Tragfähigkeit</h3>
<p>Ein Tesla Model 3 Long Range wiegt ca. 1.850 kg – 350 kg mehr als ein vergleichbarer VW Passat. Die Reifen müssen:</p>
<ul>
    <li>Höheren Lastindex aufweisen (oft XL = Extra Load)</li>
    <li>Verstärkte Seitenwände haben</li>
    <li>Spezielle Karkassen-Konstruktion für Mehrgewicht</li>
</ul>

<h3>2. Verschleiß-Resistenz</h3>
<p>Durch das sofortige Drehmoment von E-Motoren:</p>
<ul>
    <li>Bis zu <strong>30% höherer Reifenverschleiß</strong></li>
    <li>Besonders Vorderreifen bei Frontantrieb stark belastet</li>
    <li>Härtere Gummimischungen notwendig</li>
</ul>

<h3>3. Rollwiderstand</h3>
<p>Jeder Widerstand kostet Reichweite:</p>
<ul>
    <li>E-Auto-Reifen optimiert auf niedrigen Rollwiderstand</li>
    <li>EU-Label oft Klasse A oder B</li>
    <li>Bis zu <strong>5-10% mehr Reichweite</strong> mit optimierten Reifen</li>
</ul>

<h2>Kennzeichnung von E-Auto-Reifen</h2>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background-color: #f5f5f5;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Kennzeichnung</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Bedeutung</th>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">XL (Extra Load)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Erhöhte Tragfähigkeit</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">HL (High Load)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Noch höhere Traglast als XL</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">EV (Electric Vehicle)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Speziell für E-Fahrzeuge</td>
    </tr>
</table>

<h2>Reichweite maximieren: Tipps für E-Auto-Fahrer</h2>

<h3>1. Richtiger Reifendruck</h3>
<p>Der Reifendruck beeinflusst die Reichweite enorm:</p>
<ul>
    <li><strong>0,5 bar zu wenig = 5% weniger Reichweite</strong></li>
    <li>Empfehlung: +0,2 bar über Herstellervorgabe</li>
    <li>Monatlich kontrollieren</li>
</ul>

<h3>2. Reifenrotation</h3>
<p>Durch hohes Drehmoment verschleißen Reifen ungleichmäßig:</p>
<ul>
    <li>Alle 8.000-10.000 km Reifen vorn/hinten tauschen</li>
    <li>Bei Heckantrieb: Hinterreifen stärker belastet</li>
    <li>Bei Frontantrieb: Vorderreifen stärker belastet</li>
</ul>

<h2>Kosten: E-Auto vs. Verbrenner</h2>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background-color: #f5f5f5;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Faktor</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Verbrenner</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">E-Auto</th>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Reifen-Preis (Satz)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">300-600€</td>
        <td style="padding: 10px; border: 1px solid #ddd;">400-800€</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Lebensdauer</td>
        <td style="padding: 10px; border: 1px solid #ddd;">40.000-50.000 km</td>
        <td style="padding: 10px; border: 1px solid #ddd;">30.000-40.000 km</td>
    </tr>
</table>

<h2>Fazit</h2>
<p>Elektrofahrzeuge brauchen <strong>speziell optimierte Reifen</strong>, um Sicherheit, Reichweite und Langlebigkeit zu gewährleisten.</p>

<p><strong>Jetzt E-Auto-Reifen-Beratung in Stuttgart vereinbaren!</strong></p>`
  }
];

async function updateContent() {
  console.log('📝 Updating blog post content...\n');
  
  for (const article of articles) {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { slug: article.slug }
      });
      
      if (!post) {
        console.log(`❌ Post not found: ${article.slug}`);
        continue;
      }
      
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { content: article.content }
      });
      
      console.log(`✅ Updated: ${post.title}`);
    } catch (error) {
      console.error(`❌ Error updating ${article.slug}:`, error.message);
    }
  }
  
  console.log('\n✨ All content updated successfully!');
}

updateContent()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
