// app.js - Hệ thống phân loại Game thông minh và tự động

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Danh sách các "Phễu" hứng game trên màn hình
    const containers = {
        "featured": document.getElementById("hero-grid-container"),
        "trending": document.getElementById("dense-grid-container"),
        "two-player": document.getElementById("two-player-grid-container"),
        "sports": document.getElementById("sports-grid-container")
    };

    try {
        console.log("Đang tải dữ liệu JSON...");
        const response = await fetch('games.json');
        if (!response.ok) throw new Error("Không thấy file games.json");
        const gameDatabase = await response.json();

        // Xóa trắng các container trước khi đổ dữ liệu mới
        Object.values(containers).forEach(c => { if(c) c.innerHTML = ""; });

        gameDatabase.forEach(game => {
            // Bỏ qua phần hướng dẫn (NOTE) ở cuối file
            if (game.__NOTE__) return;

            const { name, logo, iframe, category, section, type, badge } = game;
            const targetContainer = containers[category];

            if (!targetContainer) return;

            let cardHTML = "";

            if (section === "hero") {
                let badgeHTML = badge ? `<span class="badge new">${badge}</span>` : "";
                cardHTML = `
                    <a href="${iframe}" target="_blank" class="game-card ${type || 'hero-card'}" style="background-image: url('${logo}');">
                        <div class="overlay">
                            <div class="play-btn"><i class="fa-solid fa-play"></i></div>
                            <div class="game-info">
                                <h3>${name}</h3>
                                ${badgeHTML}
                            </div>
                        </div>
                    </a>
                `;
            } else {
                cardHTML = `
                     <a href="${iframe}" target="_blank" class="game-card ${type || 'small-square'}" style="background-image: url('${logo}');">
                        <div class="overlay"><div class="play-btn-small"><i class="fa-solid fa-play"></i></div></div>
                        <div class="title-bar">${name}</div>
                    </a>
                `;
            }

            targetContainer.innerHTML += cardHTML;
        });

        console.log("Hệ thống phân loại tự động đã sẵn sàng!");

    } catch (error) {
        console.error("Lỗi:", error);
    }
});
