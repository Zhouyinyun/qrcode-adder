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

// 图片上传处理函数
function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
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
        img.src = e.target.result;
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
        
        // 初始化二维码位置（居中）
        if (qrcodePosition.x === 0 && qrcodePosition.y === 0) {
            qrcodePosition.x = backgroundImage.width / 2 - qrcodeSize / 2;
            qrcodePosition.y = backgroundImage.height / 2 - qrcodeSize / 2;
        }
        
        drawCanvas();
    }
}

// 绘制画布
function drawCanvas() {
    // 设置画布大小与背景图片一致
    canvas.width = backgroundImage.width;
    canvas.height = backgroundImage.height;
    
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
    const link = document.createElement('a');
    link.download = '带二维码的图片.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
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
}

// 鼠标事件：拖拽二维码
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    // 检查点击是否在二维码区域内
    if (
        mouseX >= qrcodePosition.x && 
        mouseX <= qrcodePosition.x + qrcodeSize && 
        mouseY >= qrcodePosition.y && 
        mouseY <= qrcodePosition.y + qrcodeSize
    ) {
        isDragging = true;
        dragStartPosition = {
            x: mouseX - qrcodePosition.x,
            y: mouseY - qrcodePosition.y
        };
    }
}

function handleMouseMove(e) {
    if (!isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    // 更新二维码位置
    qrcodePosition.x = mouseX - dragStartPosition.x;
    qrcodePosition.y = mouseY - dragStartPosition.y;
    
    // 保持二维码在画布内
    qrcodePosition.x = Math.max(0, Math.min(canvas.width - qrcodeSize, qrcodePosition.x));
    qrcodePosition.y = Math.max(0, Math.min(canvas.height - qrcodeSize, qrcodePosition.y));
    
    drawCanvas();
}

function handleMouseUp() {
    isDragging = false;
}

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

// 拖拽事件监听
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseleave', handleMouseUp);

// 添加触摸事件支持（移动设备）
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
});

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    handleMouseUp();
}); 