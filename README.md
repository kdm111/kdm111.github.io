# 박준수 · Robotics Portfolio

LARO-BOT과 VicPinky Carrier의 개발 과정을 담은 정적 포트폴리오입니다.

- 22개 본문 섹션, PC·모바일 반응형 레이아웃
- MP4 시연 영상 25개와 영상 모음 페이지
- 최종 포트폴리오 PDF 다운로드
- 별도 빌드·서버·DB·패키지 설치 없이 GitHub Pages에서 동작

## 파일

| 파일 | 용도 |
| --- | --- |
| `index.html` | 포트폴리오 본문 |
| `videos.html` | 영상 모음·필터 |
| `styles.css` | PC·모바일 스타일 |
| `script.js` | 영상 재생·목차·이미지 확대 |
| `media-manifest.json` | 영상별 페이지·내용·환경·재생 시간 |
| `assets/videos/` | MP4 시연 |
| `assets/posters/` | 영상 썸네일 |
| `assets/images/` | 사진·다이어그램·아이콘 |
| `assets/documents/park-junsu-portfolio.pdf` | 2026-09-10 최종 PDF |
| `.nojekyll` | 정적 파일 게시 설정 |

실물 영상과 시뮬레이션, 로봇 상태를 모사한 관제 시연은 영상 캡션에서 구분합니다. 자동 재생 없이 사용자가 재생 버튼을 누르면 영상을 로드합니다.

## GitHub Pages

이 저장소의 현재 브랜치는 `master`입니다.

1. 변경 사항을 커밋하고 `origin/master`에 푸시합니다.
2. GitHub 저장소 **Settings → Pages**로 이동합니다.
3. Source는 **Deploy from a branch**, Branch는 **master**, Folder는 **/(root)**로 설정합니다.
4. Save 후 Pages 배포 완료를 확인합니다.

게시 주소: `https://kdm111.github.io/`

이 문서를 작성한 시점에는 커밋·푸시·배포를 수행하지 않았습니다. 배포 설정이 이미 되어 있다면 현재 설정을 확인하고 필요한 경우에만 변경하세요.

```bash
git status --short
git add index.html videos.html styles.css script.js favicon.svg media-manifest.json assets .nojekyll .gitignore README.md
git diff --cached --stat
git commit -m "Update robotics portfolio to final version"
git push origin master
```

위 명령은 이 저장소 폴더 안에서 실행하세요. 상위 프로젝트 전체를 GitHub Pages 저장소에 올리지 마세요.

## 수정·확인

문구는 `index.html`, 영상 목록은 `videos.html` 및 `media-manifest.json`에서 수정할 수 있습니다. MP4를 바꾸면 파일명·썸네일·본문과 영상 모음의 경로를 함께 확인하세요.

동영상은 `<video controls playsinline>`으로 재생합니다. CSS의 `object-fit: contain`으로 영상 내부 자막과 화면을 자르지 않습니다. JavaScript를 끄더라도 본문과 기본 영상 컨트롤은 표시됩니다.

현재 HTML은 기존 React 앱의 `/static/js/`를 사용하지 않습니다. 이전 사이트의 `static/`, `asset-manifest.json`, `manifest.json`, 기본 로고는 복구를 위해 그대로 두었으며 새 사이트에서는 참조하지 않습니다. 삭제는 필수가 아닙니다.

이력서·자기소개서·개발 환경 설정·로컬 검토 기록은 이번 사이트에 추가하지 않았습니다.
