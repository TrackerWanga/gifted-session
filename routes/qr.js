const { giftedId, removeFile, safeGroupAcceptInvite } = require('../gift');
const { SESSION_PREFIX, GC_JID } = require('../config');
const QRCode = require('qrcode');
const express = require('express');
const zlib = require('zlib');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const pino = require("pino");
const { sendButtons } = require('gifted-btns');
const {
    default: giftedConnect,
    useMultiFileAuthState,
    Browsers,
    delay,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const sessionDir = path.join(__dirname, "session");

const buildQRPage = (qrImage) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>ATASSA MD | QR Code Login</title>
  <meta name="description" content="Scan this QR code with WhatsApp to link your account to Atassa-MD.">
  <meta name="theme-color" content="#7c3aed">
  <meta property="og:title" content="ATASSA MD | QR Code Login">
  <meta property="og:image" content="https://files.giftedtech.co.ke/image/u90mimage.jpg">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:image" content="https://files.giftedtech.co.ke/image/u90mimage.jpg">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #07070e; color: #f1f1f1;
      min-height: 100vh; overflow-x: hidden; scrollbar-width: none;
    }
    body::-webkit-scrollbar { display: none; }
    .gradient-text {
      background: linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #7c3aed 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .blob {
      position: fixed; border-radius: 50%; filter: blur(90px);
      pointer-events: none; z-index: 0; will-change: transform;
    }
    @keyframes blobFloat {
      0%,100% { transform: translate(0,0) scale(1); }
      50%      { transform: translate(20px,-20px) scale(1.05); }
    }
    .nav-glass {
      background: rgba(7,7,14,0.85);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-radius: 0 0 22px 22px;
    }
    .nav-link { position: relative; transition: color 0.2s ease; }
    .nav-link::after {
      content: ''; position: absolute; bottom: -2px; left: 0;
      width: 0; height: 2px;
      background: linear-gradient(90deg, #c084fc, #7c3aed);
      transition: width 0.22s ease; border-radius: 2px;
    }
    .nav-link:hover { color: #c084fc; }
    .nav-link:hover::after { width: 100%; }
    .sidebar-link {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px;
      color: #9ca3af; text-decoration: none;
      font-size: 0.875rem; font-weight: 500;
      transition: background 0.18s, color 0.18s, transform 0.18s;
    }
    .sidebar-link:hover { background: rgba(124,58,237,0.12); color: #c084fc; transform: translateX(4px); }
    .sidebar-link i { width: 18px; text-align: center; font-size: 0.9rem; }
    #sidebar { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
    #sidebarOverlay { transition: opacity 0.3s ease; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 11px 24px; border-radius: 12px;
      font-weight: 600; font-size: 0.875rem;
      cursor: pointer; border: none; text-decoration: none;
      transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      will-change: transform;
    }
    .btn:active { transform: scale(0.97) !important; }
    .btn-primary { background: linear-gradient(135deg, #7c3aed, #9333ea); color: #fff; }
    .btn-primary:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 12px 30px rgba(124,58,237,0.45); }
    .btn-ghost { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; }
    .btn-ghost:hover { transform: translateY(-2px); background: rgba(255,255,255,0.1); }
    .icon-animated { display: inline-flex; align-items: center; transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1); }
    .btn:hover .icon-animated { transform: scale(1.25) rotate(-8deg); }
    .social-icon {
      width: 34px; height: 34px; border-radius: 8px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      display: flex; align-items: center; justify-content: center;
      color: #6b7280; font-size: 0.85rem; text-decoration: none;
      transition: background 0.2s, color 0.2s, transform 0.2s;
    }
    .social-icon:hover { background: rgba(124,58,237,0.2); color: #c084fc; transform: translateY(-3px); }
    .footer-link { color: #6b7280; text-decoration: none; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; transition: color 0.18s, transform 0.18s; }
    .footer-link:hover { color: #c084fc; transform: translateX(4px); }
    .divider-line { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); }
    .card {
      background: rgba(15,15,26,0.95);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 22px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.08);
    }
    @keyframes qrRipple {
      0%   { box-shadow: 0 0 0 0 rgba(168,85,247,0.5), 0 0 0 0 rgba(168,85,247,0.3); }
      70%  { box-shadow: 0 0 0 14px rgba(168,85,247,0), 0 0 0 28px rgba(168,85,247,0); }
      100% { box-shadow: 0 0 0 0 rgba(168,85,247,0), 0 0 0 0 rgba(168,85,247,0); }
    }
    .qr-ripple { animation: qrRipple 2.6s ease-out infinite; border-radius: 20px; }
    @keyframes countdownShrink {
      from { width: 100%; }
      to   { width: 0%; }
    }
    .countdown-bar { animation: countdownShrink 60s linear forwards; }
    [data-anim] {
      will-change: transform, opacity;
      transition: opacity 0.65s cubic-bezier(0.4,0,0.2,1), transform 0.65s cubic-bezier(0.4,0,0.2,1);
    }
    [data-anim="fade-up"]    { opacity: 0; transform: translateY(28px); }
    [data-anim="zoom-in"]    { opacity: 0; transform: scale(0.9); }
    [data-anim="slide-left"] { opacity: 0; transform: translateX(-28px); }
    [data-anim="slide-right"]{ opacity: 0; transform: translateX(28px); }
    [data-anim].in-view { opacity: 1; transform: translateY(0) scale(1) translateX(0); }
    [data-delay="1"] { transition-delay: 0.1s; }
    [data-delay="2"] { transition-delay: 0.2s; }
    [data-delay="3"] { transition-delay: 0.3s; }
  </style>
</head>
<body>
  <div class="blob w-96 h-96 bg-purple-800/18 top-[-80px] left-[-80px]" style="animation:blobFloat 14s ease-in-out infinite;"></div>
  <div class="blob w-72 h-72 bg-violet-600/12 bottom-[10%] right-[-60px]" style="animation:blobFloat 18s ease-in-out 5s infinite;"></div>

  <nav class="nav-glass sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-5 h-12 flex items-center justify-between">
      <a href="/" class="flex items-center gap-3 no-underline">
        <img src="https://files.giftedtech.co.ke/image/u90mimage.jpg" alt="ATASSA" class="w-8 h-8 rounded-full border border-purple-500/50 object-cover" style="transition:box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 0 14px rgba(168,85,247,0.6)'" onmouseout="this.style.boxShadow='none'">
        <span class="text-base font-bold gradient-text">ATASSA-MD</span>
      </a>
      <div class="hidden md:flex items-center gap-7">
        <a href="https://github.com/mauricegift/atassa" target="_blank" class="nav-link text-gray-400 text-sm font-medium no-underline flex items-center gap-1.5"><i class="fab fa-github text-xs"></i> Source Code</a>
        <a href="/pair" class="nav-link text-gray-400 text-sm font-medium no-underline flex items-center gap-1.5"><i class="fas fa-link text-xs"></i> Pair Code</a>
        <a href="/qr" class="nav-link text-purple-400 text-sm font-medium no-underline flex items-center gap-1.5"><i class="fas fa-qrcode text-xs"></i> QR Code</a>
        <a href="https://t.me/mauricegift" target="_blank" class="nav-link text-gray-400 text-sm font-medium no-underline flex items-center gap-1.5"><i class="fab fa-telegram text-xs"></i> Support</a>
      </div>
      <div class="flex items-center gap-3">
        <a href="/pair" class="hidden md:inline-flex btn btn-ghost py-2 px-4 text-xs">
          <span class="icon-animated"><i class="fas fa-link"></i></span> Use Pair Instead
        </a>
        <button id="menuBtn" class="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-500 outline-none focus:outline-none focus:ring-0" style="transition:background 0.18s, color 0.18s;">
          <i class="fas fa-bars" id="menuIcon"></i>
        </button>
      </div>
    </div>
  </nav>

  <div id="sidebarOverlay" class="fixed inset-0 z-40 bg-black/60 opacity-0 pointer-events-none"></div>
  <aside id="sidebar" class="fixed top-0 left-0 z-50 h-full w-72 bg-[#0a0a14] border-r border-white/6 flex flex-col pt-5 pb-8 transform -translate-x-full rounded-r-3xl">
    <div class="flex items-center justify-between px-5 mb-6">
      <a href="/" class="flex items-center gap-2.5 no-underline">
        <img src="https://files.giftedtech.co.ke/image/u90mimage.jpg" alt="ATASSA" class="w-8 h-8 rounded-full border border-purple-500/50 object-cover">
        <span class="text-sm font-bold gradient-text">ATASSA-MD</span>
      </a>
      <button id="closeBtn" class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-gray-400" style="transition:background 0.18s,color 0.18s;">
        <i class="fas fa-times text-sm"></i>
      </button>
    </div>
    <div class="px-3 flex-1 space-y-1">
      <a href="/" class="sidebar-link"><i class="fas fa-home"></i> Home</a>
      <a href="/pair" class="sidebar-link"><i class="fas fa-link"></i> Pair Code</a>
      <a href="/qr" class="sidebar-link" style="background:rgba(124,58,237,0.1);color:#c084fc;"><i class="fas fa-qrcode"></i> QR Code</a>
      <a href="https://github.com/mauricegift/atassa" target="_blank" class="sidebar-link"><i class="fab fa-github"></i> Source Code</a>
      <a href="https://t.me/mauricegift" target="_blank" class="sidebar-link"><i class="fab fa-telegram"></i> Support</a>
      <a href="https://whatsapp.com/channel/0029Vb6lNd511ulWbxu1cT3A" target="_blank" class="sidebar-link"><i class="fab fa-whatsapp"></i> WA Channel</a>
    </div>
    <div class="px-5 pt-5 border-t border-white/6">
      <p class="text-gray-600 text-xs">Powered by Gifted Tech</p>
    </div>
  </aside>

  <main class="relative z-10">
    <section class="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-5 py-12">
      <div class="w-full max-w-sm">

        <div class="text-center mb-7" data-anim="fade-up">
          <div class="flex justify-center mb-4">
            <div class="relative">
              <img src="https://files.giftedtech.co.ke/image/u90mimage.jpg" alt="ATASSA" class="w-20 h-20 rounded-full border-2 border-purple-500/60 object-cover" style="box-shadow:0 0 0 6px rgba(124,58,237,0.1),0 0 30px rgba(124,58,237,0.25);">
              <span class="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0a0a14] rounded-full border border-purple-500/40 flex items-center justify-center">
                <i class="fas fa-qrcode text-purple-400 text-xs"></i>
              </span>
            </div>
          </div>
          <h1 class="text-2xl font-bold gradient-text mb-1">QR Code Login</h1>
          <p class="text-gray-500 text-sm">Scan with WhatsApp to link your account</p>
        </div>

        <div class="card p-6" data-anim="zoom-in" data-delay="1">
          <div class="flex flex-col items-center">
            <p class="text-gray-400 text-xs mb-4 text-center leading-relaxed">
              Go to WhatsApp &rarr; <strong class="text-gray-300">Linked Devices</strong> &rarr; <strong class="text-gray-300">Link a Device</strong>, then scan this code
            </p>

            <div class="qr-ripple p-3 bg-white mb-4" style="width:220px;height:220px;display:flex;align-items:center;justify-content:center;">
              <img src="${qrImage}" alt="QR Code" style="width:100%;height:100%;display:block;border-radius:10px;">
            </div>

            <div class="w-full bg-white/5 rounded-full h-1 mb-3 overflow-hidden">
              <div class="countdown-bar h-full rounded-full" style="background:linear-gradient(90deg,#7c3aed,#c084fc);"></div>
            </div>

            <div class="flex items-center gap-2 text-gray-500 text-xs mb-5">
              <span class="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" style="box-shadow:0 0 6px #4ade80;"></span>
              Code is live &mdash; expires in 60 seconds
            </div>

            <div class="w-full flex gap-3">
              <a href="/pair" class="btn btn-ghost flex-1 text-xs py-2.5">
                <span class="icon-animated"><i class="fas fa-link"></i></span> Use Pair Code
              </a>
              <a href="/" class="btn btn-ghost flex-1 text-xs py-2.5">
                <span class="icon-animated"><i class="fas fa-home"></i></span> Home
              </a>
            </div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-3 gap-3" data-anim="fade-up" data-delay="2">
          <div class="bg-white/[0.025] border border-white/6 rounded-xl p-3 text-center">
            <i class="fas fa-shield-alt text-purple-400 text-sm mb-1.5 block"></i>
            <p class="text-gray-500 text-xs">Encrypted</p>
          </div>
          <div class="bg-white/[0.025] border border-white/6 rounded-xl p-3 text-center">
            <i class="fas fa-mobile-alt text-purple-400 text-sm mb-1.5 block"></i>
            <p class="text-gray-500 text-xs">One Scan</p>
          </div>
          <div class="bg-white/[0.025] border border-white/6 rounded-xl p-3 text-center">
            <i class="fas fa-lock text-purple-400 text-sm mb-1.5 block"></i>
            <p class="text-gray-500 text-xs">Secure</p>
          </div>
        </div>
      </div>
    </section>

    <div class="divider-line"></div>
    <footer class="py-8 px-5 bg-[#040408]">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <a href="/" class="flex items-center gap-2 no-underline">
          <img src="https://files.giftedtech.co.ke/image/u90mimage.jpg" alt="ATASSA" class="w-6 h-6 rounded-full border border-purple-500/40 object-cover">
          <span class="text-xs font-bold gradient-text">ATASSA-MD</span>
        </a>
        <p class="text-gray-700 text-xs text-center">
          &copy; <span id="yr"></span> ATASSA-MD &mdash; Built by <a href="https://github.com/mauricegift" target="_blank" class="text-purple-400 no-underline font-medium" style="transition:color 0.18s;" onmouseover="this.style.color='#c084fc'" onmouseout="this.style.color='#a855f7'">Gifted Tech</a>
        </p>
        <div class="flex gap-2">
          <a href="https://github.com/mauricegift/atassa" target="_blank" class="social-icon"><i class="fab fa-github"></i></a>
          <a href="https://t.me/mauricegift" target="_blank" class="social-icon"><i class="fab fa-telegram"></i></a>
          <a href="https://whatsapp.com/channel/0029Vb6lNd511ulWbxu1cT3A" target="_blank" class="social-icon"><i class="fab fa-whatsapp"></i></a>
        </div>
      </div>
    </footer>
  </main>

  <script>
    document.getElementById('yr').textContent = new Date().getFullYear();

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeBtn');
    const menuIcon = document.getElementById('menuIcon');

    function openSidebar() {
      sidebar.style.transform = 'translateX(0)';
      overlay.style.opacity = '1'; overlay.style.pointerEvents = 'auto';
      menuIcon.className = 'fas fa-times';
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
      sidebar.style.transform = 'translateX(-100%)';
      overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none';
      menuIcon.className = 'fas fa-bars';
      document.body.style.overflow = '';
    }
    menuBtn.addEventListener('click', () => { sidebar.style.transform === 'translateX(0)' ? closeSidebar() : openSidebar(); menuBtn.blur(); });
    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? e.target.classList.add('in-view') : e.target.classList.remove('in-view'));
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('[data-anim]').forEach(el => observer.observe(el));

    (function setCircularFavicon(src) {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.beginPath(); ctx.arc(32,32,32,0,Math.PI*2); ctx.closePath(); ctx.clip();
        ctx.drawImage(img, 0, 0, 64, 64);
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/png'; link.rel = 'shortcut icon';
        link.href = canvas.toDataURL(); document.head.appendChild(link);
      };
      img.src = src;
    })('https://files.giftedtech.co.ke/image/u90mimage.jpg');
  <\/script>
</body>
</html>`;

router.get('/', async (req, res) => {
    const id = giftedId();
    let responseSent = false;
    let sessionCleanedUp = false;

    async function cleanUpSession() {
        if (!sessionCleanedUp) {
            await removeFile(path.join(sessionDir, id));
            sessionCleanedUp = true;
        }
    }

    async function GIFTED_QR_CODE() {
        const { version } = await fetchLatestBaileysVersion();
        console.log(version);
        const { state, saveCreds } = await useMultiFileAuthState(path.join(sessionDir, id));
        try {
            let Gifted = giftedConnect({
                version,
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Desktop"),
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000
            });

            Gifted.ev.on('creds.update', saveCreds);
            Gifted.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (qr && !responseSent) {
                    const qrImage = await QRCode.toDataURL(qr);
                    if (!res.headersSent) {
                        res.send(buildQRPage(qrImage));
                        responseSent = true;
                    }
                }

                if (connection === "open") {
                    await safeGroupAcceptInvite(Gifted, GC_JID);
                    await delay(10000);

                    let sessionData = null;
                    let attempts = 0;
                    const maxAttempts = 10;

                    while (attempts < maxAttempts && !sessionData) {
                        try {
                            const credsPath = path.join(sessionDir, id, "creds.json");
                            if (fs.existsSync(credsPath)) {
                                const data = fs.readFileSync(credsPath);
                                if (data && data.length > 100) {
                                    sessionData = data;
                                    break;
                                }
                            }
                            await delay(2000);
                            attempts++;
                        } catch (readError) {
                            console.error("Read error:", readError);
                            await delay(2000);
                            attempts++;
                        }
                    }

                    if (!sessionData) {
                        await cleanUpSession();
                        return;
                    }

                    try {
                        let compressedData = zlib.gzipSync(sessionData);
                        let b64data = compressedData.toString('base64');
                        await sendButtons(Gifted, Gifted.user.id, {
                            title: '',
                            text: SESSION_PREFIX + b64data,
                            footer: `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɢɪғᴛᴇᴅ ᴛᴇᴄʜ*`,
                            buttons: [
                                {
                                    name: 'cta_copy',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Copy Session',
                                        copy_code: SESSION_PREFIX + b64data
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Visit Bot Repo',
                                        url: 'https://github.com/mauricegift/atassa'
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Join WaChannel',
                                        url: 'https://whatsapp.com/channel/0029Vb6lNd511ulWbxu1cT3A'
                                    })
                                }
                            ]
                        });

                        await delay(2000);
                        await Gifted.ws.close();
                    } catch (sendError) {
                        console.error("Error sending session:", sendError);
                    } finally {
                        await cleanUpSession();
                    }

                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output?.statusCode != 401) {
                    await delay(10000);
                    GIFTED_QR_CODE();
                }
            });
        } catch (err) {
            console.error("Main error:", err);
            if (!responseSent) {
                res.status(500).json({ code: "QR Service is Currently Unavailable" });
                responseSent = true;
            }
            await cleanUpSession();
        }
    }

    try {
        await GIFTED_QR_CODE();
    } catch (finalError) {
        console.error("Final error:", finalError);
        await cleanUpSession();
        if (!responseSent) {
            res.status(500).json({ code: "Service Error" });
        }
    }
});

module.exports = router;
