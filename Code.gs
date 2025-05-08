function collectCalendarEvents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName("設定");
  const configData = configSheet.getDataRange().getValues();

  const today = new Date();
  const dateStr = Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyyMMdd");

  const sheetNames = ss.getSheets().map(sheet => sheet.getName());
  const regex = new RegExp(`^${dateStr}_(\\d+)$`);
  let maxIndex = 0;
  sheetNames.forEach(name => {
    const match = name.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxIndex) maxIndex = num;
    }
  });

  const newSheetName = `${dateStr}_${maxIndex + 1}`;
  const outputSheet = ss.insertSheet(newSheetName);
  outputSheet.appendRow(["名前", "日付", "時間帯", "工数", "タイトル"]);

  for (let i = 1; i < configData.length; i++) {
    const [name, email, fromDateStr, toDateStr, target, execDate] = configData[i];

    // ✅ 集計対象1かつ実行日が空でない
    if (target !== 1 || !execDate) continue;

    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);
    toDate.setDate(toDate.getDate() + 1);

    const calendar = CalendarApp.getCalendarById(email);
    if (!calendar) {
      Logger.log(`⚠ カレンダーが見つかりません: ${email}`);
      continue;
    }

    const events = calendar.getEvents(fromDate, toDate);

    events.forEach(event => {
      const start = event.getStartTime();
      const end = event.getEndTime();
      const duration = (end - start) / (1000 * 60 * 60); // 時間
      const durationFormatted = formatToHourMinuteLabel(duration); // 時間:分h形式

      outputSheet.appendRow([
        name,
        Utilities.formatDate(start, Session.getScriptTimeZone(), "yyyy/MM/dd"),
        Utilities.formatDate(start, Session.getScriptTimeZone(), "HH:mm") + "〜" +
        Utilities.formatDate(end, Session.getScriptTimeZone(), "HH:mm"),
        durationFormatted, // D列：工数
        event.getTitle()         // E列：タイトル
      ]);
    });

    // ✅ 処理済みとして集計フラグ（target）を0に戻す
    configSheet.getRange(i + 1, 5).setValue(0); // 5列目が target
  }

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast("✅ カレンダーの集計が完了しました！");
}

function formatToHourMinuteLabel(decimalHours) {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}h`;
}

function doGet(e) {
  collectCalendarEvents(); // すでにある関数を呼び出す
  return ContentService.createTextOutput("カレンダー集計が実行されました");
}
