// 获取DOM元素
const imageUpload = document.getElementById('imageUpload');
const qrcodeUpload = document.getElementById('qrcodeUpload');
const imageUploadBox = document.getElementById('imageUploadBox');
const qrcodeUploadBox = document.getElementById('qrcodeUploadBox');
const editorContainer = document.getElementById('editorContainer');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const sizeSlider = document.getElementById('sizeSlider');
const opacitySlider = document.getElementById('opacitySlider');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// 存储图像数据
let backgroundImage = null;
let qrcodeImage = null;
let qrcodePosition = { x: 0, y: 0 };
let qrcodeSize = 150;
let qrcodeOpacity = 1;
let isDragging = false;
let dragStartPosition = { x: 0, y: 0 };
let canvasScale = 1;

// 检测是否是移动设备
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// 图片上传处理函数
function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.match('image.*')) {
        alert('请上传图片文件！');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            if (type === 'background') {
                backgroundImage = img;
                displayPreviewImage(imageUploadBox, img);
            } else {
                qrcodeImage = img;
                displayPreviewImage(qrcodeUploadBox, img);
            }
            checkAndDrawCanvas();
        };
        img.onerror = function() {
            alert('图片加载失败，请尝试其他图片');
        };
        img.src = e.target.result;
    };
    reader.onerror = function() {
        alert('文件读取失败，请重试');
    };
    reader.readAsDataURL(file);
}

// 在上传框中显示预览图片
function displayPreviewImage(container, img) {
    // 移除之前的预览图片
    const existingPreview = container.querySelector('img');
    if (existingPreview) {
        container.removeChild(existingPreview);
    }
    
    // 创建新的预览图片
    const preview = document.createElement('img');
    preview.src = img.src;
    container.appendChild(preview);
}

// 检查并绘制画布
function checkAndDrawCanvas() {
    if (backgroundImage && qrcodeImage) {
        // 如果两张图片都已上传，则显示编辑区域
        editorContainer.style.display = 'block';
        
        // 计算画布尺寸
        const maxWidth = Math.min(backgroundImage.width, window.innerWidth * 0.9);
        canvasScale = maxWidth / backgroundImage.width;
        
        // 初始化二维码位置（居中）
        if (qrcodePosition.x === 0 && qrcodePosition.y === 0) {
            qrcodePosition.x = backgroundImage.width / 2 - qrcodeSize / 2;
            qrcodePosition.y = backgroundImage.height / 2 - qrcodeSize / 2;
        }
        
        // 滚动到编辑区域
        setTimeout(() => {
            editorContainer.scrollIntoView({ behavior: 'smooth' });
        }, 300);
        
        drawCanvas();
    }
}

// 绘制画布
function drawCanvas() {
    // 设置画布大小与背景图片一致
    canvas.width = backgroundImage.width;
    canvas.height = backgroundImage.height;
    
    // 缩放画布显示（但保持原始像素尺寸用于下载）
    canvas.style.maxWidth = '100%';
    if (isMobile && backgroundImage.width > window.innerWidth) {
        canvas.style.width = '100%';
    }
    
    // 绘制背景图片
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    
    // 绘制二维码
    ctx.globalAlpha = qrcodeOpacity;
    ctx.drawImage(
        qrcodeImage, 
        qrcodePosition.x, 
        qrcodePosition.y, 
        qrcodeSize, 
        qrcodeSize
    );
    ctx.globalAlpha = 1;
}

// 下载合成图片
function downloadImage() {
    try {
        const link = document.createElement('a');
        link.download = '带二维码的图片.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        alert('保存图片失败，请重试或使用截图功能');
        console.error('下载失败:', e);
    }
}

// 重置上传
function resetUpload() {
    // 清除上传框中的预览图片
    const previews = document.querySelectorAll('.upload-box img');
    previews.forEach(preview => preview.parentNode.removeChild(preview));
    
    // 清除文件输入
    imageUpload.value = '';
    qrcodeUpload.value = '';
    
    // 隐藏编辑区域
    editorContainer.style.display = 'none';
    
    // 重置状态
    backgroundImage = null;
    qrcodeImage = null;
    qrcodePosition = { x: 0, y: 0 };
    qrcodeSize = 150;
    qrcodeOpacity = 1;
    sizeSlider.value = 150;
    opacitySlider.value = 100;
    
    // 滚动回页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 获取在Canvas上的坐标
function getCanvasCoordinates(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// 鼠标/触摸事件：拖拽二维码
function handleStart(clientX, clientY) {
    const coords = getCanvasCoordinates(clientX, clientY);
    
    // 检查点击是否在二维码区域内
    if (
        coords.x >= qrcodePosition.x && 
        coords.x <= qrcodePosition.x + qrcodeSize && 
        coords.y >= qrcodePosition.y && 
        coords.y <= qrcodePosition.y + qrcodeSize
    ) {
        isDragging = true;
        dragStartPosition = {
            x: coords.x - qrcodePosition.x,
            y: coords.y - qrcodePosition.y
        };
    }
}

function handleMove(clientX, clientY) {
    if (!isDragging) return;
    
    // 阻止页面滚动
    event.preventDefault();
    
    const coords = getCanvasCoordinates(clientX, clientY);
    
    // 更新二维码位置
    qrcodePosition.x = coords.x - dragStartPosition.x;
    qrcodePosition.y = coords.y - dragStartPosition.y;
    
    // 保持二维码在画布内
    qrcodePosition.x = Math.max(0, Math.min(canvas.width - qrcodeSize, qrcodePosition.x));
    qrcodePosition.y = Math.max(0, Math.min(canvas.height - qrcodeSize, qrcodePosition.y));
    
    drawCanvas();
}

function handleEnd() {
    isDragging = false;
}

// 鼠标事件监听
canvas.addEventListener('mousedown', e => {
    handleStart(e.clientX, e.clientY);
});

canvas.addEventListener('mousemove', e => {
    handleMove(e.clientX, e.clientY);
});

canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('mouseleave', handleEnd);

// 触摸事件监听（移动设备）
canvas.addEventListener('touchstart', e => {
    if (e.touches.length > 0) {
        e.preventDefault();
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
    }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    if (e.touches.length > 0 && isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
    }
}, { passive: false });

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    handleEnd();
}, { passive: false });

canvas.addEventListener('touchcancel', e => {
    e.preventDefault();
    handleEnd();
}, { passive: false });

// 初始化事件监听
imageUpload.addEventListener('change', e => handleImageUpload(e, 'background'));
qrcodeUpload.addEventListener('change', e => handleImageUpload(e, 'qrcode'));
downloadBtn.addEventListener('click', downloadImage);
resetBtn.addEventListener('click', resetUpload);

// 二维码大小调整
sizeSlider.addEventListener('input', () => {
    qrcodeSize = parseInt(sizeSlider.value);
    drawCanvas();
});

// 二维码透明度调整
opacitySlider.addEventListener('input', () => {
    qrcodeOpacity = parseInt(opacitySlider.value) / 100;
    drawCanvas();
});

// 防止iOS Safari上的橡皮筋效果
document.addEventListener('touchmove', function(e) {
    if (isDragging && e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

// 初始化提示
console.log('图片添加二维码工具已加载'); 