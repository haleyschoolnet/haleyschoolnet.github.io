# Chat System Documentation

## Cấu trúc thư mục

- `1.html` - Trang danh sách chat rooms
- `2.html` - Trang chat room chi tiết
- `firebase-config.js` - Cấu hình Firebase
- `notification.js` - Notification popup với chat iframe

## Yêu cầu

1. **Web Server**: Các file này sử dụng ES6 modules, cần chạy từ web server (không thể mở trực tiếp file://)
   - Sử dụng local server như: `python -m http.server 8000` hoặc `npx serve`
   - Hoặc deploy lên GitHub Pages

2. **Firebase Configuration**: 
   - File `firebase-config.js` đã được cấu hình với Firebase project
   - Đảm bảo Firebase Realtime Database đã được tạo và có quyền read/write

## Cách sử dụng

1. Mở `1.html` để xem danh sách chat rooms
2. Click vào một room để vào `2.html` với room ID tương ứng
3. Notification popup sẽ tự động hiển thị sau 2 giây (nếu chưa bị dismiss)

## Lưu ý

- Chat iframe trong notification.js sẽ load sau 5 giây để tối ưu performance
- Nếu gặp lỗi "Database not initialized", kiểm tra:
  - Firebase config có đúng không
  - Có chạy từ web server không (không phải file://)
  - Console có lỗi gì không

## Sửa lỗi

Nếu chat không chạy:
1. Mở Developer Console (F12) để xem lỗi
2. Kiểm tra Firebase config trong `firebase-config.js`
3. Đảm bảo đang chạy từ web server, không phải mở trực tiếp file

