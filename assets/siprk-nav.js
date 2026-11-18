(function () {
  // Enforce strict Mobile App viewport (430px) on all screens
  const mobileStyle = document.createElement('style');
  mobileStyle.id = 'siprk-mobile-enforcer';
  mobileStyle.textContent = `
    html {
      background-color: #E6ECF5 !important;
    }
    body {
      max-width: 430px !important;
      width: 100% !important;
      margin-left: auto !important;
      margin-right: auto !important;
      min-height: 100dvh !important;
      box-shadow: 0 0 40px rgba(20, 50, 92, 0.15) !important;
      border-left: 1px solid rgba(194, 198, 211, 0.6) !important;
      border-right: 1px solid rgba(194, 198, 211, 0.6) !important;
      position: relative !important;
      overflow-x: hidden !important;
    }
    header.fixed, nav.fixed, footer.fixed, aside.fixed {
      max-width: 430px !important;
      left: 0 !important;
      right: 0 !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
  `;
  document.head.appendChild(mobileStyle);

  async function initAppShell() {
    if (!window.SIPRK) return;
    await window.SIPRK.syncFromServer();
    const ok = window.SIPRK.enforceRBAC();
    if (!ok) return;

    const currentFile = window.SIPRK.getCurrentFile();
    window.SIPRK.renderBottomNav(currentFile);

    // Wire notification bell buttons in top app bar to S15 Notifikasi
    document.querySelectorAll('button[aria-label="Notifikasi"]').forEach(btn => {
      btn.onclick = () => {
        window.location.href = 's15-notifikasi.html';
      };
    });
  }

  if (!window.SIPRK) {
    const script = document.createElement('script');
    script.src = '../assets/siprk-session.js';
    script.onload = initAppShell;
    document.head.appendChild(script);
  } else {
    window.addEventListener('DOMContentLoaded', initAppShell);
  }
})();
