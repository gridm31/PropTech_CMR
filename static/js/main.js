// 전역 변수
let extractedData = {
    totalMortgage: 0,
    addressInfo: null,
    mortgageAmounts: []
};

// DOM 요소
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const fileStatus = document.getElementById('fileStatus');
const ocrSection = document.getElementById('ocrSection');
const calculateSection = document.getElementById('calculateSection');
const resultSection = document.getElementById('resultSection');
const addressInfo = document.getElementById('addressInfo');
const mortgageInfo = document.getElementById('mortgageInfo');
const totalMortgage = document.getElementById('totalMortgage');
const marketPrice = document.getElementById('marketPrice');
const totalMortgageInput = document.getElementById('totalMortgageInput');
const editMortgageBtn = document.getElementById('editMortgageBtn');
const calculateBtn = document.getElementById('calculateBtn');

// 파일 입력 이벤트
fileInput.addEventListener('change', handleFileSelect);

// 드래그 앤 드롭 이벤트
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);

// 담보권액 수정 버튼
editMortgageBtn.addEventListener('click', () => {
    if (totalMortgageInput.hasAttribute('readonly')) {
        totalMortgageInput.removeAttribute('readonly');
        totalMortgageInput.focus();
        editMortgageBtn.textContent = '확인 Confirm';
        editMortgageBtn.classList.remove('btn-secondary');
        editMortgageBtn.classList.add('btn-primary');
    } else {
        totalMortgageInput.setAttribute('readonly', true);
        editMortgageBtn.textContent = '수정 Edit';
        editMortgageBtn.classList.remove('btn-primary');
        editMortgageBtn.classList.add('btn-secondary');
        extractedData.totalMortgage = parseInt(totalMortgageInput.value) || 0;
    }
});

// 계산 버튼
calculateBtn.addEventListener('click', calculateCMR);

// 파일 선택 처리
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file);
    }
}

// 드래그 오버 처리
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
}

// 드래그 리브 처리
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
}

// 드롭 처리
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        uploadFile(file);
    }
}

