// Create HTML for notification
const notificationHTML = `
<div class="popup-notification" id="popupNotification">
    <div class="popup-header">
        <span class="popup-title">New Notification</span>
        <button class="popup-close" onclick="closePopup()" title="Close" aria-label="Close notification">✖</button>
    </div>
    <div class="popup-content">
        
        <!-- Chỗ này là chèn TIKTOK --------------------------------------------------------------------------------------------------------------->

        <p class="announcement">
                <img src="/Chat/tik-tok.png" alt="TikTok" class="tiktok-icon"> My TikTok channel!            
                <a href="https://www.tiktok.com/@haleyplaygame" target="_blank" class="tiktok-link">
                    <i class="fab fa-tiktok"></i> @haleyplaygame
                </a>
        </p>
 </p>
        <div class="cloak-row" style="text-align:center; margin-top: 8px;">
            <button id="cloakBtnNotif" class="cloak-btn" title="Open in about:blank">🕶️ About:blank</button>
            <button id="cloakCustomBtn" class="cloak-btn" title="Custom cloak with title and icon" style="margin-left: 8px;">🎭 Cloak</button>
        </div>

        <!-- Chỗ này là chèn khung chat --------------------------------------------------------------------------------------------------------------->

        <!-- Chat container - Lazy loaded to improve performance -->
        <div class="chat-container" id="chat-container">
            <!-- Chat iframe will be loaded after 5 seconds to improve initial page load -->
            <div style="width: 100%; height: 600px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border-radius: 8px;">
                <p style="color: #666;">Loading chat...</p>
            </div>
        </div>
    </div>
</div>

<!-- Cloak Modal -->
<div id="cloakModal" class="cloak-modal">
    <div class="cloak-modal-content">
        <div class="cloak-modal-header">
            <h3>🎭 Custom Cloak</h3>
            <button class="close-cloak-modal" onclick="closeCloakModal()">×</button>
        </div>
        <form id="cloakForm">
            <div class="cloak-form-group">
                <label for="cloakTitle">Page Title:</label>
                <input type="text" id="cloakTitle" placeholder="Enter custom title..." value="Google">
            </div>
            <div class="cloak-form-group">
                <label for="cloakIcon">Favicon URL:</label>
                <input type="text" id="cloakIcon" placeholder="Enter icon URL..." value="https://www.google.com/favicon.ico">
            </div>
            <button type="submit" class="cloak-submit-btn">Create Cloaked Page</button>
        </form>
    </div>
</div>

<!-- Removed game panels -->

<!-- Removed reward modal -->

<style>
.popup-notification {
                      position: fixed;
                      bottom: 30px;
                      right: 30px;
                      background: linear-gradient(to right bottom, #ffffff, #f8f9fa);
                      border-radius: 15px;
                      padding: 5px;
                      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                      z-index: 1000;
                      width: 450px;
                      transform: scale(0.7);
                      transform-origin: bottom right;
                      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                      display: none;
                      color: #333;
                      border: 1px solid rgba(0,0,0,0.1);
                    }

.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid #eee;
}

.popup-title {
    font-weight: 600;
    color: #2c3e50;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.popup-title::before {
    content: "🔔";
    font-size: 1.2rem;
}

.popup-close {
    background: #ffe0e0;
    border: 2px solid #ff6b6b;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 18px;
    color: #c53030;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.popup-close:hover {
    background: #ffd1d1;
    color: #9b2c2c;
    transform: scale(1.05);
}

.announcement {
    background: linear-gradient(45deg, #ffffff, #ffffff);
    color: rgb(0, 0, 0);
    padding: 15px 20px;
    border-radius: 8px;
    margin: 20px 0;
    font-size: 16px;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.tiktok-link {
    display: inline-block;
    color: #0457a7;
    text-decoration: none;
    font-weight: bold;
    margin-left: 5px;
    transition: transform 0.3s ease;
}

.tiktok-link:hover {
    transform: scale(1.05);
    color: #ffffff;
    text-decoration: underline;
}

.fa-tiktok {
    margin-right: 5px;
    color: #000000;
}

@media (max-width: 768px) {
    .popup-notification {
        width: calc(100% - 40px);
        bottom: 20px;
        right: 20px;
    }
}

.popup-notification.show {
    display: block;
    animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateY(100px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.popup-notification.minimized {
    transform: scale(0.1) translateY(500%);
    opacity: 0;
    transition: all 0.3s ease-in-out;
}

#minimizeButton {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4a90e2;
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: bounce 1s infinite;
    transition: all 0.3s ease;
}

#minimizeButton:hover {
    transform: scale(1.05);
    background: #357abd;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

.popup-notification {
    transition: all 0.3s ease-in-out;
}

.buttons-container {
    display: flex;
    justify-content: center;
    gap: 15px; /* Khoảng cách giữa các nút */
    margin: 10px 0;
    flex-wrap: wrap; /* Cho phép xuống dòng trên màn hình nhỏ */
}

.game-btn {
    background: linear-gradient(45deg, #ff4444, #ff6b6b);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
}

/* Hiệu ứng tỏa sáng */
.game-btn::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, 
        #ff0000, #ff7300, #fffb00, #48ff00, 
        #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000
    );
    z-index: -1;
    background-size: 400%;
    border-radius: 25px;
    animation: glowing 20s linear infinite;
    opacity: 0.8;
    filter: blur(5px);
}

@keyframes glowing {
    0% { background-position: 0 0; }
    50% { background-position: 400% 0; }
    100% { background-position: 0 0; }
}

/* Hiệu ứng hover */
.game-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(255, 68, 68, 0.6);
}

.game-btn:hover::before {
    filter: blur(8px);
    opacity: 1;
}

.game-btn:active {
    transform: scale(0.95);
}

/* Styles cho game panel */
.war-game-panel {
    position: fixed;
    top: 0;
    left: -100%;  /* Bắt đầu ẩn bên trái */
    width: 80%;
    height: 100vh;
    background: #fff;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    z-index: 999;
    transition: left 0.3s ease-in-out;
}

.war-game-panel.show {
    left: 0;  /* Hiện ra khi có class show */
}

.war-game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: linear-gradient(45deg, #ff4444, #ff6b6b);
    color: white;
    font-size: 18px;
    font-weight: bold;
}

.war-close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.war-close-btn:hover {
    background: rgba(255,255,255,0.2);
    transform: rotate(90deg);
}

.war-game-panel iframe {
    width: 100%;
    height: calc(100% - 60px); /* Trừ đi chiều cao của header */
    border: none;
}

/* Điều chỉnh responsive */
@media (max-width: 768px) {
    .war-game-panel {
        width: 100%;
    }
}

.reward-btn {
    background: linear-gradient(45deg, #ff4444, #ff6b6b);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 10px rgba(255, 68, 68, 0.4),
                inset 0 0 10px rgba(255, 255, 255, 0.2);
}

/* Hiệu ứng tỏa sáng */
.reward-btn::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, 
        #ff0000, #ff7300, #fffb00, #48ff00, 
        #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000
    );
    z-index: -1;
    background-size: 400%;
    border-radius: 25px;
    animation: glowing 20s linear infinite;
    opacity: 0.8;
    filter: blur(5px);
}

@keyframes glowing {
    0% { background-position: 0 0; }
    50% { background-position: 400% 0; }
    100% { background-position: 0 0; }
}

/* Hiệu ứng hover */
.reward-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(255, 68, 68, 0.6),
                inset 0 0 15px rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
}

.reward-btn:hover::before {
    filter: blur(8px);
    opacity: 1;
}

.reward-btn:active {
    transform: scale(0.95);
}

.reward-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 1001;
}

.reward-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 15px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 5px 25px rgba(0,0,0,0.2);
}

.reward-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f0f0f0;
}

.reward-header h3 {
    margin: 0;
    color: #FF6B6B;
    font-size: 1.5em;
}

.close-reward {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

.reward-steps h3 {
    margin: 0;
    color: #444;
    font-size: 1em;
    margin-bottom: 15px;
}

.reward-steps p {
    margin: 15px 0;
    padding-left: 20px;
    position: relative;
    color: #444;
}

.reward-steps p::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #4CAF50;
}

.reward-note {
    margin-top: 20px;
    padding: 15px;
    background: #FFF3E0;
    border-radius: 10px;
    text-align: center;
    color: #FF6B6B;
    font-weight: bold;
}

.tiktok-icon {
    width: 20px;
    height: 20px;
    vertical-align: middle;
    margin-right: 5px;
}

/* Style riêng cho nút Walk & Talk */
.nature-theme {
    background: linear-gradient(45deg, #3ebc6f, #34a853);
    color: white;
}

.nature-theme::before {
    background: linear-gradient(45deg, 
        #2ecc71, #27ae60, #3ebc6f, #34a853, 
        #2ecc71, #27ae60, #3ebc6f, #34a853
    );
}

.nature-theme:hover {
    box-shadow: 0 0 20px rgba(46, 204, 113, 0.6);
}

/* Style riêng cho nút OMG Games */
.game-theme {
    background: linear-gradient(45deg, #8834f8, #5534f8);
    color: white;
}

.game-theme::before {
    background: linear-gradient(45deg, 
        #8834f8, #5534f8, #6a34f8, #4834f8, 
        #8834f8, #5534f8, #6a34f8, #4834f8
    );
}

.game-theme:hover {
    box-shadow: 0 0 20px rgba(106, 52, 248, 0.6);
}

/* Style riêng cho nút reward */
.reward-theme {
    background: linear-gradient(45deg, #ffd700, #ffb700);
    color: white;
}

.reward-theme::before {
    background: linear-gradient(45deg, 
        #ffd700, #ffb700, #ffc800, #ff9900, 
        #ffd700, #ffb700, #ffc800, #ff9900
    );
}

.reward-theme:hover {
    box-shadow: 0 0 20px rgba(255, 183, 0, 0.6);
}

.cloak-btn {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #2d3748;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 600;
}
.cloak-btn:hover {
    background: #f7fafc;
}

/* Cloak modal styles */
.cloak-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 1002;
}

.cloak-modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 15px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 5px 25px rgba(0,0,0,0.2);
}

.cloak-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f0f0f0;
}

.cloak-modal-header h3 {
    margin: 0;
    color: #2d3748;
    font-size: 1.5em;
}

.close-cloak-modal {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

.cloak-form-group {
    margin-bottom: 15px;
}

.cloak-form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #2d3748;
}

.cloak-form-group input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
}

.cloak-form-group input:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.cloak-submit-btn {
    background: #4a90e2;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    width: 100%;
}

.cloak-submit-btn:hover {
    background: #357abd;
}
</style>
`;

