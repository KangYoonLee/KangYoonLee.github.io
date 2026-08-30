# Kangyoon (Kay) Lee — Academic Homepage

Johns Hopkins University Computer Science Ph.D. student를 위한 단일 페이지 학술 홈페이지입니다. 이 프로젝트는 React + Vite 기반으로 작성되었으며, GitHub Pages에 배포할 수 있도록 구성되어 있습니다.

## 현재 포함된 내용

홈페이지에는 Introduction, Research Experience, Publications, CV 다운로드, GitHub·LinkedIn·Email 링크, daytime/night mode 전환이 포함되어 있습니다. Undergraduate thesis와 주소 정보는 포함하지 않았습니다.

프로필 사진과 CV는 이미 프로젝트에 포함되어 있습니다. 기관 로고는 현재 텍스트형 임시 표시이며, 아래의 방법으로 JPG 파일을 추가해 교체할 수 있습니다.

## 로컬 실행

먼저 Node.js 20 이상과 pnpm을 설치한 뒤 다음 명령을 실행합니다.

```bash
pnpm install
pnpm dev
```

브라우저에서 터미널에 표시되는 로컬 주소를 열면 됩니다. 타입 검사와 프로덕션 빌드는 다음 명령으로 확인할 수 있습니다.

```bash
pnpm check
pnpm build
```

## GitHub Pages 배포

### 가장 간단한 방법: GitHub Actions 사용

1. `KangYoonLee.github.io` 저장소를 엽니다.
2. 이 ZIP 파일의 압축을 저장소 루트에 풉니다. `package.json`, `client/`, `server/`, `vite.config.ts`가 저장소 루트에 있어야 합니다.
3. GitHub 저장소의 **Settings → Pages**로 이동합니다.
4. **Build and deployment → Source**에서 **GitHub Actions**를 선택합니다.
5. 아래의 GitHub Actions 파일을 저장소에 추가합니다.

`.github/workflows/deploy.yml` 파일을 만들고 다음 내용을 넣으세요.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Enable pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist/public

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

6. 파일을 `main` 브랜치에 push하면 Actions가 실행됩니다.
7. 배포가 끝나면 `https://kangyoonlee.github.io/`에서 홈페이지를 확인합니다.

> 참고: 이 프로젝트의 `pnpm build`는 Vite 결과물을 `dist/public`에 생성합니다. GitHub Pages에는 이 `dist/public` 폴더를 업로드해야 합니다.

## 기관 JPG 로고 추가 방법

필요한 파일은 다음 세 개입니다.

| 기관 | 권장 파일명 | 적용 대상 |
|---|---|---|
| KIST | `kist.jpg` | Korea Institute of Science and Technology |
| Hansung University | `hansung.jpg` | Hansung University · AI Education Institute |
| HUFS | `hufs.jpg` | 세 개의 HUFS Research Experience 항목 |

### 로고 파일 추가 절차

1. `client/src/` 아래에 `assets` 폴더를 만듭니다.
2. 세 JPG 파일을 `client/src/assets/kist.jpg`, `client/src/assets/hansung.jpg`, `client/src/assets/hufs.jpg`로 넣습니다.
3. `client/src/pages/Home.tsx` 상단 import 영역에 아래 코드를 추가합니다.

```tsx
import kistLogo from "../assets/kist.jpg";
import hansungLogo from "../assets/hansung.jpg";
import hufsLogo from "../assets/hufs.jpg";
```

4. `experiences` 배열의 각 항목에 `logoImage`를 추가합니다.

```tsx
{
  logo: "KIST",
  logoImage: kistLogo,
  // 나머지 내용...
}
```

Hansung 항목은 `hansungLogo`, HUFS 항목은 `hufsLogo`를 사용합니다.

5. 현재 JSX의 다음 부분을 찾아 교체합니다.

```tsx
<div className={`institution-logo ${experience.tone}`}>{experience.logo}</div>
```

다음 코드로 바꿉니다.

```tsx
<div className={`institution-logo ${experience.tone}`}>
  {experience.logoImage ? (
    <img src={experience.logoImage} alt={`${experience.institution} logo`} />
  ) : (
    experience.logo
  )}
</div>
```

6. `client/src/index.css`에 다음 스타일을 추가합니다.

