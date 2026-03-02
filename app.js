// app.js - HaleySchool Galaxy Game System

document.addEventListener("DOMContentLoaded", async () => {
    // 1. UI Elements
    const containers = {
        "featured": document.getElementById("featured-grid-container"),
        "trending": document.getElementById("dense-grid-container"),
        "two-player": document.getElementById("two-player-grid-container"),
        "sports": document.getElementById("sports-grid-container")
    };

    const searchInput = document.querySelector(".search-bar input");
    const searchSuggestions = document.querySelector(".search-suggestions");
    const tagsContainer = document.getElementById("quick-tags-container");
    const notifBtn = document.getElementById("notification-btn");
    const notifDropdown = document.getElementById("notification-dropdown");
    const notifList = document.getElementById("notif-list");
    const badge = document.getElementById("notification-badge");
    const profileAvatar = document.getElementById("profile-avatar");
    const randomGameBtn = document.getElementById("random-game-btn");
    
    // Theme Toggle
    const themeBtn = document.getElementById("theme-toggle");
    let currentTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeIcon(currentTheme);

    const chatBtn = document.getElementById("open-chat-btn");
    if (chatBtn) {
        chatBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (typeof toggleChat === "function") toggleChat();
        });
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", currentTheme);
            localStorage.setItem("theme", currentTheme);
            updateThemeIcon(currentTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (themeBtn) themeBtn.innerHTML = theme === "dark" ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    }

    // Modal & Tray Elements
    const modal = document.getElementById("game-modal");
    const iframeContainer = document.querySelector(".iframe-container");
    const modalTitle = document.getElementById("modal-game-title");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const minimizeBtn = document.getElementById("minimize-btn");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const gameTray = document.getElementById("game-tray");
    
    let gameDatabase = [];
    let gameInstances = {}; // globalId -> { container, gameData }
    let activeInstanceId = null;

    // 2. Helper: Create Game Instance
    function createGameInstance(game) {
        const container = document.createElement("div");
        container.className = "game-instance-wrapper";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.position = "absolute";
        container.style.top = "0";
        container.style.left = "0";
        
        container.innerHTML = `
            <div class="game-loader">
                <img src="logo.png" alt="Loading..." class="loader-logo">
                <p>Please wait a moment, the game is loading...</p>
                <div class="loader-spinner"></div>
            </div>
            <iframe class="game-iframe-el" src="${game.iframe}" frameborder="0" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock" style="width:100%; height:100%; opacity:0; transition: opacity 0.5s ease;"></iframe>
        `;

        const iframe = container.querySelector("iframe");
        const loader = container.querySelector(".game-loader");

        // Use a simpler approach for status updates
        iframe.addEventListener("load", () => {
            iframe.style.opacity = "1";
            loader.classList.add("hidden");
            const statusLabel = document.querySelector(`.tray-item[data-id="${game.globalId}"] .tray-status`);
            if (statusLabel) statusLabel.innerText = "Ready";
        });

        return { container, gameData: game };
    }

    // 2b. Helper: Open/Restore Game
    function openGame(game) {
        if (activeInstanceId === game.globalId) {
            modal.style.display = "block";
            document.body.classList.add("modal-open");
            return;
        }

        if (activeInstanceId !== null) minimizeActiveGame();

        modalTitle.innerText = game.name;
        activeInstanceId = game.globalId;

        if (!gameInstances[game.globalId]) {
            gameInstances[game.globalId] = createGameInstance(game);
            addToTray(game);
        }

        const instance = gameInstances[game.globalId];
        iframeContainer.innerHTML = ""; 
        iframeContainer.appendChild(instance.container);
        instance.container.style.display = "block";
        
        modal.style.display = "block";
        document.body.classList.add("modal-open");

        const trayItem = document.querySelector(`.tray-item[data-id="${game.globalId}"]`);
        if (trayItem) trayItem.style.display = "none";
    }

    // 2c. Random Avatar System
    function randomizeAvatar(data) {
        if (!profileAvatar || !data.length) return;
        const pool = data.filter(g => !g.__NOTE__).slice(0, 50); // Use first 50 stable games
        const randomGame = pool[Math.floor(Math.random() * pool.length)];
        profileAvatar.src = randomGame.logo;
    }

    // 2d. Notification System (Persistent & Dynamic)
    function updateNotifications(data, forceRandom = false) {
        if (!notifList || !data.length) return;
        
        const NOTIF_KEY = "haley_notifications";
        const TIME_KEY = "haley_notif_time";
        const INTERVAL = 6 * 60 * 60 * 1000; // 6 Hours
        
        const now = Date.now();
        const lastUpdate = parseInt(localStorage.getItem(TIME_KEY)) || 0;
        const storedIds = JSON.parse(localStorage.getItem(NOTIF_KEY));
        
        let displayGames = [];
        const pool = data.filter(g => !g.__NOTE__);

        // Check if we need to rotate (force or timeout or no data)
        if (forceRandom || !storedIds || (now - lastUpdate > INTERVAL)) {
            // Pick random 3-5 games to look like a real update
            const count = Math.floor(Math.random() * 3) + 3; 
            const shuffled = [...pool].sort(() => 0.5 - Math.random());
            displayGames = shuffled.slice(0, count);
            
            // Save state
            localStorage.setItem(NOTIF_KEY, JSON.stringify(displayGames.map(g => g.globalId)));
            localStorage.setItem(TIME_KEY, now.toString());
            
            if (forceRandom && badge) {
                badge.style.display = "block";
                badge.style.animation = 'badge-pulse 2s infinite';
            }
        } else {
            // Load the "saved" notifications for this 6-hour window
            displayGames = storedIds.map(id => data.find(g => g.globalId == id)).filter(Boolean);
            if (displayGames.length === 0) displayGames = pool.slice(-5).reverse();
        }

        notifList.innerHTML = displayGames.map(game => `
            <div class="notif-item" data-id="${game.globalId}">
                <img src="${game.logo}" class="notif-img">
                <div class="notif-info">
                    <div class="notif-name">${game.name}</div>
                    <span class="notif-tag">NEW</span>
                </div>
            </div>
        `).join('');

        notifList.querySelectorAll(".notif-item").forEach(item => {
            item.addEventListener("click", () => {
                const game = data.find(g => g.globalId == item.dataset.id);
                if (game) openGame(game);
                if (notifDropdown) notifDropdown.classList.remove("active");
            });
        });
    }

    // Start simulation after data is ready
    function startNotificationSimulation() {
        setInterval(() => {
            // Only update if dropdown is NOT open (don't disturb user)
            if (notifDropdown && !notifDropdown.classList.contains("active")) {
                updateNotifications(gameDatabase, true);
            }
        }, 21600000); // Correct 6 hours in milliseconds
    }

    function toggleNotif() {
        if (notifDropdown) {
            notifDropdown.classList.toggle("active");
            if (badge) badge.style.display = "none";
        }
    }
    if (notifBtn) notifBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleNotif();
    });

    document.addEventListener("click", (e) => {
        if (notifDropdown && !notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
            notifDropdown.classList.remove("active");
        }
    });

    function minimizeActiveGame() {
        if (activeInstanceId === null) return;
        const instance = gameInstances[activeInstanceId];
        if (instance) {
            instance.container.style.display = "none";
            document.body.appendChild(instance.container);
            const trayItem = document.querySelector(`.tray-item[data-id="${activeInstanceId}"]`);
            if (trayItem) trayItem.style.display = "flex";
        }
        activeInstanceId = null;
        modal.style.display = "none";
        document.body.classList.remove("modal-open");
    }

    function addToTray(game) {
        const item = document.createElement("div");
        item.className = "tray-item";
        item.dataset.id = game.globalId;
        item.innerHTML = `
            <img src="${game.logo}" class="tray-img">
            <div class="tray-info">
                <div class="tray-name">${game.name}</div>
                <div class="tray-status">Loading...</div>
            </div>
            <i class="fa-solid fa-xmark tray-close"></i>
        `;
        item.addEventListener("click", (e) => {
            if (e.target.classList.contains("tray-close")) removeGameInstance(game.globalId);
            else openGame(game);
        });
        
        if (gameTray) {
            gameTray.prepend(item);
            gameTray.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function removeGameInstance(id) {
        if (gameInstances[id]) {
            gameInstances[id].container.remove();
            delete gameInstances[id];
        }
        const trayItem = document.querySelector(`.tray-item[data-id="${id}"]`);
        if (trayItem) trayItem.remove();
        
        if (activeInstanceId === id) {
            activeInstanceId = null;
            modal.style.display = "none";
            document.body.classList.remove("modal-open");
        }
    }

    if (closeModalBtn) closeModalBtn.addEventListener("click", () => activeInstanceId !== null && removeGameInstance(activeInstanceId));
    if (minimizeBtn) minimizeBtn.addEventListener("click", minimizeActiveGame);
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener("click", () => {
            const modalContent = document.querySelector(".modal-content");
            if (!document.fullscreenElement) modalContent.requestFullscreen().catch(e => console.error(e));
            else document.exitFullscreen();
        });
    }

    // 3. Render Logic
    function createGameCard(game) {
        const { name, logo, section, type, badge, globalId } = game;
        if (section === "hero") {
            const badgeHTML = badge ? `<span class="badge">${badge}</span>` : "";
            return `<div class="game-card ${type || 'hero-card'}" style="background-image: url('${logo}');" data-global-id="${globalId}"><div class="overlay"><h3>${name}</h3>${badgeHTML}</div></div>`;
        }
        return `<div class="game-card ${type || 'small-square'}" style="background-image: url('${logo}');" data-global-id="${globalId}"><div class="title-bar">${name}</div></div>`;
    }

    function renderGames(data, isFilter = false) {
        Object.values(containers).forEach(c => { if(c) c.innerHTML = ""; });
        const htmlBuffer = { "featured": [], "trending": [], "two-player": [], "sports": [] };
        
        data.forEach(game => {
            if (game.__NOTE__) return;
            let cat = isFilter ? "trending" : (game.category || 'trending');
            if (cat === "featured" && !containers["featured"]) cat = "trending";
            
            const html = createGameCard(game);
            if (htmlBuffer[cat]) htmlBuffer[cat].push(html);
            else htmlBuffer["trending"].push(html);
        });

        Object.keys(containers).forEach(key => {
            if (containers[key]) containers[key].innerHTML = htmlBuffer[key].join('');
        });
    }

    // 4. POWERFUL SEARCH & FILTERING (FIXED)
    const keywordMapping = {
        'action-and-combat': ['action', 'combat', 'ninja', 'strike', 'combat', 'war', 'battle'],
        'car-and-racing': ['car', 'race', 'racing', 'driving', 'moto', 'motox3m', 'drift'],
        'sports': ['sports', 'soccer', 'football', 'basketball', 'golf', 'tennis', 'ball'],
        'multiplayer': ['multiplayer', '2player', 'two-player', 'duel', 'with-friends'],
        'platformer-and-adventure': ['platformer', 'adventure', 'run', 'runner', 'jump', 'snail', 'vex'],
        'puzzle-and-board': ['puzzle', 'chess', 'board', 'card', 'logic', 'block', 'math'],
        'shooting': ['shooting', 'gun', 'sniper', 'shooter', 'strike'],
        'simulation-and-clicker': ['clicker', 'simulation', 'idle', 'tap', 'capybara'],
        'horror-and-survival': ['horror', 'survival', 'scary', 'fnaf', 'freddy', 'zombie']
    };

    function filterByTag(query) {
        const q = query.toLowerCase().trim().replace(/-/g, '');
        
        const filtered = gameDatabase.filter(g => {
            if (g.__NOTE__) return false;
            
            const name = g.name.toLowerCase().replace(/-/g, '');
            const gTags = (g.tags || []).map(t => t.toLowerCase().replace(/-/g, ''));
            const gCat = (g.category || "").toLowerCase().replace(/-/g, '');

            // 1. Direct name match
            if (name.includes(q)) return true;
            
            // 2. Direct category match
            if (gCat === q) return true;

            // 3. Direct tag match
            if (gTags.includes(q)) return true;

            // 4. Keyword Mapping match
            const relatedWords = keywordMapping[query.toLowerCase()] || [];
            if (relatedWords.some(word => name.includes(word.toLowerCase().replace(/-/g, '')))) return true;
            if (relatedWords.some(word => gTags.some(t => t.includes(word.toLowerCase().replace(/-/g, ''))))) return true;

            return false;
        });

        renderGames(filtered, true);
        document.querySelectorAll(".game-section").forEach(s => s.style.display = "none");
        const trendingSection = document.getElementById("section-trending");
        if (trendingSection) {
            trendingSection.style.display = "block";
            const titleEl = document.getElementById("section-title-trending");
            if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-search" style="color:var(--primary)"></i> Result for: "${query.toUpperCase()}" (${filtered.length} games)`;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function generateTags(data) {
        const heroTags = [
            'trollgames', 'action-and-combat', 'puzzle-and-board', 'multiplayer', 'car-and-racing', 
            'shooting', 'horror-and-survival', 'simulation-and-clicker', 'sports', 'adventure', 'soccer'
        ];
        
        const blacklist = ["other", "otherseries", "index", "html", "gh", "trending", "small", "hero", "dense", "uk", "pages", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
        const tagCounts = {};
        
        data.forEach(game => {
            if (game.tags) {
                game.tags.forEach(t => {
                    const tag = t.toLowerCase();
                    if (!blacklist.includes(tag) && tag.length > 1) {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    }
                });
            }
        });

        const popularTags = Object.entries(tagCounts)
            .sort((a,b) => b[1] - a[1])
            .map(e => e[0])
            .filter(t => !heroTags.includes(t));

        // Combine Hero Tags + Popular Tags to make a long list
        const finalTags = [...heroTags, ...popularTags].slice(0, 40);

        if (tagsContainer) {
            tagsContainer.innerHTML = finalTags.map(t => `<a href="#" class="tag" data-tag="${t}">#${t}</a>`).join('');
            tagsContainer.querySelectorAll(".tag").forEach(el => el.addEventListener("click", e => {
                e.preventDefault();
                filterByTag(el.dataset.tag);
            }));
        }
    }

    // 5. Init
    try {
        const res = await fetch('games.json');
        const rawData = await res.json();
        gameDatabase = rawData.map((g, i) => ({ ...g, globalId: i }));
        renderGames(gameDatabase);
        generateTags(gameDatabase);
        randomizeAvatar(gameDatabase);
        updateNotifications(gameDatabase);
        startNotificationSimulation();
        
        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) {
            loadingScreen.style.opacity = "0";
            setTimeout(() => { loadingScreen.style.display = "none"; }, 500);
        }
    } catch (err) { console.error(err); }

    // 6. Navigation Event Delegation (Improved)
    document.addEventListener("click", (e) => {
        // Handle Game Cards
        const card = e.target.closest(".game-card");
        if (card) {
            const game = gameDatabase.find(g => g.globalId == card.dataset.globalId);
            if (game) openGame(game);
            return;
        }

        // Handle Sidebar and Tags
        const navEl = e.target.closest(".menu-item, .grid-item, .tag, [data-filter], [data-tag]");
        if (navEl) {
            e.preventDefault();
            const filter = navEl.dataset.filter;
            const tag = navEl.dataset.tag;

            // Update Active State for Sidebar Items
            if (navEl.classList.contains("menu-item")) {
                document.querySelectorAll(".sidebar .menu-item").forEach(el => el.classList.remove("active"));
                navEl.classList.add("active");
            }

            if (filter === 'all') {
                renderGames(gameDatabase);
                document.querySelectorAll(".game-section").forEach(s => s.style.display = "block");
                const title = document.getElementById("section-title-trending");
                if (title) title.innerHTML = `<i class="fa-solid fa-bolt" style="color:#ff5252"></i> Trending Games`;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (filter === 'trending') {
                filterByTag('trending');
            } else if (tag) {
                filterByTag(tag);
            } else if (filter) {
                filterByTag(filter);
            }
        }

        // Random Button Specific
        const randBtn = e.target.closest("#random-game-btn");
        if (randBtn) {
            e.preventDefault();
            const pool = gameDatabase.filter(g => !g.__NOTE__);
            if (pool.length) {
                const random = pool[Math.floor(Math.random() * pool.length)];
                openGame(random);
            }
        }
    });

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const kw = e.target.value.toLowerCase().trim();
            if (kw === "") {
                searchSuggestions.classList.remove("active");
                return;
            }
            const filtered = gameDatabase.filter(g => !g.__NOTE__ && g.name.toLowerCase().includes(kw)).slice(0, 8);
            if (filtered.length) {
                searchSuggestions.innerHTML = `<div class="suggestion-header">Suggestions</div>` + filtered.map(g => `
                    <div class="suggestion-item" data-id="${g.globalId}">
                        <img src="${g.logo}" style="width:30px; height:30px; border-radius:5px; object-fit:cover;">
                        <span>${g.name}</span>
                    </div>
                `).join('');
                searchSuggestions.querySelectorAll(".suggestion-item").forEach(item => item.addEventListener("click", () => {
                    const game = gameDatabase.find(g => g.globalId == item.dataset.id);
                    if (game) openGame(game);
                    searchSuggestions.classList.remove("active");
                    searchInput.value = "";
                }));
                searchSuggestions.classList.add("active");
            } else {
                searchSuggestions.classList.remove("active");
            }
        });

        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                filterByTag(searchInput.value);
                searchSuggestions.classList.remove("active");
            }
        });
    }

    const searchBtn = document.querySelector(".search-bar button");
    if (searchBtn) searchBtn.addEventListener("click", () => filterByTag(searchInput.value));

    // Close suggestions when clicking outside
    document.addEventListener("click", (e) => {
        if (searchInput && !searchInput.contains(e.target) && searchSuggestions && !searchSuggestions.contains(e.target)) {
            searchSuggestions.classList.remove("active");
        }
    });
});
