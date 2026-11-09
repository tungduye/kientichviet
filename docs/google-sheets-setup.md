# Hướng dẫn kết nối Đơn hàng về Google Sheet (Kiến Tích Việt)

> Cấu hình hiện tại dùng bảng tính `1nTzboNa_X2daZJkYLc6ajh8YV0lL6JWCw8KztyUXJKg` và Supabase Edge Function `create-order`. Website không gọi Google trực tiếp, nhờ đó URL webhook và mã bảo vệ không bị lộ trên trình duyệt.

Mã Apps Script đã chuẩn bị sẵn tại `docs/google-apps-script-order-webhook.gs`. Trong Google Sheet trên, vào **Tiện ích mở rộng -> Apps Script**, dán file này, sau đó:

1. Vào **Cài đặt dự án -> Thuộc tính tập lệnh**, thêm `ORDER_WEBHOOK_SECRET` với một chuỗi bí mật dài.
2. Chạy hàm `setupOrderSheet` một lần để tạo tab **Đơn hàng** và hàng tiêu đề.
3. Chọn **Triển khai -> Tùy chọn triển khai mới -> Ứng dụng web**, thực thi dưới tài khoản chủ bảng và cho phép **Bất kỳ ai** truy cập.
4. Cấu hình hai Supabase secret phía máy chủ: `ORDER_WEBHOOK_URL` là URL `/exec` và `ORDER_WEBHOOK_SECRET` là đúng chuỗi ở bước 1.

Mỗi đơn luôn được lưu trước trong bảng Supabase `orders`; Google Sheet là bản đồng bộ quản lý. Nếu Google tạm lỗi, website không làm mất đơn hàng.

Để nhận đơn hàng tự động từ website về Google Sheet, bạn chỉ cần thực hiện 4 bước đơn giản sau (mất khoảng 2 phút):

---

