# 奖状图片替换说明

当前首页“比赛经历”的所有条目暂时共用 `certificate-placeholder.svg` 占位图。

替换某一条奖状时：

1. 将新的 `.webp`、`.jpg` 或 `.png` 图片放进当前目录，建议使用简短的英文文件名，例如 `south-survey-cup-2025.webp`。
2. 打开项目根目录的 `index.html`，找到对应比赛按钮上的 `data-certificate` 属性。
3. 将属性值改为新图片路径，例如：

   ```html
   data-certificate="assets/images/certificates/south-survey-cup-2025.webp"
   ```

`data-certificate-title` 控制预览下方的说明文字和图片替代文本，也可以按需修改。图片圆角由 `styles.css` 中的 `.certificate-preview img` 统一控制，不需要编辑图片本身。
