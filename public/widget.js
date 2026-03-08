/**
 * Bereifung24 Workshop Widget
 * 
 * Embed on any website:
 * <script src="https://www.bereifung24.de/widget.js" 
 *   data-workshop="WORKSHOP_ID"
 *   data-variant="badge|button|card|booking|floating"
 *   data-theme="light|dark"
 *   data-position="right|left"
 *   data-color="#0070f3">
 * </script>
 */
(function() {
  'use strict';

  const BEREIFUNG24_BASE = 'https://www.bereifung24.de';
  const API_URL = BEREIFUNG24_BASE + '/api/widget/';

  // Find the script tag
  const scriptTag = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) return scripts[i];
    }
    return null;
  })();

  if (!scriptTag) return;

  const workshopId = scriptTag.getAttribute('data-workshop');
  const variant = scriptTag.getAttribute('data-variant') || 'badge';
  const theme = scriptTag.getAttribute('data-theme') || 'light';
  const position = scriptTag.getAttribute('data-position') || 'right';
  const customColor = scriptTag.getAttribute('data-color') || '#0070f3';

  if (!workshopId) {
    console.error('Bereifung24 Widget: data-workshop attribute is required');
    return;
  }

  // Fetch workshop data
  fetch(API_URL + workshopId)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) {
        console.error('Bereifung24 Widget:', data.error);
        return;
      }
      renderWidget(data);
    })
    .catch(function(err) {
      console.error('Bereifung24 Widget error:', err);
    });

  function renderWidget(data) {
    switch (variant) {
      case 'badge': renderBadge(data); break;
      case 'button': renderButton(data); break;
      case 'card': renderCard(data); break;
      case 'booking': renderBooking(data); break;
      case 'floating': renderFloating(data); break;
      default: renderBadge(data);
    }
  }

  // ========================
  // VARIANT 1: Rating Badge
  // ========================
  function renderBadge(data) {
    var container = createContainer('b24-badge');
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#ffffff';
    var text = isDark ? '#ffffff' : '#1a1a2e';
    var border = isDark ? '#333' : '#e5e7eb';
    var stars = renderStars(data.rating);

    container.innerHTML = '<div style="' +
      'display:inline-flex;align-items:center;gap:12px;padding:10px 16px;' +
      'background:' + bg + ';border:1px solid ' + border + ';border-radius:10px;' +
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;' +
      'transition:box-shadow 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.1);"' +
      ' onmouseover="this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.15)\'"' +
      ' onmouseout="this.style.boxShadow=\'0 1px 3px rgba(0,0,0,0.1)\'"' +
      ' onclick="window.open(\'' + data.profileUrl + '\',\'_blank\')">' +
      '<div style="display:flex;flex-direction:column;gap:2px;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="font-size:14px;">' + stars + '</span>' +
          '<span style="font-weight:700;font-size:15px;color:' + text + ';">' + data.rating.toFixed(1) + '/5</span>' +
        '</div>' +
        '<span style="font-size:12px;color:#6b7280;">' + data.reviewCount + ' Bewertungen</span>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:1px;padding-left:12px;border-left:1px solid ' + border + ';">' +
        (data.verified ? '<span style="font-size:10px;color:#10b981;font-weight:600;">✓ Verifiziert</span>' : '') +
        '<img src="' + BEREIFUNG24_BASE + '/logos/B24_Logo_blau.png" alt="Bereifung24" style="height:20px;width:auto;">' +
      '</div>' +
    '</div>';

    insertAfterScript(container);
  }

  // ========================
  // VARIANT 2: Booking Button
  // ========================
  function renderButton(data) {
    var container = createContainer('b24-button');

    container.innerHTML = '<a href="' + data.bookingUrl + '" target="_blank" rel="noopener" style="' +
      'display:inline-flex;align-items:center;gap:10px;padding:12px 24px;' +
      'background:' + customColor + ';color:#fff;border:none;border-radius:8px;' +
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;font-weight:600;' +
      'text-decoration:none;cursor:pointer;transition:opacity 0.2s,transform 0.2s;' +
      'box-shadow:0 2px 8px rgba(0,112,243,0.3);"' +
      ' onmouseover="this.style.opacity=\'0.9\';this.style.transform=\'translateY(-1px)\'"' +
      ' onmouseout="this.style.opacity=\'1\';this.style.transform=\'none\'">' +
      '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
      'Online-Termin buchen' +
    '</a>';

    insertAfterScript(container);
  }

  // ========================
  // VARIANT 3: Service Card
  // ========================
  function renderCard(data) {
    var container = createContainer('b24-card');
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#ffffff';
    var text = isDark ? '#ffffff' : '#1a1a2e';
    var subtext = isDark ? '#a0aec0' : '#6b7280';
    var border = isDark ? '#333' : '#e5e7eb';
    var cardBg = isDark ? '#252540' : '#f9fafb';
    var stars = renderStars(data.rating);

    var servicesHtml = '';
    var serviceIcons = {
      'TIRE_CHANGE': '🔄',
      'WHEEL_CHANGE': '🔁',
      'TIRE_REPAIR': '🔧',
      'MOTORCYCLE_TIRE': '🏍️',
      'ALIGNMENT': '📐',
      'ALIGNMENT_BOTH': '📐',
      'CLIMATE_SERVICE': '❄️',
      'BRAKE_SERVICE': '🛑',
      'BATTERY_SERVICE': '🔋',
      'OTHER_SERVICES': '⚙️',
    };
    
    data.services.forEach(function(s) {
      var priceText = s.price > 0 ? formatPrice(s.price) + ' €' : 'Auf Anfrage';
      var labelHtml = (serviceIcons[s.type] || '🔧') + ' ' + s.label;
      if (s.detail) labelHtml += ' <span style="font-size:11px;color:' + subtext + ';font-weight:400;">(' + s.detail + ')</span>';
      servicesHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;' +
        'background:' + cardBg + ';border-radius:6px;margin-bottom:4px;">' +
        '<span style="font-size:13px;color:' + text + ';">' + labelHtml + '</span>' +
        '<span style="font-size:13px;font-weight:700;color:' + (s.price > 0 ? customColor : subtext) + ';white-space:nowrap;margin-left:8px;">' + priceText + '</span>' +
      '</div>';
    });

    container.innerHTML = '<div style="' +
      'width:320px;padding:20px;background:' + bg + ';border:1px solid ' + border + ';' +
      'border-radius:14px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;' +
      'box-shadow:0 2px 12px rgba(0,0,0,0.08);">' +
      // Header
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">' +
        (data.logo ? '<img src="' + data.logo + '" style="width:40px;height:40px;border-radius:8px;object-fit:cover;" alt="">' : '') +
        '<div>' +
          '<div style="font-weight:700;font-size:15px;color:' + text + ';">' + escapeHtml(data.name) + '</div>' +
          '<div style="display:flex;align-items:center;gap:4px;margin-top:2px;">' +
            '<span style="font-size:12px;">' + stars + '</span>' +
            '<span style="font-size:12px;color:' + subtext + ';">' + data.rating.toFixed(1) + ' · ' + data.reviewCount + ' Bewertungen</span>' +
            (data.verified ? '<span style="font-size:11px;color:#10b981;font-weight:600;margin-left:4px;">✓</span>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      // Services
      '<div style="margin-bottom:16px;">' + servicesHtml + '</div>' +
      // CTA Button
      '<a href="' + data.bookingUrl + '" target="_blank" rel="noopener" style="' +
        'display:block;text-align:center;padding:12px;background:' + customColor + ';' +
        'color:#fff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;' +
        'transition:opacity 0.2s;"' +
        ' onmouseover="this.style.opacity=\'0.9\'"' +
        ' onmouseout="this.style.opacity=\'1\'">' +
        '\ud83d\udd0d Jetzt online buchen' +
      '</a>' +
      // Footer
      '<div style="text-align:center;margin-top:10px;">' +
        '<a href="https://www.bereifung24.de" target="_blank" rel="noopener" style="font-size:11px;color:' + subtext + ';text-decoration:none;">' +
          'Powered by Bereifung24' +
        '</a>' +
      '</div>' +
    '</div>';

    insertAfterScript(container);
  }

  // ========================
  // VARIANT 4: Booking Embed (iframe)
  // ========================
  function renderBooking(data) {
    var container = createContainer('b24-booking');

    container.innerHTML = '<iframe ' +
      'src="' + BEREIFUNG24_BASE + '/widget/booking/' + data.id + '?theme=' + theme + '&color=' + encodeURIComponent(customColor) + '" ' +
      'style="width:100%;max-width:450px;height:520px;border:1px solid ' + (theme === 'dark' ? '#333' : '#e5e7eb') + ';' +
      'border-radius:14px;background:' + (theme === 'dark' ? '#1a1a2e' : '#ffffff') + ';" ' +
      'frameborder="0" allow="payment" loading="lazy" ' +
      'title="Bereifung24 Online-Buchung - ' + escapeHtml(data.name) + '">' +
    '</iframe>';

    insertAfterScript(container);
  }

  // ========================
  // VARIANT 5: Floating Widget
  // ========================
  function renderFloating(data) {
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#ffffff';
    var text = isDark ? '#ffffff' : '#1a1a2e';
    var subtext = isDark ? '#a0aec0' : '#6b7280';
    var border = isDark ? '#333' : '#e5e7eb';
    var cardBg = isDark ? '#252540' : '#f9fafb';
    var posStyle = position === 'left' ? 'left:20px;' : 'right:20px;';
    var stars = renderStars(data.rating);

    var serviceIcons = {
      'TIRE_CHANGE': '🔄',
      'WHEEL_CHANGE': '🔁',
      'TIRE_REPAIR': '🔧',
      'MOTORCYCLE_TIRE': '🏍️',
      'ALIGNMENT': '📐',
      'ALIGNMENT_BOTH': '📐',
      'CLIMATE_SERVICE': '❄️',
      'BRAKE_SERVICE': '🛑',
      'BATTERY_SERVICE': '🔋',
      'OTHER_SERVICES': '⚙️',
    };

    var servicesHtml = '';
    data.services.slice(0, 3).forEach(function(s) {
      var priceText = s.price > 0 ? formatPrice(s.price) + ' €' : 'Auf Anfrage';
      var labelHtml = (serviceIcons[s.type] || '🔧') + ' ' + s.label;
      if (s.detail) labelHtml += ' <span style="font-size:10px;color:' + subtext + ';font-weight:400;">(' + s.detail + ')</span>';
      servicesHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;' +
        'background:' + cardBg + ';border-radius:6px;margin-bottom:3px;">' +
        '<span style="font-size:12px;color:' + text + ';">' + labelHtml + '</span>' +
        '<span style="font-size:12px;font-weight:700;color:' + (s.price > 0 ? customColor : subtext) + ';white-space:nowrap;margin-left:6px;">' + priceText + '</span>' +
      '</div>';
    });

    // Create floating bubble
    var bubble = document.createElement('div');
    bubble.id = 'b24-floating-bubble';
    bubble.innerHTML = '<svg width="24" height="24" fill="none" stroke="#fff" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';
    bubble.style.cssText = 'position:fixed;bottom:20px;' + posStyle + 'width:56px;height:56px;' +
      'background:' + customColor + ';border-radius:50%;cursor:pointer;z-index:999998;' +
      'display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 4px 16px rgba(0,112,243,0.4);transition:transform 0.2s;';

    // Create popup
    var popup = document.createElement('div');
    popup.id = 'b24-floating-popup';
    popup.style.cssText = 'position:fixed;bottom:88px;' + posStyle + 'width:300px;' +
      'background:' + bg + ';border:1px solid ' + border + ';border-radius:14px;' +
      'box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:999999;display:none;' +
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden;' +
      'animation:b24fadeIn 0.2s ease;';

    popup.innerHTML =
      // Header
      '<div style="padding:16px;border-bottom:1px solid ' + border + ';">' +
        '<div style="display:flex;justify-content:space-between;align-items:start;">' +
          '<div>' +
            '<div style="font-weight:700;font-size:14px;color:' + text + ';">' + escapeHtml(data.name) + '</div>' +
            '<div style="display:flex;align-items:center;gap:4px;margin-top:4px;">' +
              '<span style="font-size:12px;">' + stars + '</span>' +
              '<span style="font-size:11px;color:' + subtext + ';">' + data.rating.toFixed(1) + ' · ' + data.reviewCount + ' Bewertungen</span>' +
            '</div>' +
          '</div>' +
          '<span id="b24-close" style="cursor:pointer;font-size:18px;color:' + subtext + ';line-height:1;padding:4px;">✕</span>' +
        '</div>' +
      '</div>' +
      // Services
      '<div style="padding:12px 16px;">' +
        '<div style="font-size:11px;font-weight:600;color:' + subtext + ';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Unsere Services</div>' +
        servicesHtml +
      '</div>' +
      // CTA
      '<div style="padding:12px 16px;border-top:1px solid ' + border + ';">' +
        '<a href="' + data.bookingUrl + '" target="_blank" rel="noopener" style="' +
          'display:block;text-align:center;padding:11px;background:' + customColor + ';' +
          'color:#fff;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;' +
          'transition:opacity 0.2s;"' +
          ' onmouseover="this.style.opacity=\'0.9\'"' +
          ' onmouseout="this.style.opacity=\'1\'">' +
          'Online-Termin buchen →' +
        '</a>' +
        '<div style="text-align:center;margin-top:6px;">' +
          '<a href="https://www.bereifung24.de" target="_blank" rel="noopener" style="font-size:10px;color:' + subtext + ';text-decoration:none;">' +
            'Powered by Bereifung24' +
          '</a>' +
        '</div>' +
      '</div>';

    // Add animation keyframes
    var style = document.createElement('style');
    style.textContent = '@keyframes b24fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);

    document.body.appendChild(bubble);
    document.body.appendChild(popup);

    var isOpen = false;
    bubble.onclick = function() {
      isOpen = !isOpen;
      popup.style.display = isOpen ? 'block' : 'none';
      bubble.style.transform = isOpen ? 'scale(0.9)' : 'scale(1)';
    };

    bubble.onmouseover = function() { if (!isOpen) bubble.style.transform = 'scale(1.08)'; };
    bubble.onmouseout = function() { if (!isOpen) bubble.style.transform = 'scale(1)'; };

    popup.querySelector('#b24-close').onclick = function(e) {
      e.stopPropagation();
      isOpen = false;
      popup.style.display = 'none';
      bubble.style.transform = 'scale(1)';
    };
  }

  // ========================
  // HELPERS
  // ========================
  function renderStars(rating) {
    var full = Math.floor(rating);
    var half = rating % 1 >= 0.3;
    var html = '';
    for (var i = 0; i < 5; i++) {
      if (i < full) {
        html += '⭐';
      } else if (i === full && half) {
        html += '⭐';
      }
    }
    return html || '☆';
  }

  function formatPrice(price) {
    if (!price && price !== 0) return '–';
    return price.toFixed(2).replace('.', ',');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function createContainer(id) {
    var el = document.createElement('div');
    el.id = id;
    el.style.cssText = 'display:inline-block;';
    return el;
  }

  function insertAfterScript(el) {
    if (scriptTag.parentNode) {
      scriptTag.parentNode.insertBefore(el, scriptTag.nextSibling);
    } else {
      document.body.appendChild(el);
    }
  }

})();
