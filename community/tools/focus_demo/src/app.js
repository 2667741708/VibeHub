/* =============================================================
   FocusDemo - 缩放演示仪
   app.js — 核心应用逻辑
   
   职责:
   1. 多段视频导入与管理 (Clip Manager)
   2. 交互式焦点缩放引擎 (Zoom Engine)
   3. 时间轴关键帧打点 (Keyframe Timeline)
   4. 死区自动裁剪 (Dead Zone Auto-Trim)
   5. 完整项目导出 (Project Export)
   ============================================================= */

// ===== 全局状态 (Global State) =====
const state = {
    clips: [],           // 视频片段列表 [{id, name, file, url, duration, trimStart, trimEnd}]
    activeClipIndex: -1, // 当前活跃片段索引
    keyframes: [],       // 关键帧 [{id, clipId, time, mode, x, y, scale}]
    isZoomed: false,     // 当前是否处于放大模式
    currentScale: 1,
    currentOriginX: 50,
    currentOriginY: 50,
    deadZoneThreshold: 3, // 死区阈值（秒）：连续静止超过N秒视为可裁剪
};

let clipIdCounter = 0;
let kfIdCounter = 0;

// ===== DOM 引用 =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {};
function initDOM() {
    dom.video = $('#main-video');
    dom.viewport = $('#video-viewport');
    dom.emptyState = $('#empty-state');
    dom.hintToast = $('#hint-toast');
    dom.zoomIndicator = $('#zoom-indicator');
    dom.clipTrack = $('#clip-track');
    dom.kfTrack = $('#kf-track');
    dom.uploadInput = $('#video-upload');
    dom.addClipBtn = $('#btn-add-clip');
    dom.exportBtn = $('#btn-export');
    dom.autoTrimBtn = $('#btn-auto-trim');
    dom.clearKfBtn = $('#btn-clear-kf');
    dom.toast = $('#toast');
}

// ===== 初始化 =====
function init() {
    initDOM();
    bindEvents();
    renderClipTrack();
    renderKeyframeTrack();
}

// ===== 事件绑定 =====
function bindEvents() {
    // 导入视频
    dom.addClipBtn.addEventListener('click', () => dom.uploadInput.click());
    dom.uploadInput.addEventListener('change', handleFileUpload);

    // 视频交互：双击放大/缩小
    dom.video.addEventListener('dblclick', handleVideoDoubleClick);

    // 视频播放：时间轴运镜回放
    dom.video.addEventListener('timeupdate', handleTimeUpdate);

    // 视频元数据加载完成
    dom.video.addEventListener('loadedmetadata', handleVideoLoaded);

    // 导出项目
    dom.exportBtn.addEventListener('click', exportProject);

    // 自动裁剪
    dom.autoTrimBtn.addEventListener('click', autoTrimDeadZones);

    // 清空关键帧
    dom.clearKfBtn.addEventListener('click', clearAllKeyframes);
}

// ===== 1. 多段视频导入 =====
function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
        const id = ++clipIdCounter;
        const url = URL.createObjectURL(file);
        const clip = {
            id,
            name: file.name,
            file,
            url,
            duration: 0,
            trimStart: 0,
            trimEnd: 0, // 0 表示完整长度
        };
        state.clips.push(clip);
    });

    // 如果之前没有活跃片段，激活第一个
    if (state.activeClipIndex === -1) {
        setActiveClip(0);
    }

    renderClipTrack();
    showToast(`已导入 ${files.length} 个视频片段`);

    // 清空 input，使得可以重复导入相同文件
    e.target.value = '';
}

function setActiveClip(index) {
    if (index < 0 || index >= state.clips.length) return;
    state.activeClipIndex = index;
    const clip = state.clips[index];
    
    dom.video.src = clip.url;
    dom.video.currentTime = clip.trimStart || 0;
    dom.emptyState.classList.add('hidden');
    dom.viewport.classList.remove('zoomed');
    state.isZoomed = false;
    resetZoom();
    
    renderClipTrack();
    renderKeyframeTrack();
}

