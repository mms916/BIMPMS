我需要优化一个任务分解思维导图界面，原界面存在以下问题：

1. 视觉设计单调，缺乏层次感和现代感
2. 节点卡片信息密度高，可读性差
3. 连接线简单，无法清晰展示层级关系
4. 缺少交互反馈，用户体验不佳
5. 状态区分不明显，难以快速识别任务状态

请帮我设计一套完整的优化方案，要求：
- 保留原有功能结构
- 采用横向思维导图布局（从左到右）
- 现代化的视觉设计
- 丰富的交互动画
- 清晰的信息层级
请设计一个三栏布局的思维导图界面：

【左侧边栏 - 280px 宽】
- 顶部：项目列表标题 + 项目总数
- 筛选区：全部类型筛选器（带数量徽章）
- 项目列表：
  * 每个项目卡片包含：图标、名称、进度百分比
  * 底部元信息：任务数量、负责人
  * 当前选中项蓝色高亮（#409eff）
  * 悬停效果：浅灰背景 + 边框

【右侧主区域】
- 顶部工具栏：
  * 左侧：新建任务（主按钮）、展开/折叠、自动布局、筛选、导出
  * 右侧：搜索框（圆角设计，聚焦时扩展宽度）
  
- 画布区域：
  * 网格背景（20px × 20px，浅灰色）
  * 横向思维导图（从左到右展开）
  * 节点按列排列（第0列根节点，第1列主分支，第2/3列子任务）

【固定元素】
- 右下角：控制面板（放大、缩小、适应、重置）
- 左下角：小地图导航
请建立一套完整的色彩系统：

【主色调】
- 品牌蓝：#409eff（主操作、高亮、进行中状态）
- 成功绿：#67c23a（已完成状态）
- 警告橙：#e6a23c（中优先级、进度警告）
- 危险红：#f56c6c（高优先级、逾期状态）

【中性色】
- 主要文字：#303133
- 常规文字：#606266
- 次要文字：#909399
- 边框颜色：#dcdfe6
- 背景颜色：#f5f7fa

【状态色彩语义化】
1. 未开始（Todo）：灰色边框 #dcdfe6，白色背景
2. 进行中（Doing）：蓝色边框 #409eff，蓝色渐变背景（#fff → #f0f7ff）
3. 已完成（Done）：绿色边框 #67c23a，绿色渐变背景（#fff → #f0f9ff）
4. 已逾期（Overdue）：红色边框 #f56c6c，红色渐变背景（#fff → #fef0f0）

【优先级标签】
- P0/高优先级：红色背景 #fef0f0，红色文字 #f56c6c
- P1/中优先级：橙色背景 #fdf6ec，橙色文字 #e6a23c
- P2/低优先级：蓝色背景 #f0f9ff，蓝色文字 #409eff
请设计一个现代化的节点卡片，包含以下元素：

【卡片基础样式】
- 宽度：220px
- 圆角：8px
- 边框：2px solid（根据状态变色）
- 阴影：0 2px 8px rgba(0,0,0,0.08)
- 悬停效果：向右移动 4px + 阴影加深到 0 8px 24px

【卡片内容结构】
┌─────────────────────────────┐
│ 🏗️ 任务名称        [P1]     │ ← 头部：图标 + 标题 + 优先级徽章
│ ─────────────────────────── │ ← 分割线
│ 👤 负责人：李工              │ ← 信息行1：负责人
│ 📅 时间：12-01 ~ 12-08      │ ← 信息行2：时间范围
│ ████████░░ 68%              │ ← 进度条（带流光动画）
└─────────────────────────────┘

【进度条设计】
- 高度：6px
- 背景：#e4e7ed
- 填充：渐变色（根据进度状态）
  * 正常：#409eff → #66b1ff
  * 警告：#e6a23c → #ebb563
  * 完成：#67c23a → #85ce61
  * 危险：#f56c6c → #f78989
- 动画：流光效果（2秒循环）
- 文字：右对齐，12px，灰色
请设计 SVG 贝塞尔曲线连接线系统：

【连接线基础样式】
- 类型：贝塞尔曲线（C 命令）
- 颜色：默认 #c0c4cc，高亮 #409eff
- 线宽：默认 2px，高亮 3px
- 效果：高亮时添加发光（drop-shadow）

【绘制逻辑】
1. 从父节点右侧中心点出发
2. 到达子节点左侧中心点
3. 控制点偏移量 = 水平距离 / 2
4. 路径公式：
   M x1 y1 C (x1+offset) y1, (x2-offset) y2, x2 y2

【交互效果】
- 节点悬停时：
  * 高亮所有相关连接线（父→子、子→父）
  * 线条加粗（2px → 3px）
  * 颜色变化（灰 → 蓝）
  * 添加蓝色发光效果

