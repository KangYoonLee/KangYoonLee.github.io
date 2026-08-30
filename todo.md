# Redesign TODO

- [ ] 새 참고 사이트 세 곳의 실제 레이아웃과 하단 CV 처리 확인
- [ ] 사용자에게 고해상도 프로필 사진과 CV PDF 또는 CV URL 요청
- [ ] 왼쪽 고정 column, decorative Profile frame, oversized hero art 제거
- [ ] 참고 이미지처럼 단일 중앙 열의 밝은 학술 레이아웃 구현
- [ ] Introduction 제목을 “Hi, I’m Kangyoon (Kay) Lee.”로 변경
- [ ] Research Experience를 로고/기관/짧은 설명이 있는 작은 단일 박스 레코드로 압축
- [ ] Publications에서 Undergraduate Thesis와 보조 설명 문구 제거
- [ ] GitHub, LinkedIn, 이메일 링크를 제공된 URL로 연결
- [ ] daytime/night mode 토글 추가 및 접근성 확인
- [ ] 하단 CV 다운로드 버튼 추가; 실제 파일 또는 URL 수신 후 연결
- [ ] address 및 street address 정보가 렌더링되지 않는지 확인
- [ ] 데스크톱·모바일·다크모드 타입 검사와 시각 검증
- [ ] 최종 체크포인트 저장

## 사용자에게 요청할 자료

- [ ] 고해상도 프로필 사진 파일 (권장: 정방형 또는 세로형 JPG/PNG)
- [ ] CV PDF 파일 또는 CV 다운로드가 가능한 정확한 URL
- [ ] 선택 사항: Google Scholar, personal GitHub repo, 연구 경험별 공식 로고 파일/URL
- [ ] 확인 사항: 메일 주소는 사용자가 제공한 `klee320@jh.edu`가 정확한지 확인

## 링크 기준

- GitHub: https://github.com/KangYoonLee
- LinkedIn: https://www.linkedin.com/in/kangyoon-lee-a5141427a/
- Email: mailto:klee320@jh.edu
- Reference: https://serendy620.github.io/
- Reference: https://llong-cs.github.io/
- CV footer reference: https://kangyoonlee.github.io/

## Style decision

이번 수정에서는 Causal Cartography의 장식적 요소를 최소화하고, 사용자가 제공한 참고 이미지의 단정한 al-folio형 단일 열 정보 구조를 우선한다.

## 추가 수정 요청

- [ ] Introduction 제목을 `Kangyoon (Kay) Lee`로 변경
- [ ] 상단 PH.D. Student · Computer Science · Johns Hopkins University 문구 제거
- [ ] Research Topic pill 버튼 전부 제거
- [ ] 전체 기본 텍스트 색상을 검정 베이스로 조정
- [ ] Research / Research output 왼쪽 라벨 제거 및 섹션 제목 왼쪽 정렬
- [ ] 상단 Research 내비게이션을 `Research Experience`로 변경
- [ ] 기존 보라색 강조색을 `#0000ff`로 통일
- [ ] 기관 JPG 로고를 업로드 가능한 이미지 자산으로 교체
- [ ] JPG 로고 업로드 후 크롭 없이 작은 정사각형 또는 원본 비율로 표시
- [ ] 데스크톱·모바일 화면과 테마 전환 재검증
- [ ] 수정 후 체크포인트 저장

## 프로필 영역 미세 조정

- [ ] Github·LinkedIn·Email 버튼을 사진 바로 아래로 이동
- [ ] Introduction 이름을 볼드체로 강조
- [ ] 데스크톱·모바일 프로필 영역 검증
- [ ] 수정 체크포인트 저장

## GitHub Pages 배포 패키지

- [ ] 다크모드 기본 배경을 `#353535`로 변경
- [ ] 다크모드의 기존 `#0000ff` 강조색을 `#ffb000`으로 변경
- [ ] JPG 로고 업로드·파일명 규칙·콘텐츠 수정 방법을 README에 기록
- [ ] CV와 프로필 이미지가 패키지 내에서 배포에 포함되는지 확인
- [ ] GitHub Pages용 build/deploy 방법을 README에 기록
- [ ] 공개 저장소와 GitHub Pages의 관계 및 private 저장소 조건을 README에 설명
- [ ] 전체 프로젝트를 ZIP으로 압축
- [ ] ZIP 압축 해제·빌드 검증
