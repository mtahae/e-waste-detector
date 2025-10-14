const API_BASE = 'https://th-ewaste-erasmus.duckdns.org/api';

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');

const uploadSection = document.getElementById('uploadSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');

let selectedFile = null;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkServerStatus();
});

function setupEventListeners() {

    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });


    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });


    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });


    analyzeBtn.addEventListener('click', analyzeImage);

    resetBtn.addEventListener('click', resetInterface);
}

function handleFileSelect(file) {
    if (!file) return;


    if (!file.type.startsWith('image/')) {
        alert('Please select an image file!');
        return;
    }

    selectedFile = file;
    

    uploadArea.querySelector('.upload-text').textContent = `✓ ${file.name}`;
    uploadArea.querySelector('.upload-hint').textContent = `Boyut: ${formatFileSize(file.size)}`;
    uploadArea.classList.add('file-selected');
    analyzeBtn.disabled = false;

    console.log('File Selected:', file.name);
}

async function analyzeImage() {
    if (!selectedFile) {
        alert('Please select an image first!');
        return;
    }


    uploadSection.style.display = 'none';
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';

    console.log('Analyze is starting...');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            console.log('Analyzing is Successfull:', data);
            displayResults(data);
        } else {
            throw new Error(data.error || 'Unknown Error');
        }
    } catch (error) {
        console.error('Analyzing Error:', error);
        alert(`Analyzing Error:\n${error.message}`);
        resetInterface();
    }
}

function displayResults(data) {

    loadingSection.style.display = 'none';
    resultsSection.style.display = 'block';
    resetBtn.style.display = 'inline-block';


    const message = `${data.battery_count} batteries detected successfully!`;
    document.getElementById('successMessage').textContent = message;

    document.getElementById('originalImage').src = `${API_BASE}/images/${data.original_filename}`;
    document.getElementById('resultImage').src = `${API_BASE}/images/${data.result_filename}`;


    const stats = data.statistics;
    document.getElementById('totalBatteries').textContent = stats.total;
    document.getElementById('avgConfidence').textContent = `${stats.avg_confidence.toFixed(1)}%`;
    document.getElementById('maxConfidence').textContent = `${stats.max_confidence.toFixed(1)}%`;
    document.getElementById('highConfCount').textContent = stats.high_conf_count;


    displayDetectionDetails(data.detections);

    console.log('Results Displayed');
}

function displayDetectionDetails(detections) {
    const detectionList = document.getElementById('detectionList');
    detectionList.innerHTML = '';

    if (detections.length === 0) {
        detectionList.innerHTML = '<p class="no-detections">Pil tespit edilemedi</p>';
        return;
    }

    detections.forEach((det, index) => {
        const detItem = document.createElement('div');
        detItem.className = 'detection-item';
        
        const confidenceClass = getConfidenceClass(det.confidence);
        
        detItem.innerHTML = `
            <div class="detection-header">
                <span class="detection-id">🔋 Pil #${det.id}</span>
                <span class="confidence-badge ${confidenceClass}">${det.confidence.toFixed(1)}%</span>
            </div>
            <div class="confidence-bar">
                <div class="confidence-fill ${confidenceClass}" style="width: ${det.confidence}%"></div>
            </div>
            <div class="detection-info">
                <small>Konum: (${det.bbox.x1}, ${det.bbox.y1}) - (${det.bbox.x2}, ${det.bbox.y2})</small>
                <small>Boyut: ${det.bbox.width} x ${det.bbox.height} px</small>
            </div>
        `;
        
        detectionList.appendChild(detItem);
    });
}

function getConfidenceClass(confidence) {
    if (confidence >= 70) return 'high';
    if (confidence >= 50) return 'medium';
    return 'low';
}

function resetInterface() {
    selectedFile = null;
    fileInput.value = '';
    
    uploadArea.querySelector('.upload-text').textContent = 'Upload a photo';
    uploadArea.querySelector('.upload-hint').textContent = 'Click or drag and drop (JPG, PNG)';
    uploadArea.classList.remove('file-selected');
    analyzeBtn.disabled = true;
    
    uploadSection.style.display = 'block';
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    resetBtn.style.display = 'none';
    
    console.log('Interface got reseted');
}

async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        const data = await response.json();
        
        if (data.status === 'online') {
            console.log('Server Connection is Successful');
            console.log('Model Uploaded:', data.model_loaded);
        }
    } catch (error) {
        console.warn('Server bağlantısı kurulamadı:', error.message);
        alert('Can not connected to the backend!\nMake sure app.py is running!');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