function removeClip(index) {
    const clip = state.clips[index];
    // 清理该片段的关键帧
    state.keyframes = state.keyframes.filter(kf => kf.clipId !== clip.id);
    // 释放 URL
    URL.revokeObjectURL(clip.url);
    state.clips.splice(index, 1);

    if (state.clips.length === 0) {
        state.activeClipIndex = -1;
        dom.video.src = '';
        dom.emptyState.classList.remove('hidden');
    } else if (state.activeClipIndex >= state.clips.length) {
        setActiveClip(state.clips.length - 1);
    } else {
        setActiveClip(Math.min(state.activeClipIndex, state.clips.length - 1));
    }
    
    renderClipTrack();
    renderKeyframeTrack();
    showToast('已移除片段');
}

function handleVideoLoaded() {
    const clip = state.clips[state.activeClipIndex];
    if (clip) {
        clip.duration = dom.video.duration;
        if (!clip.trimEnd) clip.trimEnd = clip.duration;
        renderClipTrack();
    }
}

// ===== 2. 交互式焦点缩放 =====
function handleVideoDoubleClick(e) {
    if (!dom.video.src || state.activeClipIndex === -1) return;

    const rect = dom.video.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    const currentTime = dom.video.currentTime;
    const activeClip = state.clips[state.activeClipIndex];

    if (state.isZoomed) {
        // 缩小回全局
        addKeyframe(activeClip.id, currentTime, 'zoom_out', 50, 50, 1);
        applyZoom(50, 50, 1);
        state.isZoomed = false;
        dom.viewport.classList.remove('zoomed');
    } else {
        // 放大到点击位置
        const scale = 2.2;
        addKeyframe(activeClip.id, currentTime, 'zoom_in', xPercent, yPercent, scale);
        applyZoom(xPercent, yPercent, scale);
        state.isZoomed = true;
        dom.viewport.classList.add('zoomed');
    }

    renderKeyframeTrack();
}

function applyZoom(x, y, scale) {
    dom.video.style.transformOrigin = `${x}% ${y}%`;
    dom.video.style.transform = `scale(${scale})`;
    state.currentScale = scale;
    state.currentOriginX = x;
    state.currentOriginY = y;

    // 更新缩放指示器
    if (scale > 1) {
        dom.zoomIndicator.textContent = `🔍 ${scale.toFixed(1)}x`;
        dom.zoomIndicator.classList.add('visible');
    } else {
        dom.zoomIndicator.classList.remove('visible');
    }
}

function resetZoom() {
    applyZoom(50, 50, 1);
}

// ===== 3. 关键帧系统 =====
function addKeyframe(clipId, time, mode, x, y, scale) {
    const id = ++kfIdCounter;
    state.keyframes.push({ id, clipId, time, mode, x, y, scale });
    // 按片段+时间排序
    state.keyframes.sort((a, b) => {
        if (a.clipId !== b.clipId) {
            const idxA = state.clips.findIndex(c => c.id === a.clipId);
            const idxB = state.clips.findIndex(c => c.id === b.clipId);
            return idxA - idxB;
        }
        return a.time - b.time;
    });
}

function removeKeyframe(kfId) {
    state.keyframes = state.keyframes.filter(kf => kf.id !== kfId);
    renderKeyframeTrack();
}

function clearAllKeyframes() {
    const activeClip = state.clips[state.activeClipIndex];
    if (!activeClip) return;
    state.keyframes = state.keyframes.filter(kf => kf.clipId !== activeClip.id);
    resetZoom();
    state.isZoomed = false;
    dom.viewport.classList.remove('zoomed');
    renderKeyframeTrack();
    showToast('已清除当前片段的所有焦点标记');
}