// 파일 업로드 및 OCR 처리
async function uploadFile(file) {
    // 파일 크기 확인 (16MB)
    if (file.size > 16 * 1024 * 1024) {
        showFileStatus('파일 크기가 너무 큽니다. 16MB 이하의 파일을 선택해주세요.<br>File size too large. Please select a file under 16MB.', 'error');
        return;
    }

    // 파일 형식 확인
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.bmp', '.tiff'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        showFileStatus('지원하지 않는 파일 형식입니다.<br>Unsupported file format.', 'error');
        return;
    }

    showFileStatus('파일을 업로드하고 있습니다... Uploading file...', 'success');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showFileStatus(`✅ 파일 업로드 완료: ${file.name}<br>File uploaded successfully`, 'success');
            extractedData = data;
            displayExtractedInfo(data);
            ocrSection.classList.remove('hidden');
            calculateSection.classList.remove('hidden');
            
            // 스크롤 애니메이션
            setTimeout(() => {
                ocrSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        } else {
            showFileStatus(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        showFileStatus(`❌ 오류가 발생했습니다: ${error.message}<br>Error occurred: ${error.message}`, 'error');
    }
}

// 파일 상태 표시
function showFileStatus(message, type) {
    fileStatus.innerHTML = message;
    fileStatus.className = `file-status ${type}`;
    fileStatus.classList.remove('hidden');
}

// 추출된 정보 표시
function displayExtractedInfo(data) {
    // 주소 정보 표시
    if (data.address_info && (data.address_info.addresses.length > 0 || data.address_info.building_names.length > 0)) {
        let addressHTML = '<div style="line-height: 2;">';
        
        if (data.address_info.addresses.length > 0) {
            addressHTML += '<strong>📍 소재지 Address:</strong><br>';
            data.address_info.addresses.forEach(addr => {
                addressHTML += `<div style="margin: 0.5rem 0; padding: 0.75rem; background: white; border-radius: 6px; border-left: 3px solid #2563eb;">${addr}</div>`;
            });
        }
        
        if (data.address_info.building_names.length > 0) {
            addressHTML += '<br><strong>🏢 건물명칭 Building Name:</strong><br>';
            data.address_info.building_names.forEach(name => {
                addressHTML += `<div style="margin: 0.5rem 0; padding: 0.75rem; background: white; border-radius: 6px; border-left: 3px solid #2563eb;">${name}</div>`;
            });
        }
        
        addressHTML += '</div>';
        addressInfo.innerHTML = addressHTML;
    } else {
        addressInfo.innerHTML = '<p style="color: #f59e0b;">⚠️ 주소 정보를 찾을 수 없습니다. 등기부등본 원본을 확인해주세요.<br><span style="font-size: 0.9rem;">Address information not found. Please verify with the original document.</span></p>';
    }

    // 담보권 정보 표시
    if (data.mortgage_amounts && data.mortgage_amounts.length > 0) {
        let mortgageHTML = '<div style="line-height: 2;">';
        mortgageHTML += '<strong>📋 추출된 채권최고액 목록 Extracted Mortgage Amounts:</strong><br>';
        
        data.mortgage_amounts.forEach((item, index) => {
            mortgageHTML += `
                <div style="margin: 0.75rem 0; padding: 1rem; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-weight: 600; color: #2563eb;">항목 ${index + 1} Item ${index + 1}</span>
                        <span style="font-size: 1.25rem; font-weight: 700; color: #ef4444;">${formatNumber(item.amount)}원</span>
                    </div>
                    <div style="font-size: 0.85rem; color: #64748b; padding: 0.5rem; background: #f8fafc; border-radius: 4px;">
                        ${item.text}
                    </div>
                </div>
            `;
        });
        
        mortgageHTML += '</div>';
        mortgageInfo.innerHTML = mortgageHTML;
    } else {
        mortgageInfo.innerHTML = '<p style="color: #f59e0b;">⚠️ 채권최고액 정보를 찾을 수 없습니다. 아래에서 직접 입력해주세요.<br><span style="font-size: 0.9rem;">Mortgage amount not found. Please enter manually below.</span></p>';
    }

    // 총 채권최고액 표시
    totalMortgage.textContent = formatNumber(data.total_mortgage) + '원 (KRW)';
    totalMortgageInput.value = data.total_mortgage;
    extractedData.totalMortgage = data.total_mortgage;
}

// CMR 계산
async function calculateCMR() {
    const marketPriceValue = parseInt(marketPrice.value);
    const totalMortgageValue = parseInt(totalMortgageInput.value) || extractedData.totalMortgage;

    if (!marketPriceValue || marketPriceValue <= 0) {
        alert('실거래가를 올바르게 입력해주세요.\nPlease enter a valid market price.');
        marketPrice.focus();
        return;
    }

    if (totalMortgageValue < 0) {
        alert('총 채권최고액이 올바르지 않습니다.\nInvalid total mortgage amount.');
        return;
    }

    try {
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                total_mortgage: totalMortgageValue,
                market_price: marketPriceValue
            })
        });

        const data = await response.json();

        if (data.success) {
            displayResults(data, marketPriceValue, totalMortgageValue);
            resultSection.classList.remove('hidden');
            
            // 스크롤 애니메이션
            setTimeout(() => {
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        } else {
            alert(`오류가 발생했습니다: ${data.error}\nError: ${data.error}`);
        }
    } catch (error) {
        alert(`계산 중 오류가 발생했습니다: ${error.message}\nCalculation error: ${error.message}`);
    }
}

// 결과 표시
function displayResults(data, marketPriceValue, totalMortgageValue) {
    // CMR 값
    document.getElementById('cmrValue').textContent = data.cmr + '%';

    // 리스크 뱃지
    const riskBadge = document.getElementById('riskBadge');
    riskBadge.textContent = `${data.risk_text_ko} ${data.risk_text_en}`;
    riskBadge.className = `risk-badge ${data.risk_level}`;

    // 리스크 설명
    document.getElementById('riskDescription').textContent = 
        `${data.risk_description_ko} ${data.risk_description_en}`;

    // 안전보증금
    document.getElementById('safeDepositValue').textContent = 
        formatNumber(data.safe_deposit) + '원 (KRW)';

    // 상세 정보
    document.getElementById('detailMarketPrice').textContent = 
        formatNumber(marketPriceValue) + '원 (KRW)';
    document.getElementById('detailMortgage').textContent = 
        formatNumber(totalMortgageValue) + '원 (KRW)';
    document.getElementById('detailSafeDeposit').textContent = 
        formatNumber(data.safe_deposit) + '원 (KRW)';
    document.getElementById('detailCMR').textContent = data.cmr + '%';
}

// 숫자 포맷팅 (천 단위 콤마)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('CMR 분석 프로그램이 로드되었습니다. CMR Analysis Program loaded.');
});



