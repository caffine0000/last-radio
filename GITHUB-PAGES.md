# GitHub Pages 배포

게임 파일을 수정하고 main에 커밋하면 자동으로 검사 후 dist를 GitHub Pages에 배포합니다.
비밀 토큰이나 API 키를 코드에 넣을 필요가 없습니다. GitHub Actions의 기본 GITHUB_TOKEN과 OIDC 권한을 사용합니다.

## 처음 한 번 설정

1. GitHub에서 `last-radio` 이름으로 **공개 저장소**를 만드세요. 다른 이름도 사용할 수 있습니다.
2. 이 프로젝트의 **내용 전체**를 저장소 루트에 업로드하세요. `dist`의 내용만 올리거나, `last-radio` 폴더를 한 겹 더 넣으면 안 됩니다.
3. 다음 경로가 저장소에서 보이는지 확인하세요. 특히 숨김 폴더 `.github`를 빠뜨리지 마세요.

   ```text
   .github/workflows/pages.yml
   scripts/check-pages.mjs
   dist/index.html
   dist/app.js
   dist/engine.js
   dist/events.js
   dist/style.css
   tests/engine.test.js
   package.json
   ```

4. 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정하세요.
5. **Actions → Deploy 종말 라디오 to GitHub Pages → Run workflow**를 선택해 main에서 실행하세요. Pages 설정 이전의 첫 자동 실행이 실패했어도 다시 실행하면 됩니다.
6. verify와 deploy가 모두 성공하면 Actions 실행 화면의 github-pages 주소로 접속하세요.

계정이 `caffine0000`, 저장소가 `last-radio`인 경우 예상 주소는 `https://caffine0000.github.io/last-radio/`입니다. 실제 배포 성공 여부와 주소는 Actions 결과로 확인해야 합니다.
GitHub Free에서는 공개 저장소에 Pages를 사용할 수 있습니다. 비공개 저장소는 지원되는 유료 요금제가 필요합니다. 기존 비공개 저장소의 공개 여부는 자동으로 변경하지 않습니다.

## Git으로 업로드하는 경우

Git이 설치된 컴퓨터에서 프로젝트 폴더를 열고 실행하세요. 아래 URL은 새로 만든 저장소의 실제 URL로 바꾸세요.

```bash
git init -b main
git add .
git commit -m "Create 종말 라디오 with GitHub Pages deployment"
git remote add origin https://github.com/caffine0000/last-radio.git
git push -u origin main
```

위 명령은 새 빈 저장소용입니다. README 등을 이미 만든 저장소에는 먼저 clone하고 이 프로젝트 내용을 복사한 뒤 커밋·push하세요. force push는 필요 없습니다.

## 이후 업데이트

`dist/events.js`를 수정해서 main에 커밋하면 자동 재배포됩니다. 저장소 이름이 바뀌어도 상대 경로를 사용하므로 게임을 그대로 올릴 수 있습니다.
반드시 워크플로와 같은 커밋의 dist가 배포됩니다. 테스트 실패 시 새 버전은 배포되지 않습니다.

## 저장 주의

진행 저장은 각 방문자의 브라우저에만 남습니다. 같은 github.io 도메인의 다른 저장소와는 URL 경로로 저장 키를 구분합니다. 기존 주소에서 새 주소로 옮기면 진행 저장을 자동 이전하지 않습니다.
이벤트나 수집품 정의를 변경하면 새 진행으로 시작하는 기존 규칙을 유지합니다.

공식 문서: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