// ===== 4. 运镜回放引擎 =====
function handleTimeUpdate() {
    const currentTime = dom.video.currentTime;
    const activeClip = state.clips[state.activeClipIndex];
    if (!activeClip) return;

    // 获取当前片段的关键帧
    const clipKfs = state.keyframes.filter(kf => kf.clipId === activeClip.id);
    
    // 自动在裁剪区末尾跳到下一个片段
    if (activeClip.trimEnd && currentTime >= activeClip.trimEnd) {
        playNextClip();
        return;
    }

    // 找到当前时间最近的已过关键帧
    let activeKf = null;
    for (let i = 0; i < clipKfs.length; i++) {
        if (currentTime >= clipKfs[i].time) {
            activeKf = clipKfs[i];
        } else {
            break;
        }
    }

    if (activeKf) {
        applyZoom(activeKf.x, activeKf.y, activeKf.scale);
        state.isZoomed = activeKf.mode === 'zoom_in';
        dom.viewport.classList.toggle('zoomed', state.isZoomed);
    } else {
        // 在第一个关键帧之前，保持原样
        applyZoom(50, 50, 1);
        state.isZoomed = false;
        dom.viewport.classList.remove('zoomed');
    }
}

function playNextClip() {
    const nextIdx = state.activeClipIndex + 1;
    if (nextIdx < state.clips.length) {
        setActiveClip(nextIdx);
        dom.video.play();
    } else {
        dom.video.pause();
        showToast('所有片段播放完毕 ✨');
    }
}

// 连续播放所有片段
function playAll() {
    if (state.clips.length === 0) return;
    setActiveClip(0);
    dom.video.play();
}

// ===== 5. 死区自动裁剪 =====
function autoTrimDeadZones() {
    const activeClip = state.clips[state.activeClipIndex];
    if (!activeClip) {
        showToast('请先导入视频');
        return;
    }

    // 基于关键帧来智能裁剪：
    // 如果两个关键帧之间有大于 deadZoneThreshold 的间隔，
    // 且没有操作（既无 zoom_in 也无 zoom_out），标记为可裁剪区域。
    const clipKfs = state.keyframes.filter(kf => kf.clipId === activeClip.id);
    
    if (clipKfs.length < 2) {
        showToast('需要至少 2 个焦点标记才能分析死区');
        return;
    }

    let trimmedSeconds = 0;
    const deadZones = [];

    // 检查视频开头到第一个关键帧
    if (clipKfs[0].time > state.deadZoneThreshold) {
        deadZones.push({ start: 0, end: clipKfs[0].time - 0.5 });
        trimmedSeconds += clipKfs[0].time - 0.5;
        activeClip.trimStart = clipKfs[0].time - 0.5;
    }

    // 检查关键帧之间的间隔
    for (let i = 0; i < clipKfs.length - 1; i++) {
        const gap = clipKfs[i + 1].time - clipKfs[i].time;
        if (gap > state.deadZoneThreshold * 2) {
            // 在这个大间隔中间裁剪
            const trimAmount = gap - state.deadZoneThreshold;
            deadZones.push({
                start: clipKfs[i].time + 1,
                end: clipKfs[i + 1].time - 1
            });
            trimmedSeconds += trimAmount;
        }
    }

    // 检查最后一个关键帧到视频结尾
    const lastKf = clipKfs[clipKfs.length - 1];
    if (activeClip.duration - lastKf.time > state.deadZoneThreshold) {
        activeClip.trimEnd = lastKf.time + state.deadZoneThreshold;
        trimmedSeconds += activeClip.duration - activeClip.trimEnd;
    }

    renderClipTrack();

    if (trimmedSeconds > 0) {
        showToast(`已标记裁剪约 ${trimmedSeconds.toFixed(1)}s 的死区时间`);
    } else {
        showToast('未发现可优化的死区');
    }
}