// Removed game handlers

// Initialize notification
function initNotification() {
  // Insert HTML into body
  document.body.insertAdjacentHTML("beforeend", notificationHTML);

  // If user dismissed before, do not auto show across pages
  const dismissed = localStorage.getItem("popupDismissed") === "true";
  if (!dismissed) {
    // Show notification after 3 seconds
    setTimeout(() => {
      const popup = document.getElementById("popupNotification");
      if (popup) popup.classList.add("show");
    }, 2000);
  } else {
    // Provide a manual open button if dismissed
    showMinimizeButton();
  }

  // Removed reward modal handlers
}

// Close popup function
function closePopup() {
  const popup = document.getElementById("popupNotification");
  // Thêm class để tạo hiệu ứng thu nhỏ
  popup.classList.add("minimized");
  // Persist dismissal across pages
  localStorage.setItem("popupDismissed", "true");

  // Tạo nút minimize để mở lại popup
  showMinimizeButton();
}

// Render a reopen/minimize button to manually open the popup
function showMinimizeButton() {
  if (document.getElementById("minimizeButton")) return; // avoid duplicates
  const popup = document.getElementById("popupNotification");
  const minimizeBtn = document.createElement("div");
  minimizeBtn.id = "minimizeButton";
  minimizeBtn.innerHTML = "📢 New Notification";
  minimizeBtn.onclick = () => {
    if (popup) popup.classList.remove("minimized");
    popup.classList.add("show");
    // User chose to reopen → treat as not dismissed so future pages auto show
    localStorage.removeItem("popupDismissed");
    minimizeBtn.remove();
  };
  document.body.appendChild(minimizeBtn);
}

