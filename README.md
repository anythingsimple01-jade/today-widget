# Today — 화면 우측 상단 To Do 위젯

서버 없이 동작하는 macOS / Windows 데스크톱 위젯입니다. 데이터는 내 컴퓨터에만 저장됩니다.

## 1. 준비 (한 번만)
1. [Node.js LTS](https://nodejs.org) 설치
2. 이 폴더(`today-widget`)에서 터미널 열기
3. `npm install`

## 2. 바로 실행
```
npm start
```
- 우측 상단에 위젯이 뜨고, 메뉴 막대(Windows는 작업 표시줄 트레이)에 체크리스트 아이콘이 생깁니다.
- 아이콘 메뉴: 화면에 고정 · 히스토리 · 투명도 · 언어 · 로그인 시 실행 · 데이터 폴더 열기 · 종료

## 3. 설치 파일 만들기 (더블클릭으로 쓰고 싶을 때)
```
npm run dist:mac   # Mac에서 → dist/Today-1.0.0.dmg
npm run dist:win   # Windows에서 → dist/Today Setup 1.0.0.exe
```
각 OS 설치 파일은 해당 OS에서 만드는 게 가장 확실합니다.

**Mac 첫 실행 경고**: 서명되지 않은 앱이라 "확인되지 않은 개발자" 경고가 뜹니다. 앱을 우클릭 → 열기, 또는 터미널에서
`xattr -cr /Applications/Today.app`

## 4. 데이터 & 백업
- 저장 위치: 메뉴 → "데이터 폴더 열기"
  - Mac: `~/Library/Application Support/today-widget/data.json`
  - Windows: `%APPDATA%\today-widget\data.json`
- 저장할 때마다 임시 파일에 쓴 뒤 교체(저장 중 꺼져도 안전)
- `backups/` 폴더에 날짜별 스냅샷 최근 30일치 자동 보관
- 자정이 지나면 끝내지 못한 할 일은 자동으로 다음 날로 이월

## 5. GitHub에 올리기
GitHub에서 빈 저장소(예: `today-widget`)를 만든 뒤, 이 폴더에서:
```
git init
git add .
git commit -m "Today widget v1"
git branch -M main
git remote add origin https://github.com/<내아이디>/today-widget.git
git push -u origin main
```
(`node_modules`, `dist`는 .gitignore로 제외됩니다.)
설치 파일을 배포하려면 GitHub 저장소 → Releases → 새 릴리스에 `dist/`의 .dmg / .exe를 첨부하세요.

## 구조
```
main.js          창·트레이·저장·이월 로직
preload.js       화면 ↔ 메인 연결
src/widget.*     위젯
src/history.*    히스토리 창 (캘린더 포함)
src/i18n.js      English / 한국어 / 中文 / Español
assets/          아이콘
```
