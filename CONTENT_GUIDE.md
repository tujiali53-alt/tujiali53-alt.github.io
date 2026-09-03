# 作品集内容替换指南

## 最简单的替换方式

保持文件名不变，用你的文件直接覆盖对应占位文件。HTML 不需要修改。

| 内容 | 当前占位文件 | 建议比例 |
| --- | --- | --- |
| 封面背景 | `assets/images/背景图.png` | 当前背景图，使用全屏 cover 展示 |
| 头像插画 | `assets/images/肖像图.png` | 当前约 2:3，透明 PNG |
| DOTS 封面 | `assets/images/projects/dots/cover.svg` | 16:10 |
| DOTS 详情图 1 | `assets/images/projects/dots/detail-01.svg` | 16:9 |
| DOTS 详情图 2 | `assets/images/projects/dots/detail-02.svg` | 16:9 |
| DOTS 详情图 3 | `assets/images/projects/dots/detail-03.svg` | 16:9 |
| 视频封面 | `assets/images/projects/dots/video-poster.svg` | 16:9 |
| 正式简历 | `assets/resume/resume.pdf` | PDF |
| DOTS 演示视频 | `assets/videos/dots-demo.mp4` | MP4 / H.264 |
| 首屏背景视频 | `assets/videos/hero-loop.mp4` | 16:9、静音循环 |

SVG 占位图改成 JPG、PNG 或 WebP 时，需要同时修改 HTML 中相应的 `src` 扩展名。推荐项目截图使用 WebP，透明图使用 PNG。

封面背景优先使用横向 WebP 或 JPG；头像优先使用正方形 WebP/JPG。若头像已经抠图且需要透明背景，请使用 PNG 或支持透明通道的 WebP。

## 增加新项目

1. 复制 `project-dots.html`，例如命名为 `project-new-game.html`。
2. 在 `assets/images/projects/` 下新建项目文件夹。
3. 替换详情页中的标题、简介、职责、方案、结果和图片路径。
4. 在 `works.html` 中复制一个 `.project-card`，将链接指向新详情页。

## 替换本地视频

作品页的视频位已接入 Bilibili 按需播放器。每个 `.bilibili-video` 通过 `data-bvid` 指定视频：未悬浮时只显示封面，悬浮时加载静音预览，点击后切换为有声播放并支持全屏。

```html
<div class="works-project-video bilibili-video" data-bvid="BV1iZomBMEGv" data-video-title="DOTS 骨骼动画测试 Demo">
  <div class="bilibili-poster poster-dots">...</div>
  <button class="bilibili-video-trigger" type="button">悬浮预览 · 点击播放</button>
</div>
```

## 启用正式简历下载

把 PDF 放到 `assets/resume/resume.pdf` 后，在 `resume.html` 中将“正式 PDF 待上传”的 `span` 替换为：

```html
<a class="button primary" href="assets/resume/resume.pdf" download>下载正式简历</a>
```

## 使用 Bilibili

在 Bilibili 视频页面获取 `bvid`，将视频区域替换为官方播放器 iframe，并保留外部原始地址按钮。不要直接填写普通分享页 URL 作为 iframe 地址。

## 更新 GitHub Pages

```powershell
git add .
git commit -m "Update portfolio content"
git push origin main
```

注意：GitHub Pages 区分文件名大小写，路径和扩展名必须完全一致。