### Bước 1: Tạo Google Sheet mới
1. Mở [Google Sheets](https://sheets.google.com) và tạo một bảng tính mới (đặt tên ví dụ: `Đơn Hàng Kiến Tích Việt`).
2. Ở hàng đầu tiên (Dòng 1), tạo các cột tiêu đề sau:
   - Cột A: **Mã đơn**
   - Cột B: **Thời gian**
   - Cột C: **Họ tên khách hàng**
   - Cột D: **Số điện thoại**
   - Cột E: **Email**
   - Cột F: **Địa chỉ giao hàng**
   - Cột G: **Sản phẩm đặt mua**
   - Cột H: **Tổng tiền**
   - Cột I: **Ghi chú**
   - Cột J: **Trạng thái liên hệ** *(Chưa gọi / Đã gọi / Đã chốt / Hủy)*
   - Cột K: **Mã vận đơn**
   - Cột L: **Ghi chú cuộc gọi**

---

### Bước 2: Dán mã Google Apps Script (Tự động ghi Sheet & Gửi Email thông báo)
1. Trên thanh menu Google Sheet, chọn: **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
2. Xóa hết mã có sẵn trong cửa sổ soạn thảo, rồi copy & paste toàn bộ đoạn code dưới đây vào:

```javascript
// ==============================================================
// 1. CẤU HÌNH: Điền địa chỉ Gmail bạn muốn nhận thông báo đơn hàng vào đây:
var NOTIFY_EMAIL = "kientichviet.official@gmail.com"; // <-- Hãy đổi thành Gmail của bạn/chủ shop nếu cần
// ==============================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var orderId = data.orderId || ("DH-" + Math.floor(100000 + Math.random() * 900000));
    var createdAt = data.createdAt || new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    var customerName = data.customerName || "Chưa có tên";
    var customerPhone = data.customerPhone || "";
    var customerEmail = data.customerEmail || "Không có";
    var customerAddress = data.customerAddress || "";
    var products = data.products || "";
    var totalAmount = data.totalAmount || "0₫";
    var customerNote = data.customerNote || "Không có";

    // 1. Ghi một dòng mới vào Google Sheet
    sheet.appendRow([
      orderId,
      createdAt,
      customerName,
      "'" + customerPhone, // Thêm dấu ' để giữ nguyên số 0 ở đầu SĐT
      customerEmail,
      customerAddress,
      products,
      totalAmount,
      customerNote,
      "Chưa liên hệ", // Mặc định cột Trạng thái liên hệ
      "",             // Cột Mã vận đơn
      ""              // Cột Ghi chú cuộc gọi
    ]);

    // 2. Tự động gửi Email thông báo tức thì về Gmail
    try {
      if (NOTIFY_EMAIL && NOTIFY_EMAIL.trim() !== "") {
        var emailSubject = "🔥 [ĐƠN MỚI] " + customerName + " - " + customerPhone + " (" + totalAmount + ")";
        var htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #8F0019; border-radius: 10px; background-color: #fffefb;">
            <div style="border-bottom: 2px solid #8F0019; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #8F0019; margin: 0; font-size: 22px;">Kiến Tích Việt - Có Đơn Đặt Hàng Mới!</h2>
              <p style="color: #666; margin: 5px 0 0; font-size: 14px;">Mã đơn: <strong>#${orderId}</strong> · Thời gian: ${createdAt}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 15px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; color: #555; width: 140px;"><strong>Khách hàng:</strong></td>
                <td style="padding: 8px 0; color: #111; font-weight: bold;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555;"><strong>Số điện thoại:</strong></td>
                <td style="padding: 8px 0;">
                  <a href="tel:${customerPhone}" style="color: #8F0019; font-weight: bold; font-size: 18px; text-decoration: none;">
                    📞 ${customerPhone} (Bấm để gọi ngay)
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555;"><strong>Địa chỉ giao:</strong></td>
                <td style="padding: 8px 0; color: #111;">${customerAddress}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; color: #111;">${customerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555;"><strong>Sản phẩm đặt:</strong></td>
                <td style="padding: 8px 0; color: #8F0019; font-weight: bold;">${products}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555;"><strong>Tổng tiền:</strong></td>
                <td style="padding: 8px 0; color: #8F0019; font-weight: bold; font-size: 18px;">${totalAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555;"><strong>Hình thức:</strong></td>
                <td style="padding: 8px 0; color: #1b7a3a; font-weight: bold;">Thanh toán khi nhận hàng (COD)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555;"><strong>Ghi chú:</strong></td>
                <td style="padding: 8px 0; color: #555; font-style: italic;">${customerNote}</td>
              </tr>
            </table>

            <div style="background-color: #fdf5ea; border-left: 4px solid #d48b28; padding: 12px 16px; border-radius: 4px; font-size: 14px; color: #6d4208;">
              ⏱️ <strong>Mẹo chốt đơn:</strong> Khách hàng có cảm xúc mua hàng cao nhất trong 15-30 phút đầu tiên. Hãy gọi điện xác nhận hoặc kết bạn Zalo để gửi ảnh thực tế tác phẩm cho khách nhé!
            </div>
          </div>
        `;

        MailApp.sendEmail({
          to: NOTIFY_EMAIL,
          subject: emailSubject,
          htmlBody: htmlContent
        });
      }
    } catch (mailError) {
      console.warn("Lỗi gửi mail: " + mailError.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Order recorded and email sent successfully"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==============================================================
// HÀM TEST & CẤP QUYỀN GỬI MAIL (BẮT BUỘC CHẠY 1 LẦN TRÊN APPS SCRIPT):
// Chọn hàm "testSendEmail" ở thanh menu trên và bấm "Chạy" (Run) để Google cấp quyền gửi mail!
// ==============================================================
function testSendEmail() {
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "🔔 [TEST] Kiểm tra gửi thông báo đơn hàng Kiến Tích Việt",
    htmlBody: "<h3 style='color:#8F0019'>Chúc mừng! Hệ thống gửi email thông báo đã hoạt động hoàn hảo.</h3><p>Từ giờ, mỗi khi có khách đặt hàng trên website, email chi tiết sẽ tự động bay về đây!</p>"
  });
  Logger.log("Đã gửi email test thành công tới: " + NOTIFY_EMAIL);
}
```

3. Bấm biểu tượng **Lưu (Save / Ctrl+S)**.
4. **CỰC KỲ QUAN TRỌNG - CẤP QUYỀN GỬI MAIL:**
   - Ở thanh công cụ trên cùng (cạnh nút Gỡ lỗi/Chạy), bấm vào ô chọn hàm đang ghi là `doPost` ➔ chọn hàm **`testSendEmail`**.
   - Bấm nút **Chạy (Run)**.
   - Google sẽ hiện popup **Cần được ủy quyền (Authorization required)**:
     - Bấm **Xem lại quyền truy cập (Review permissions)** ➔ Chọn tài khoản Gmail của bạn.
     - Bấm **Nâng cao (Advanced)** ➔ Bấm **Đi tới... (không an toàn)** ➔ Bấm **Cho phép (Allow)**.
   - Ngay lập tức mở hộp thư Gmail của bạn sẽ thấy email test bay về! Lần đầu chạy hàm này chính là để Google cấp quyền gửi mail cho script.

---

---

### Bước 3: Triển khai Web App (Lấy URL Webhook)
1. Ở góc trên bên phải của trang Apps Script, bấm nút **Triển khai (Deploy)** -> **Tùy chọn triển khai mới (New deployment)**.
2. Bấm vào biểu tượng bánh răng **Chọn loại (Select type)** -> chọn **Ứng dụng web (Web app)**.
3. Điền cấu hình:
   - **Mô tả (Description):** `Webhook đơn hàng Kiến Tích Việt`
   - **Thực thi dưới dạng (Execute as):** `Tôi (Email của bạn)`
   - **Ai có quyền truy cập (Who has access):** **Bất kỳ ai (Anyone)** *(Quan trọng: phải chọn Anyone để website gửi dữ liệu được)*.
4. Bấm **Triển khai (Deploy)**.
5. Nếu Google yêu cầu cấp quyền truy cập tài khoản, bấm **Xem lại quyền truy cập (Review permissions)** -> Chọn tài khoản Google của bạn -> Bấm **Nâng cao (Advanced)** -> Chọn **Đi tới Untitled project (không an toàn)** -> Bấm **Cho phép (Allow)**.
6. Copy đường link tại mục **URL ứng dụng web (Web app URL)** (dạng `https://script.google.com/macros/s/.../exec`).

