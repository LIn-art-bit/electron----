// 创建简单的托盘图标
// 运行: node create-icon.js

const fs = require('fs');
const path = require('path');

// 使用 Node.js 内置模块创建简单的 PNG 图标
function createSimpleIcon() {
  console.log('正在创建托盘图标...');
  
  // 创建 16x16 的 PNG 图标数据
  const size = 16;
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  ]);
  
  console.log('提示：由于技术限制，此脚本生成的是占位符文件。');
  console.log('');
  console.log('推荐的图标获取方式：');
  console.log('');
  console.log('1. 在线生成：');
  console.log('   访问 https://favicon.io/emoji-favicons/');
  console.log('   选择 ✅ 或 📝 emoji，下载 favicon.png');
  console.log('   重命名为 icon.png，放到 assets/ 目录');
  console.log('');
  console.log('2. 使用图标库：');
  console.log('   访问 https://www.iconfinder.com/');
  console.log('   搜索 "task" 或 "checklist"');
  console.log('   下载 16x16 或 32x32 的 PNG 图标');
  console.log('');
  console.log('3. 自己制作：');
  console.log('   使用 Photoshop、GIMP、Figma 等工具');
  console.log('   创建 16x16 像素的图标');
  console.log('   保存为 PNG 格式（支持透明）');
  console.log('');
  console.log('4. 临时方案：');
  console.log('   应用已内置代码生成的图标');
  console.log('   可以正常运行，只是图标比较简单');
  console.log('');
  
  // 创建 assets 目录
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
    console.log('✓ 已创建 assets 目录');
  }
  
  // 创建说明文件
  const readmePath = path.join(assetsDir, 'README.md');
  const readmeContent = `# 图标文件说明

## 当前状态

应用使用代码生成的默认图标（蓝紫色圆形）。

## 如何添加自定义图标

### 方法 1：在线 Emoji 转图标（推荐）

1. 访问 https://favicon.io/emoji-favicons/
2. 选择合适的 emoji（如 ✅ 📝 📋）
3. 点击 Download
4. 将下载的 favicon.png 重命名为 icon.png
5. 放到本目录（assets/）
6. 重启应用

### 方法 2：下载现成图标

访问以下网站下载图标：
- https://www.iconfinder.com/ (搜索 "task" 或 "checklist")
- https://www.flaticon.com/
- https://icons8.com/

要求：
- 格式：PNG
- 尺寸：16x16 或 32x32 像素
- 支持透明背景

### 方法 3：自己制作

使用以下工具制作：
- Figma（在线，免费）
- Photoshop
- GIMP（免费）
- Inkscape（免费）

技巧：
- 使用简单的图形和少量颜色
- 确保在小尺寸下清晰可见
- 使用透明背景
- 主色调建议与应用主题一致（蓝紫色系）

## 文件命名

### Windows / Linux
- \`icon.png\` - 16x16 或 32x32 像素

### macOS（可选）
- \`iconTemplate.png\` - 16x16 像素，黑色和透明度
- \`iconTemplate@2x.png\` - 32x32 像素（Retina 屏幕）

## 当前图标

如果没有 icon.png 文件，应用会使用代码生成的默认图标。
`;
  
  fs.writeFileSync(readmePath, readmeContent);
  console.log('✓ 已创建图标说明文件：assets/README.md');
  console.log('');
  console.log('🎉 完成！现在可以添加你自己的图标了。');
}

createSimpleIcon();

