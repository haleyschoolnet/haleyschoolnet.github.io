// app.js - HaleySchool Galaxy Game System

document.addEventListener("DOMContentLoaded", async () => {
    // 1. UI Elements
    const containers = {
        "trending": document.getElementById("dense-grid-container"),
        "two-player": document.getElementById("two-player-grid-container"),
        "sports": document.getElementById("sports-grid-container")
    };

    const searchInput = document.querySelector(".search-bar input");
    const searchSuggestions = document.querySelector(".search-suggestions");
    const tagsContainer = document.getElementById("quick-tags-container");
    const sidebarItems = document.querySelectorAll(".menu-item, .grid-item");

    // Theme Toggle
    const themeBtn = document.getElementById("theme-toggle");
    let currentTheme = localStorage.getItem("theme");
    if (!currentTheme) {
        currentTheme = "dark";
        localStorage.setItem("theme", "dark");
    }
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeIcon(currentTheme);

    themeBtn.addEventListener("click", () => {
        const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
        updateThemeIcon(theme);
    });

    function updateThemeIcon(theme) {
        themeBtn.innerHTML = theme === "dark" ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    }

    // Modal Elements
    const modal = document.getElementById("game-modal");
    const modalIframe = document.getElementById("game-iframe");
    const modalTitle = document.getElementById("modal-game-title");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const randomGameBtn = document.getElementById("random-game-btn");
    
    let gameDatabase = [];

    // 2. Helper: Open Game in Modal
    function openGame(game) {
        modalTitle.innerText = game.name;
        modalIframe.src = game.iframe;
        modal.style.display = "block";
        document.body.classList.add("modal-open");
    }

    function closeGame() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        modal.style.display = "none";
        modalIframe.src = "";
        document.body.classList.remove("modal-open");
    }

    closeModalBtn.addEventListener("click", closeGame);

    fullscreenBtn.addEventListener("click", () => {
        const modalContent = document.querySelector(".modal-content");
        if (!document.fullscreenElement) {
            modalContent.requestFullscreen().catch(err => {
                alert(`Error: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // 3. Helper: Create Card HTML (Updated to handle click)
    function createGameCard(game) {
        const { name, logo, section, type, badge, globalId } = game;
        const isHero = section === "hero";
        let cardHTML = "";

        if (isHero) {
            let badgeHTML = badge ? `<span class="badge">${badge}</span>` : "";
            cardHTML = `
                <div class="game-card ${type || 'hero-card'}" style="background-image: url('${logo}');" data-global-id="${globalId}">
                    <div class="overlay">
                        <h3>${name}</h3>
                        ${badgeHTML}
                    </div>
                </div>
            `;
        } else {
            cardHTML = `
                 <div class="game-card ${type || 'small-square'}" style="background-image: url('${logo}');" data-global-id="${globalId}">
                    <div class="title-bar">${name}</div>
                </div>
            `;
        }
        return cardHTML;
    }

    // click delegation for game cards
    document.addEventListener("click", (e) => {
        const card = e.target.closest(".game-card");
        if (card) {
            const globalId = card.dataset.globalId;
            const game = gameDatabase.find(g => g.globalId == globalId);
            if (game) {
                openGame(game);
            }
        }
    });

    // 4. Render Interface
    function renderGames(data, isFilter = false) {
        // Clear all containers first
        Object.values(containers).forEach(c => { if(c) c.innerHTML = ""; });
        
        const htmlBuffer = { "featured": [], "trending": [], "two-player": [], "sports": [] };

        data.forEach((game) => {
            if (game.__NOTE__) return;
            
            // If filtering, ignore the game's original category and put it in the main grid
            const cat = isFilter ? "trending" : (game.category || 'trending');
            const html = createGameCard(game);
            
            if (htmlBuffer[cat]) htmlBuffer[cat].push(html);
            else htmlBuffer["trending"].push(html);
        });

        // Fill containers
        Object.keys(containers).forEach(key => {
            if (containers[key]) containers[key].innerHTML = htmlBuffer[key].join('');
        });
    }

    function generateTags(data) {
        const blacklist = ["other", "otherseries", "3d", "2d", "index", "html", "uk", "haleyschool", "pages", "gh", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "trending", "small", "hero", "dense"];
        const heroTags = [
            'trollgames', 'action-and-combat', 'puzzle-and-board', 'platformer-and-adventure', 
            'runner-and-arcade', 'horror-and-survival', 'simulation-and-clicker', 
            'car-and-racing', 'soccer', 'basketball', 'shooting', 'multiplayer'
        ];

        const tagCounts = {};
        data.forEach(game => {
            if (game.tags) {
                game.tags.forEach(t => {
                    const tag = t.toLowerCase();
                    if (!blacklist.includes(tag) && tag.length > 2) {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    }
                });
            }
        });

        // Collect final tags: Hero tags first, then popularity
        let finalTags = heroTags.filter(ht => {
            // Only keep hero tags that actually have games (either in tags or keywordMapping)
            // For now, assume hero tags are valid if they are in the mapping
            return true; 
        });

        const popularTags = Object.entries(tagCounts)
            .sort((a,b) => b[1]-a[1])
            .map(e => e[0])
            .filter(t => !finalTags.includes(t));

        finalTags = [...finalTags, ...popularTags].slice(0, 20);
            
        if (tagsContainer) {
            tagsContainer.innerHTML = finalTags.map(t => `<a href="#" class="tag" data-tag="${t}">#${t}</a>`).join('');
            
            tagsContainer.querySelectorAll(".tag").forEach(el => {
                el.addEventListener("click", (e) => {
                    e.preventDefault();
                    filterByTag(el.dataset.tag);
                });
            });
        }
    }

    const keywordMapping = {
        'action-and-combat': ['actionandcombat', 'combat', 'battle', 'fighter', 'kombat', 'strike', 'war', 'ninja'],
        'car-and-racing': ['carandracing', 'race', 'driving', 'track', 'drift', 'stunt', 'moto', 'motox3m', 'motor'],
        'sports': ['sports', 'soccer', 'basketball', 'golf', 'football', 'tennis', 'ball', 'penalty', 'fifa', 'heads'],
        'multiplayer': ['multiplayer', 'two-player', 'randomseries', '2player', 'duel', 'with-friends', 'online'],
        'platformer-and-adventure': ['platformerandadventure', 'adventure', 'snailbob', 'vex', 'running', 'slope'],
        'puzzle-and-board': ['puzzleandboard', 'puzzle', '2048', 'boardgames', 'chess', 'card', 'block', 'logic'],
        'runner-and-arcade': ['runnerandarcade', 'arcade', 'retro', 'pacman', 'snake', 'subway', 'run'],
        'horror-and-survival': ['horrorandsurvival', 'horror', 'fnaf', 'backrooms', 'zombies', 'poppy', 'scary'],
        'shooting': ['shotting', 'shooting', 'sniper', 'strike', 'combat', 'gun', 'time-shooter', 'bank-robbery'],
        'simulation-and-clicker': ['clicker', 'simulation-and-clicker', 'capybara', 'cookie', 'idle', 'tap'],
        'educational': ['educational', 'math', 'quiz', 'learn', 'brain', 'riddle'],
        'soccer': ['soccer', 'football', 'penalty', 'fifa'],
        'fnaf': ['fnaf', 'freddy', 'nights', 'scary', 'five-nights'],
        'mario': ['mario', 'luigi', 'kart', 'super-mario'],
        'papas': ['papas', 'papa', 'burgeria', 'pizzeria', 'bakeria', 'donuteria', 'freezeria', 'scooperia', 'pancakeria', 'wingeria'],
        'fireboy': ['fireboy', 'watergirl', 'forest', 'temple'],
        'minecraft': ['minecraft', 'craft', 'noob', 'steve', 'pickaxe'],
        'bloons': ['bloons', 'td', 'tower'],
        'henry': ['henry', 'stickmin', 'infiltrating', 'escaping', 'stealing']
    };

    function filterByTag(tag) {
        let tagsToSearch = [tag.toLowerCase()];
        if (keywordMapping[tag.toLowerCase()]) tagsToSearch = keywordMapping[tag.toLowerCase()];

        const filtered = gameDatabase.filter(g => {
            if (g.__NOTE__) return false;
            
            // Check original category field
            if (g.category && g.category.toLowerCase() === tag.toLowerCase()) return true;

            // Check name for keywords
            const nameLower = g.name.toLowerCase();
            if (tagsToSearch.some(keyword => nameLower.includes(keyword))) return true;

            // Check tags
            if (g.tags && g.tags.some(t => tagsToSearch.includes(t.toLowerCase().replace(/-/g, '')))) return true;
            
            return false;
        });

        renderGames(filtered, true);
        
        // Update UI to show results
        document.querySelectorAll(".game-section").forEach(s => s.style.display = "none");
        const trendingSection = document.getElementById("section-trending");
        trendingSection.style.display = "block";
        document.getElementById("section-title-trending").innerHTML = 
            `<i class="fa-solid fa-layer-group" style="color:var(--primary)"></i> Category: ${tag.toUpperCase()} (${filtered.length} found)`;
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 5. Random Button
    if (randomGameBtn) {
        randomGameBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const pool = gameDatabase.filter(g => !g.__NOTE__);
            const random = pool[Math.floor(Math.random() * pool.length)];
            openGame(random);
        });
    }

    // Chat Button Handler
    const openChatBtn = document.getElementById("open-chat-btn");
    if (openChatBtn) {
        openChatBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (typeof toggleChat === "function") {
                toggleChat();
            }
        });
    }

    // 6. Init
    try {
        const res = await fetch('games.json');
        const rawData = await res.json();
        // Assign a persistent global ID to avoid mismatch after filtering
        gameDatabase = rawData.map((g, i) => ({ ...g, globalId: i }));
        renderGames(gameDatabase);
        generateTags(gameDatabase);
        
        // Hide loading screen
        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) {
            loadingScreen.style.opacity = "0";
            setTimeout(() => {
                loadingScreen.style.display = "none";
            }, 500);
        }
    } catch (err) { 
        console.error(err);
        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) loadingScreen.style.display = "none";
    }

    // 7. Click Listeners (Sidebar & Footer)
    const filterLinks = document.querySelectorAll(".menu-item, .grid-item, .footer-links a[data-filter], .footer-links a[data-tag]");
    
    filterLinks.forEach(item => {
        item.addEventListener("click", (e) => {
            if (item.id === "random-game-btn" || item.id === "random-play-footer") return;
            e.preventDefault();
            
            if (item.classList.contains("menu-item") || item.classList.contains("grid-item")) {
                document.querySelectorAll(".menu-item, .grid-item").forEach(i => i.classList.remove("active"));
                item.classList.add("active");
            }

            const filter = item.dataset.filter || item.dataset.tag;
            if (filter === 'all') {
                renderGames(gameDatabase);
                document.querySelectorAll(".game-section").forEach(s => s.style.display = "block");
                document.getElementById("section-title-trending").innerHTML = 
                    `<i class="fa-solid fa-bolt" style="color:#ff5252"></i> Trending Games`;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (filter) {
                filterByTag(filter);
            }
        });
    });

    const randomFooterBtn = document.getElementById("random-play-footer");
    if (randomFooterBtn) {
        randomFooterBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const pool = gameDatabase.filter(g => !g.__NOTE__);
            if (pool.length > 0) {
                const randomGame = pool[Math.floor(Math.random() * pool.length)];
                openGame(randomGame);
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener("focus", () => {
            if (searchInput.value.trim() === "") {
                showHotSuggestions();
            }
        });

        searchInput.addEventListener("input", (e) => {
            const kw = e.target.value.toLowerCase().trim();
            if (kw === "") {
                showHotSuggestions();
                return;
            }
            const filtered = gameDatabase.filter(g => !g.__NOTE__ && (g.name.toLowerCase().includes(kw) || (g.tags && g.tags.some(t => t.includes(kw)))));
            renderSuggestions(filtered.slice(0, 8));
        });

        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const kw = searchInput.value.trim();
                if (kw !== "") {
                    filterByTag(kw);
                    searchSuggestions.classList.remove("active");
                }
            }
        });

        const searchBtn = document.querySelector(".search-bar button");
        if (searchBtn) {
            searchBtn.addEventListener("click", () => {
                const kw = searchInput.value.trim();
                if (kw !== "") {
                    filterByTag(kw);
                    searchSuggestions.classList.remove("active");
                }
            });
        }

        // Close suggestions when clicking outside
        document.addEventListener("click", (e) => {
            if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
                searchSuggestions.classList.remove("active");
            }
        });
    }

    function showHotSuggestions() {
        const hotGames = gameDatabase.filter(g => !g.__NOTE__ && (g.section === 'hero' || g.badge === 'Hot')).slice(0, 6);
        if (hotGames.length === 0) {
            // Fallback to trending games if no explicit hot games
            renderSuggestions(gameDatabase.filter(g => !g.__NOTE__).slice(0, 6), "🔥 Hot Now");
        } else {
            renderSuggestions(hotGames, "🔥 Hot Now");
        }
    }

    function renderSuggestions(games, title = "Search Results") {
        if (games.length === 0) {
            searchSuggestions.innerHTML = `<div class="suggestion-item">No games found...</div>`;
        } else {
            searchSuggestions.innerHTML = `
                <div class="suggestion-header" style="padding:10px 15px; font-size:12px; color:var(--text-muted); font-weight:800; text-transform:uppercase;">${title}</div>
                ${games.map((g, idx) => `
                    <div class="suggestion-item" data-name="${g.name}" style="display:flex; align-items:center; gap:12px; padding:10px 15px; cursor:pointer; transition:0.2s;">
                        <img src="${g.logo}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">
                        <span style="font-weight:600; font-size:14px;">${g.name}</span>
                    </div>
                `).join('')}
            `;

            searchSuggestions.querySelectorAll(".suggestion-item").forEach(item => {
                item.addEventListener("click", () => {
                    const gameName = item.dataset.name;
                    const game = gameDatabase.find(g => g.name === gameName);
                    if (game) {
                        openGame(game);
                        searchSuggestions.classList.remove("active");
                        searchInput.value = "";
                    }
                });
            });
        }
        searchSuggestions.classList.add("active");
    }
});
