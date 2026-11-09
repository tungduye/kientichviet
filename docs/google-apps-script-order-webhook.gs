const SPREADSHEET_ID = "1nTzboNa_X2daZJkYLc6ajh8YV0lL6JWCw8KztyUXJKg";
const SHEET_NAME = "Đơn hàng";
const HEADERS = [
  "Mã đơn",
  "Thời gian",
  "Họ tên khách hàng",
  "Số điện thoại",
  "Email",
  "Địa chỉ giao hàng",
  "Sản phẩm đặt mua",
  "Tổng tiền",
  "Ghi chú",
  "Trạng thái liên hệ",
  "Mã vận đơn",
  "Ghi chú cuộc gọi",
];

function getOrderSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function setupOrderSheet() {
  getOrderSheet_();
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const expectedToken = PropertiesService.getScriptProperties()
      .getProperty("ORDER_WEBHOOK_SECRET");

    if (!expectedToken || data.webhookToken !== expectedToken) {
      return json_({ status: "error", message: "Unauthorized" });
    }

    const orderId = String(data.orderId || "").trim();
    if (!/^DH-[0-9]{8}-[0-9]{6}$/.test(orderId)) {
      return json_({ status: "error", message: "Invalid order id" });
    }

    const sheet = getOrderSheet_();
    if (sheet.getLastRow() > 1) {
      const existing = sheet
        .getRange(2, 1, sheet.getLastRow() - 1, 1)
        .createTextFinder(orderId)
        .matchEntireCell(true)
        .findNext();
      if (existing) return json_({ status: "success", duplicate: true });
    }

    sheet.appendRow([
      orderId,
      String(data.createdAt || ""),
      String(data.customerName || ""),
      "'" + String(data.customerPhone || ""),
      String(data.customerEmail || "Chưa cung cấp"),
      String(data.customerAddress || ""),
      String(data.products || ""),
      String(data.totalAmount || ""),
      String(data.customerNote || "Không có"),
      "Chưa liên hệ",
      "",
      "",
    ]);

    return json_({ status: "success", row: sheet.getLastRow() });
  } catch (error) {
    return json_({ status: "error", message: String(error) });
  } finally {
    lock.releaseLock();
  }
}