// Attach cloak handler
function attachCloakHandler() {
  const btn = document.getElementById("cloakBtnNotif");
  if (!btn) return;
  btn.addEventListener("click", function () {
    try {
      const html =
        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Loading...</title><style>html,body{margin:0;height:100%;overflow:hidden}</style></head><body><iframe src="' +
        location.href +
        '" style="border:0;width:100%;height:100%" allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media"></iframe></body></html>';
      const win = window.open("about:blank", "_blank");
      if (!win) return;
      win.document.open();
      win.document.write(html);
      win.document.close();
    } catch (e) {
      console.error(e);
    }
  });
}

// Custom cloak modal functions
function showCloakModal() {
  const modal = document.getElementById("cloakModal");
  if (modal) modal.style.display = "block";
}

function closeCloakModal() {
  const modal = document.getElementById("cloakModal");
  if (modal) modal.style.display = "none";
}

function createCustomCloak() {
  const title = document.getElementById("cloakTitle").value || "Google";
  const icon =
    document.getElementById("cloakIcon").value ||
    "https://www.google.com/favicon.ico";

  try {
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <link rel="icon" href="${icon}">
    <style>html,body{margin:0;height:100%;overflow:hidden}</style>
</head>
<body>
    <iframe src="${location.href}" style="border:0;width:100%;height:100%" allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media"></iframe>
</body>
</html>`;

    const win = window.open("about:blank", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    closeCloakModal();
  } catch (e) {
    console.error(e);
  }
}

// Attach custom cloak handler
function attachCustomCloakHandler() {
  const btn = document.getElementById("cloakCustomBtn");
  if (!btn) return;
  btn.addEventListener("click", showCloakModal);

  const form = document.getElementById("cloakForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      createCustomCloak();
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initNotification();
  attachCloakHandler();
  attachCustomCloakHandler();

  // Lazy load chat iframe after 5 seconds to improve initial page load performance
  setTimeout(function () {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.innerHTML =
        '<iframe src="/Chat/1.html" title="Chat Room - Join the conversation" frameborder="0" style="width: 100%; height: 600px; border: none; margin-top: 15px;"></iframe>';
      console.log("Chat iframe loaded after 5s delay");
    }
  }, 5000);
});