【代码示例】
```javascript
function drawConnections() {
    const svg = document.getElementById('connectionsSvg');
    svg.innerHTML = '';
    
    nodes.forEach(node => {
        const parentId = node.getAttribute('data-parent');
        if (!parentId) return;
        
        const parent = document.getElementById(parentId);
        const childRect = node.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        const x1 = parentRect.right - canvasRect.left;
        const y1 = parentRect.top + parentRect.height / 2 - canvasRect.top;
        const x2 = childRect.left - canvasRect.left;
        const y2 = childRect.top + childRect.height / 2 - canvasRect.top;
        
        const controlPointOffset = (x2 - x1) / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`;
        
        path.setAttribute('d', d);
        path.setAttribute('class', 'connection-path');
        svg.appendChild(path);
    });
}

---

## 🎮 交互设计提示词

### 提示词 6：动画效果设计

【1. 节点悬停动画】

触发：鼠标悬停在节点卡片上
效果：
向右平移 4px（transform: translateX(4px)）
阴影加深（0 2px 8px → 0 8px 24px）
边框高亮为蓝色
z-index 提升到 100
过渡：0.3s cubic-bezier(0.4, 0, 0.2, 1)
【2. 进度条流光动画
.progress-fill::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(90deg, 
        transparent, 
        rgba(255,255,255,0.3), 
        transparent
    );
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}
【3. 按钮悬停动画】

主按钮（新建任务）：
背景色加深（#409eff → #66b1ff）
向上移动 1px
添加蓝色阴影（0 4px 8px rgba(64,158,255,0.3)）
次要按钮：
背景变浅灰（#f5f7fa）
边框变蓝（#409eff）
文字变蓝
【4. 搜索框聚焦动画】

宽度扩展（200px → 260px）
边框变蓝
添加蓝色光晕（box-shadow: 0 0 0 2px rgba(64,158,255,0.1)）
过渡时间：0.3s
【5. 节点入场动画】@keyframes fadeInRight {
    from {
        opacity: 0;
        transform: translateX(-30px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.node-card {
    animation: fadeInRight 0.5s ease-out;
}

### 提示词 7：搜索功能设计

请实现智能搜索高亮功能：

【功能需求】

实时搜索：输入时立即过滤
匹配高亮：符合条件的节点高亮显示
非匹配淡化：不符合条件的节点半透明
清空恢复：清空搜索框后恢复原状
【交互流程】
用户输入 → 遍历所有节点 → 检查标题是否包含关键词 → 应用样式

【样式变化】
匹配节点：

opacity: 1
transform: scale(1.05)
box-shadow: 0 8px 24px rgba(64, 158, 255, 0.3)
非匹配节点：

opacity: 0.3
transform: scale(1)
box-shadow: 0 2px 8px rgba(0,0,0,0.08)
【代码实现】const searchInput = document.querySelector('.search-input');
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const nodes = document.querySelectorAll('.node-card');
    
    nodes.forEach(node => {
        const title = node.querySelector('.node-title').textContent.toLowerCase();
        
        if (title.includes(searchTerm)) {
            // 匹配：高亮
            node.style.opacity = '1';
            node.style.transform = 'scale(1.05)';
            node.style.boxShadow = '0 8px 24px rgba(64, 158, 255, 0.3)';
        } else if (searchTerm) {
            // 不匹配：淡化
            node.style.opacity = '0.3';
            node.style.transform = 'scale(1)';
            node.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        } else {
            // 清空：恢复
            node.style.opacity = '1';
            node.style.transform = 'scale(1)';
            node.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        }
    });
});

### 提示词 8：缩放控制设计

请实现画布缩放控制功能：

【控制面板位置】

固定定位：右下角，距离边缘 24px
背景：白色，圆角 8px
阴影：0 4px 16px rgba(0,0,0,0.12)
【按钮布局】
垂直排列，4个按钮：
┌────┐
│ ➕ │ 放大
├────┤
│ ➖ │ 缩小
├────┤
│ ⛶  │ 适应画布
├────┤
│ ↻  │ 重置视图
└────┘

【功能实现】const canvas = document.querySelector('.canvas');
let scale = 1;

// 放大
controlBtns[0].addEventListener('click', () => {
    scale = Math.min(scale + 0.1, 2);  // 最大 2 倍
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = 'left center';
    setTimeout(drawConnections, 50);  // 重绘连接线
});

// 缩小
controlBtns[1].addEventListener('click', () => {
    scale = Math.max(scale - 0.1, 0.5);  // 最小 0.5 倍
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = 'left center';
    setTimeout(drawConnections, 50);
});

// 适应画布
controlBtns[2].addEventListener('click', () => {
    scale = 1;
    canvas.style.transform = 'scale(1)';
    setTimeout(drawConnections, 50);
});

// 重置视图
controlBtns[3].addEventListener('click', () => {
    location.reload();
});
【按钮样式】

尺寸：40px × 40px
边框：1px solid #dcdfe6
悬停效果：
背景变蓝（#409eff）
文字变白
放大 1.1 倍
---

## 🏗️ 布局结构提示词

### 提示词 9：节点定位设计

请设计横向思维导图的节点定位方案：

【布局原则】

从左到右展开
根节点在最左侧垂直居中
子节点按层级向右依次排列
同层级节点垂直分布
【具体定位】
第 0 列（根节点）：

left: 100px
top: 50%
transform: translateY(-50%)
第 1 列（3个主分支）：

left: 420px
节点1：top: 80px
节点2：top: 50%, transform: translateY(-50%)
节点3：bottom: 80px
第 2 列（4个二级任务）：

left: 740px
节点1：top: 40px
节点2：top: 200px
节点3：bottom: 200px
节点4：bottom: 40px
第 3 列（2个三级任务）：

left: 1060px
节点1：top: 60px
节点2：bottom: 60px
【画布尺寸】

min-width: 1800px（确保横向空间充足）
min-height: 100%（自适应高度）
padding: 60px（四周留白

### 提示词 10：响应式设计

请实现响应式布局：

【断点设置】

大屏（>1200px）：显示所有元素
中屏（768px-1200px）：隐藏小地图
小屏（<768px）：待优化（移动端适配）
【滚动条优化】.project-list::-webkit-scrollbar,
.canvas-container::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.project-list::-webkit-scrollbar-thumb,
.canvas-container::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
}

