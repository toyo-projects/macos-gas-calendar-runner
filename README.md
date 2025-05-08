# 📅 macOSでGoogleカレンダーの予定を自動で集計する方法（cron & launchd 対応）

このプロジェクトでは、以下のようなことを実現できます。

- ✅ Googleカレンダーの予定を自動で集計
- ✅ 自分のMacで毎日決まった時間に自動で実行
- ✅ ターミナル操作に慣れていない方でもOK

---

## 🔰 この仕組みでできること

たとえば「GAS（Google Apps Script）」を使って作ったカレンダー抽出スクリプトを、  
自分のMacの中で `.sh` ファイルとして保存しておくと、以下のような動きが可能になります：

- 毎日 12:00 にカレンダーを自動集計する
- 結果をスプレッドシートに書き出す
- 実行されたかどうかログファイルで確認できる

---

## ✅ 事前に必要な準備

| 内容 | 詳細 |
|------|------|
| ① Google Apps Script を書いておく | `doGet()` 関数でカレンダー抽出できるWebアプリを用意 |
| ② GASを「ウェブアプリとしてデプロイ」しておく | デプロイ後に表示されるURLをメモ（あとで使います） |
| ③ Macの「ターミナル」を使えるようにしておく | ※詳しく説明しますので安心してください！ |

---

## 📁 プロジェクトの構成

run_scripts/
├── run_gas.sh ← 自動実行されるスクリプト（中身は後述）
├── claunchd_log.txt ← launchd で動いたときの記録ファイル
├── cron_debug.log ← cron で動いたときの記録ファイル

---

## 🛠 ① 自動実行スクリプトの中身（run_gas.shの作成）

以下の内容をコピーして `run_gas.sh` という名前のファイルを作ります：

```bash
#!/bin/bash
PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin"  # 自動実行時のパス対策

# ログの開始時間を記録
echo "[$(date '+%Y-%m-%d %H:%M:%S')] start" >> ~/run_scripts/claunchd_log.txt

# Google Apps Script を呼び出す（URLは自分のものに変えてください）
curl -L "https://script.google.com/macros/s/【ここにGASのURL】/exec" >> ~/run_scripts/claunchd_log.txt 2>&1
✅【ここにGASのURL】には、Google Apps Script のデプロイ管理画面から「ウェブアプリURL」を貼り付けてください。

.shファイル作成後、次のコマンドを実行して「実行可能」にしてください：
chmod +x ~/run_scripts/run_gas.sh

---

⚠️ 実行されなかった場合のよくある原因と解決策
✅ ターミナルの実行許可が必要です！
macOSでは、セキュリティ設定でターミナルに許可を与えないと自動実行されません。

🌱 設定手順（macOS Ventura以降）
システム設定を開く

「プライバシーとセキュリティ」 → 「フルディスクアクセス」

「ターミナル」にチェックを入れる（ロック解除が必要）

※ VS Code や iTerm を使っている人は、そちらもONにしてください。

---

⏱ Option 1：Mac標準の launchd で上記作成の.shを自動実行する方法（推奨）

📄 スケジュール設定ファイルを作る（run_gas.plistの作成）
以下の内容をコピーして run_gas.plist というファイルを作成してください：

<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>run_gas</string>

  <key>ProgramArguments</key>
  <array>
    <string>/Users/ユーザー名/run_scripts/run_gas.sh</string>
  </array>

  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>12</integer>
    <key>Minute</key><integer>0</integer>
  </dict>

  <key>StandardOutPath</key>
  <string>/Users/ユーザー名/run_scripts/claunchd_log.txt</string>
  <key>StandardErrorPath</key>
  <string>/Users/ユーザー名/run_scripts/claunchd_log.txt</string>

  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>

💡 ファイルを設置してターミナルで有効化を実施
mv run_gas.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/run_gas.plist
launchctl start run_gas

---

🔧 launchdの補足（.plist + .shが必要）
※ launchd を使う場合は、2つのファイルが必要です：

.sh（実行処理を書くファイル）
.plist（いつ実行するかを指定する設定ファイル）

これらを組み合わせることで、macOSに「いつ、何を実行するか」を教えることができます。

---

⏰ Option 2：昔ながらの cron で自動実行する方法

📌 設定手順
以下をターミナルで実行
crontab -e

キーボードで i を押して編集モード後に以下を追記します（12:00に毎日実行する場合）：
0 12 * * * /Users/ユーザー名/run_scripts/run_gas.sh >> /Users/ユーザー名/run_scripts/cron_debug.log 2>&1

保存は Esc → :wq → Enter。

---

🔧 cronの補足（.shだけでOK）
※ cron を使う場合は、.sh ファイルのみでOKです。
スケジュールの設定は crontab に直接書くため、.plist ファイルは不要です。

---

🔍 実行ログを確認しよう！
launchdまたはcronが動いたかを確認するには、以下のファイルを見ます：

cat ~/run_scripts/claunchd_log.txt   # launchd の記録
cat ~/run_scripts/cron_debug.log     # cron の記録

---

✅ このプロジェクトで学べること
.sh の作り方と実行権限の付け方

Google Apps Script を curl で実行する方法

launchd や cron を使ったMacのスケジュール自動実行

macOSのセキュリティ設定を超えてスクリプトを動かすコツ

---

👤 作者
toyo
GitHub: toyo-projects

---

このテンプレートは：

✅ スクリプト初心者でも  
✅ 「ターミナルで何するか」がすべて書いてあり  
✅ 「なぜ動かないか？」の対策も網羅

という構成になっています。