// ===== 6. 项目导出 =====
function exportProject() {
    const project = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        clips: state.clips.map(c => ({
            id: c.id,
            name: c.name,
            duration: c.duration,
            trimStart: c.trimStart,
            trimEnd: c.trimEnd,
        })),
        keyframes: state.keyframes.map(kf => ({
            id: kf.id,
            clipId: kf.clipId,
            time: parseFloat(kf.time.toFixed(2)),
            mode: kf.mode,
            x: parseFloat(kf.x.toFixed(1)),
            y: parseFloat(kf.y.toFixed(1)),
            scale: kf.scale,
        })),
        settings: {
            deadZoneThreshold: state.deadZoneThreshold,
        }
    };

    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusdemo_project_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('项目已导出为 JSON ✨ 你可以把它交给 FFmpeg 渲染引擎！');
}

// ===== UI 渲染 =====
function renderClipTrack() {
    if (state.clips.length === 0) {
        dom.clipTrack.innerHTML = '<span class="kf-empty">点击「导入视频」添加录屏片段...</span>';
        return;
    }

    dom.clipTrack.innerHTML = state.clips.map((clip, idx) => {
        const isActive = idx === state.activeClipIndex;
        const durStr = clip.duration ? formatTime(clip.duration) : '加载中...';
        const trimInfo = (clip.trimStart > 0 || (clip.trimEnd && clip.trimEnd < clip.duration))
            ? ` ✂ ${formatTime(clip.trimStart)}-${formatTime(clip.trimEnd)}`
            : '';
        return `
            <div class="clip-item ${isActive ? 'active' : ''} fade-in" onclick="setActiveClip(${idx})">
                <span class="clip-name">📹 ${clip.name}</span>
                <span class="clip-duration">${durStr}${trimInfo}</span>
                <button class="clip-remove" onclick="event.stopPropagation(); removeClip(${idx})">✕</button>
            </div>
        `;
    }).join('');
}

function renderKeyframeTrack() {
    const activeClip = state.clips[state.activeClipIndex];
    if (!activeClip) {
        dom.kfTrack.innerHTML = '<span class="kf-empty">暂无焦点标记。播放视频并双击画面添加。</span>';
        return;
    }

    const clipKfs = state.keyframes.filter(kf => kf.clipId === activeClip.id);
    if (clipKfs.length === 0) {
        dom.kfTrack.innerHTML = '<span class="kf-empty">暂无焦点标记。播放视频并在需要放大的位置双击。</span>';
        return;
    }

    dom.kfTrack.innerHTML = clipKfs.map(kf => {
        const icon = kf.mode === 'zoom_in' ? '🔍' : '🎥';
        const label = kf.mode === 'zoom_in' ? '放大' : '原景';
        return `
            <div class="kf-tag fade-in" onclick="seekToKeyframe(${kf.id})">
                <span class="kf-time">${formatTime(kf.time)}</span>
                <span class="kf-action">${icon} ${label}</span>
                <button class="kf-delete" onclick="event.stopPropagation(); removeKeyframe(${kf.id})">✕</button>
            </div>
        `;
    }).join('');
}

function seekToKeyframe(kfId) {
    const kf = state.keyframes.find(k => k.id === kfId);
    if (!kf) return;
    
    // 先切到对应的片段
    const clipIdx = state.clips.findIndex(c => c.id === kf.clipId);
    if (clipIdx !== state.activeClipIndex) {
        setActiveClip(clipIdx);
    }
    
    dom.video.currentTime = kf.time;
}

// ===== 工具函数 =====
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m}:${String(s).padStart(2, '0')}.${ms}`;
}

function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    setTimeout(() => dom.toast.classList.remove('show'), 2500);
}

// ===== 暴露全局函数 (For inline onclick handlers) =====
window.setActiveClip = setActiveClip;
window.removeClip = removeClip;
window.removeKeyframe = removeKeyframe;
window.seekToKeyframe = seekToKeyframe;
window.playAll = playAll;

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', init);