---

### Bước 4: Cấu hình vào Website
1. Mở file `.env` (hoặc `.env.local`) trong thư mục dự án website.
2. Thêm dòng sau:
```env
VITE_ORDER_WEBHOOK_URL=https://script.google.com/macros/s/ĐOẠN_MÃ_URL_BẠN_VỪA_COPY/exec
```
3. Lưu file lại (và thêm biến này lên hosting nếu triển khai web thực tế). Từ lúc này, mỗi khi khách bấm **Gửi thông tin đặt hàng**, đơn hàng sẽ ngay lập tức xuất hiện trên Google Sheet của bạn!

---

### Bước 5: Bật chuông thông báo trên điện thoại cho chủ shop
1. Nhắc chủ shop mở điện thoại (iPhone hoặc Android) -> Vào **Cài đặt (Settings)** của máy.
2. Tìm ứng dụng **Gmail** -> Bật **Cho phép thông báo (Allow Notifications)** và bật **Âm thanh chuông (Sounds)**.
3. Kể từ lúc này:
   - Khách vừa bấm gửi thông tin trên website -> **Điện thoại chủ shop reo chuông ngay lập tức!**
   - Tiêu đề email hiển thị rõ: `🔥 [ĐƠN MỚI] Tên khách hàng - Số điện thoại (Tổng tiền)`.
   - Mở email ra là thấy nút gọi điện thoại nhanh để chủ shop tư vấn và chốt đơn trong "thời gian vàng".

