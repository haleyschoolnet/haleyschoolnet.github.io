# 🎮 Hướng Dẫn Quản Trị Hệ Thống Game HaleySchool

Tài liệu này hướng dẫn cách thêm game mới, quản lý chuyên mục và đảm bảo dữ liệu luôn hoạt động chính xác.

---

## 🚀 1. Cách Thêm Game Mới

Để thêm game, bạn chỉ cần chỉnh sửa file `games.json`. Mọi thay đổi trong file này sẽ tự động hiển thị lên trang web.

### Bước 1: Chuẩn bị thông tin

Bạn cần 3 thông tin chính cho mỗi game:

1. **Name**: Tên game hiển thị.
2. **Iframe**: Link web chơi game (thường bắt đầu bằng `http` hoặc `https`).
3. **Logo**: Link ảnh đại diện (nên là ảnh vuông để đẹp nhất).

### Bước 2: Chèn dữ liệu vào `games.json`

Mở file `games.json`, kéo xuống cuối cùng (trước dấu đóng ngoặc vuông `]`). Thêm một dấu phẩy `,` sau game cuối cùng và dán mã mẫu sau:

```json
{
  "name": "Tên Game Của Bạn",
  "logo": "https://link-anh-logo.png",
  "iframe": "https://link-choi-game.html",
  "category": "trending",
  "tags": ["action", "combat", "free"],
  "section": "dense"
}
```

---

## 📂 2. Cấu Hình Vùng Hiển Thị

Bạn có thể quyết định game hiện ở đâu trên trang chủ bằng cách chỉnh sửa 2 thuộc tính:

### `section` (Vị trí hàng dọc)

- `"hero"`: Game sẽ hiện ở **Banner lớn** trượt ở trên cùng trang web (Dành cho game cực hot).
- `"dense"`: Game sẽ hiện ở **Lưới game nhỏ** phía dưới như bình thường.

### `category` (Nhãn phân loại)

- `"featured"`: Nhãn "Galaxy Favorites" (Game nổi bật).
- `"trending"`: Nhãn "Trending Games" (Game xu hướng).
- `"two-player"`: Nhãn "Multiplayer Duel" (Game 2 người).
- `"sports"`: Nhãn "Sports Arena" (Game thể thao).

---

## 🏷️ 3. Hệ Thống Tags & Chuyên Mục Tự Động

Để game của bạn tự động xuất hiện khi người dùng nhấn vào các mục ở **Thanh bên (Sidebar)**, bạn phải gắn đúng từ khóa vào mảng `"tags"`.

| Mục ở Sidebar | Tag cần gắn (Chỉ cần 1 trong các từ này)               |
| :------------ | :----------------------------------------------------- |
| **Action**    | `action`, `combat`, `battle`, `fighter`, `ninja`       |
| **Sports**    | `sports`, `soccer`, `football`, `basketball`, `tennis` |
| **Racing**    | `racing`, `car`, `moto`, `drift`, `stunt`              |
| **Adventure** | `adventure`, `platformer`, `run`, `quest`              |
| **Puzzle**    | `puzzle`, `logic`, `board`, `thinking`                 |
| **Shooting**  | `shooting`, `gun`, `fps`, `sniper`                     |

---

## ⚠️ 4. Lưu Ý Quan Trọng (Cực kỳ lưu ý)

File `games.json` là linh hồn của website. Nếu file này bị lỗi cú pháp, toàn bộ website sẽ không hiển thị danh sách game.

1. **Dấu phẩy (`,`)**: Luôn có dấu phẩy giữa các dấu ngoặc nhọn `{ }`. Tuy nhiên, **game cuối cùng không được có dấu phẩy**.
2. **Dấu ngoặc kép (`" "`)**: Tất cả tên thuộc tính và giá trị chữ đều phải nằm trong dấu ngoặc kép.
3. **Đường dẫn**: Hãy đảm bảo link `iframe` và `logo` hoạt động bình thường.

---

_Chúc bạn quản lý website thật tốt! Nếu có lỗi, hãy kiểm tra lại cú pháp JSON đầu tiên nhé._
