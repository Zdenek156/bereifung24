const directBookingConfirmationTemplate = {
  name: 'Direktbuchung Bestätigung',
  subject: 'Ihre Buchung bei {{workshopName}} wurde bestätigt',
  html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .booking-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #6b7280;
            font-weight: 500;
        }
        .detail-value {
            color: #111827;
            font-weight: 600;
        }
        .booking-number {
            background: #dbeafe;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .booking-number-label {
            color: #1e40af;
            font-size: 14px;
            font-weight: 500;
        }
        .booking-number-value {
            color: #1e3a8a;
            font-size: 24px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            margin-top: 5px;
        }
        .total-price {
            background: #ecfdf5;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .total-price-label {
            color: #047857;
            font-size: 16px;
            font-weight: 500;
        }
        .total-price-value {
            color: #065f46;
            font-size: 28px;
            font-weight: bold;
        }
        .info-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="success-icon">✅</div>
        <h1 style="margin: 0; font-size: 28px;">Buchung bestätigt!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Ihre Zahlung war erfolgreich</p>
    </div>
    
    <div class="content">
        <p>Hallo {{customerName}},</p>
        
        <p>Ihre Buchung bei <strong>{{workshopName}}</strong> wurde erfolgreich bestätigt und bezahlt.</p>
        
        <div class="booking-number">
            <div class="booking-number-label">Buchungsnummer</div>
            <div class="booking-number-value">{{bookingNumber}}</div>
        </div>
        
        <div class="booking-details">
            <h3 style="margin-top: 0; color: #1f2937;">Buchungsdetails</h3>
            
            <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">{{serviceType}}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Werkstatt:</span>
                <span class="detail-value">{{workshopName}}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Adresse:</span>
                <span class="detail-value">{{workshopAddress}}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Termin:</span>
                <span class="detail-value">{{appointmentDate}} um {{appointmentTime}} Uhr</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Fahrzeug:</span>
                <span class="detail-value">{{vehicleBrand}} {{vehicleModel}} ({{licensePlate}})</span>
            </div>
            
            {{#if hasBalancing}}
            <div class="detail-row">
                <span class="detail-label">Zusätzlich:</span>
                <span class="detail-value">Wuchten inklusive</span>
            </div>
            {{/if}}
            
            {{#if hasStorage}}
            <div class="detail-row">
                <span class="detail-label">Zusätzlich:</span>
                <span class="detail-value">Einlagerung inklusive</span>
            </div>
            {{/if}}
        </div>
        
        <div class="total-price">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="total-price-label">Bezahlt:</span>
                <span class="total-price-value">{{totalPrice}} €</span>
            </div>
        </div>
        
        <div class="info-box">
            <strong>💡 Wichtige Hinweise:</strong>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Bitte erscheinen Sie pünktlich zum Termin</li>
                <li>Bei Verspätung über 15 Minuten kann der Termin verfallen</li>
                <li>Bei Verhinderung bitte mindestens 24h vorher absagen</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="{{dashboardLink}}" class="button">Meine Buchungen anzeigen</a>
        </div>
        
        <p style="margin-top: 30px;">
            Bei Fragen können Sie sich jederzeit an die Werkstatt wenden:<br>
            <strong>{{workshopPhone}}</strong><br>
            <strong>{{workshopEmail}}</strong>
        </p>
    </div>
    
    <div class="footer">
        <p>Diese E-Mail wurde automatisch generiert.</p>
        <p>
            <a href="{{platformUrl}}" style="color: #2563eb;">Bereifung24.de</a> | 
            <a href="{{supportUrl}}" style="color: #2563eb;">Support</a>
        </p>
    </div>
</body>
</html>
  `,
  variables: [
    'customerName',
    'workshopName',
    'workshopAddress',
    'workshopPhone',
    'workshopEmail',
    'bookingNumber',
    'serviceType',
    'appointmentDate',
    'appointmentTime',
    'vehicleBrand',
    'vehicleModel',
    'licensePlate',
    'totalPrice',
    'hasBalancing',
    'hasStorage',
    'dashboardLink',
    'platformUrl',
    'supportUrl'
  ]
}

module.exports = directBookingConfirmationTemplate