.project-list::-webkit-scrollbar-thumb:hover,
.canvas-container::-webkit-scrollbar-thumb:hover {
    background: #c0c4cc;
}
@media (max-width: 1200px) {
    .minimap {
        display: none;
    }
}

---

## 📊 数据结构提示词

### 提示词 11：节点数据结构

<div id="node-1-1" 
     class="node-card status-doing" 
     data-level="1" 
     data-parent="node-root">
    
    <!-- 头部 -->
    <div class="node-header">
        <span class="node-icon">🏗️</span>
        <div class="node-title">场布建模</div>
        <span class="priority-badge priority-medium">P1</span>
    </div>
    
    <!-- 分割线 -->
    <div class="node-divider"></div>
    
    <!-- 信息区 -->
    <div class="node-info">
        <div class="info-row">
            <span class="info-icon">👤</span>
            <span class="info-text">李工</span>
        </div>
        <div class="info-row">
            <span class="info-icon">📅</span>
            <span class="info-text">12-01 ~ 12-08</span>
        </div>
    </div>
    
    <!-- 进度条 -->
    <div class="progress-container">
        <div class="progress-bar">
            <div class="progress-fill" style="width: 68%;"></div>
        </div>
        <div class="progress-text">68%</div>
    </div>
</div>
关键属性说明】

id：唯一标识符（格式：node-层级-序号）
class：
node-card：基础样式
status-{状态}：状态样式（todo/doing/done/overdue）
data-level：层级（0/1/2/3）
data-parent：父节点 ID（用于绘制连接线）
【状态枚举】

todo：未开始
doing：进行中
done：已完成
overdue：已逾期
### 提示词 12：项目列表数据

请定义项目列表的数据结构：

【单个项目结构】<div class="project-item active">
    <div class="project-item-header">
        <span class="project-icon">📋</span>
        <span class="project-name">GTB-03</span>
        <span class="project-progress">48%</span>
    </div>
    <div class="project-item-footer">
        <div class="project-meta">
            <span class="project-meta-icon">📝</span>
            <span>10个任务</span>
        </div>
        <div class="project-meta">
            <span class="project-meta-icon">👤</span>
            <span>未分配</span>
        </div>
    </div>
</div>
【进度颜色规则】

0%：灰色 #909399
1%-49%：橙色 #e6a23c
50%-99%：橙色 #e6a23c
100%：绿色 #67c23a
【交互状态】

默认：白色背景
悬停：浅灰背景 #f5f7fa + 边框 #e4e7ed
激活：蓝色背景 #e6f2ff + 蓝色边框 #409eff【进度颜色规则】

0%：灰色 #909399
1%-49%：橙色 #e6a23c
50%-99%：橙色 #e6a23c
100%：绿色 #67c23a
【交互状态】

默认：白色背景
悬停：浅灰背景 #f5f7fa + 边框 #e4e7ed
激活：蓝色背景 #e6f2ff + 蓝色边框 #409eff