```css
.institution-logo:has(img) {
  padding: 0.35rem;
  background: #ffffff;
}

.institution-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

JPG에 흰색 배경이 포함되어 있어도 사용할 수 있도록 `object-fit: contain`으로 설정했습니다. 로고가 너무 작거나 여백이 많으면 원본 JPG를 적당히 crop한 뒤 다시 넣으면 됩니다.

> 더 간단한 방법은 JPG 파일을 먼저 보내고, 제가 `Home.tsx`와 `index.css`를 대신 연결하는 것입니다. 현재 사이트 구조는 기관별 파일 연결을 쉽게 추가할 수 있게 준비되어 있습니다.

## 연구 내용과 Publications 수정 방법

연구 경험은 `client/src/pages/Home.tsx`의 `experiences` 배열에서 수정합니다. 각 항목은 기관명, 역할, 제목, 기간, 짧은 설명으로 구성되어 있습니다.

```tsx
{
  institution: "Korea Institute of Science and Technology",
  role: "Research Intern · AI & Robotics Institute",
  title: "Project title",
  period: "Mar. 2025 — May. 2026",
  detail: "One or two concise sentences.",
}
```

출판물은 같은 파일의 `publications` 배열에서 수정합니다. `year`, `venue`, `title`, `authors`를 업데이트하면 됩니다. 논문 PDF나 DOI 링크를 추가하려면 항목에 `link`를 넣고, JSX에 다음 링크를 추가하면 됩니다.

```tsx
{publication.link && (
  <a href={publication.link} target="_blank" rel="noreferrer">View paper ↗</a>
)}
```

새 연구 경험이나 출판물을 추가할 때는 설명을 짧게 유지하는 것이 현재 디자인과 가장 잘 맞습니다.

## Introduction 수정 방법

Introduction 본문은 `Home.tsx`의 두 개 `.bio` 문단에서 수정합니다. 제목은 다음 JSX입니다.

```tsx
<h1>Kangyoon (Kay) Lee</h1>
```

GitHub, LinkedIn, Email 링크는 같은 파일의 `.social-links` 영역에 있습니다.

## CV 교체 방법

새 CV PDF를 `client/public/`에 `Kangyoon-Lee-CV.pdf`라는 이름으로 넣고, `Home.tsx` 상단의 경로를 다음처럼 바꾸면 됩니다.

```tsx
const cvFile = "/Kangyoon-Lee-CV.pdf";
```

현재 ZIP에는 `client/public/assets/Kangyoon-Lee-CV.pdf`가 포함되어 있고, 홈페이지는 `/assets/Kangyoon-Lee-CV.pdf`를 사용합니다. 새 CV로 교체할 때는 같은 파일명을 유지한 채 덮어쓰는 방식이 가장 단순합니다.

## 공개 저장소와 Private 저장소

**다른 사람이 홈페이지를 보지 못하게 하려면 저장소를 Private으로 바꾸는 것만으로는 충분하지 않습니다.** GitHub Pages는 웹사이트를 배포하는 기능이므로, 배포 URL을 아는 사람은 사이트 내용을 볼 수 있습니다. 저장소를 Private으로 바꾸면 GitHub 소스 코드는 제한할 수 있지만, 공개 Pages URL 자체가 자동으로 비공개 웹사이트가 되지는 않습니다.

따라서 개인 학술 홈페이지를 공개하려는 목적이라면 `KangYoonLee.github.io` 저장소를 Public으로 유지하는 것이 가장 간단합니다. 반대로 소스와 웹사이트를 모두 비공개로 유지하려면 GitHub Pages 대신 로그인·접근제어를 지원하는 호스팅을 사용해야 합니다. Private 저장소에서 Pages를 사용할 수 있는지는 계정 유형과 GitHub 플랜에 따라 달라질 수 있으므로, Private으로 바꾸기 전에 저장소의 **Settings → Pages** 화면에서 가능 여부를 확인하세요. 현재 홈페이지에는 street address나 개인 주소를 넣지 않았습니다.

## 디자인 색상

Day mode는 검정 텍스트와 `#0000ff` 강조색을 사용합니다. Night mode는 `#353535` 배경과 `#ffb000` 강조색을 사용합니다. 색상을 변경하려면 `client/src/index.css`의 `:root`와 `.dark` CSS 변수를 수정하세요. 이 ZIP의 프로필 사진과 CV는 `client/public/assets/`에 포함되어 있으므로 GitHub Pages 배포 후에도 별도의 외부 저장소 없이 작동합니다.

## 파일 구조

```text
client/
  index.html
  src/
    pages/Home.tsx       # 홈페이지 콘텐츠와 구조
    index.css            # 전체 색상과 반응형 디자인
    main.tsx
server/
  index.ts               # 정적 서버 호환 파일
package.json
pnpm-lock.yaml
vite.config.ts
README.md
```

## License

개인 홈페이지용으로 제공되는 소스입니다. 포함된 사용자 사진과 CV는 Kangyoon Lee의 개인 자산이므로 별도의 허가 없이 재사용하지 마세요.
