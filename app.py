"""
부동산 등기부등본 CMR(Charge-to-Market Ratio) 분석 프로그램
Real Estate Registry CMR Analysis Program

법적 고지: 본 프로그램은 참고용 지표 산출 도구이며, 법적 책임을 지지 않습니다.
Legal Notice: This program is for reference purposes only and does not bear any legal responsibility.
"""

from flask import Flask, render_template, request, jsonify
import os
import tempfile
import re
from pathlib import Path
import pytesseract
from PIL import Image
import pdf2image
import io

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()

# Tesseract 경로 설정 (필요시 수정)
# pytesseract.pytesseract.tesseract_cmd = r'/usr/local/bin/tesseract'

def extract_text_from_pdf(pdf_path):
    """PDF에서 OCR을 사용하여 텍스트 추출"""
    try:
        # PDF를 이미지로 변환
        images = pdf2image.convert_from_path(pdf_path, dpi=300)
        
        full_text = ""
        for i, image in enumerate(images):
            # Tesseract OCR 실행 (한글 + 영문)
            text = pytesseract.image_to_string(image, lang='kor+eng')
            full_text += f"\n--- Page {i+1} ---\n{text}"
        
        return full_text
    except Exception as e:
        raise Exception(f"PDF 처리 중 오류 발생: {str(e)}")

def extract_text_from_image(image_path):
    """이미지에서 OCR을 사용하여 텍스트 추출"""
    try:
        image = Image.open(image_path)
        # Tesseract OCR 실행 (한글 + 영문)
        text = pytesseract.image_to_string(image, lang='kor+eng')
        return text
    except Exception as e:
        raise Exception(f"이미지 처리 중 오류 발생: {str(e)}")

def parse_address(text):
    """등기부등본에서 주소 추출"""
    # 소재지번 패턴 찾기
    patterns = [
        r'소재지번[:\s]*([^\n]+)',
        r'소재지[:\s]*([^\n]+)',
        r'((?:서울|경기도|인천|부산|대구|대전|광주|울산|세종|강원|충청북도|충청남도|전라북도|전라남도|경상북도|경상남도|제주)[^\n]+)',
    ]
    
    addresses = []
    for pattern in patterns:
        matches = re.findall(pattern, text)
        addresses.extend(matches)
    
    # 건물명칭 찾기
    building_pattern = r'건물명칭[:\s]*([^\n]+)'
    building_matches = re.findall(building_pattern, text)
    
    result = {
        'addresses': [addr.strip() for addr in addresses if addr.strip()],
        'building_names': [name.strip() for name in building_matches if name.strip()]
    }
    
    return result

def parse_mortgage_amounts(text):
    """등기부등본 을구에서 채권최고액 추출"""
    # 채권최고액 패턴 찾기
    patterns = [
        r'채권최고액[:\s]*금\s*([0-9,]+)\s*원',
        r'채권최고액[:\s]*([0-9,]+)\s*원',
        r'최고액[:\s]*금\s*([0-9,]+)\s*원',
        r'최고액[:\s]*([0-9,]+)\s*원',
    ]
    
    amounts = []
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        # 취소선 표시 확인 (일반적으로 '말소', '해지', '취소' 등의 키워드로 확인)
        is_cancelled = any(keyword in line for keyword in ['말소', '해지', '취소', '제한'])
        
        if not is_cancelled:
            for pattern in patterns:
                matches = re.findall(pattern, line)
                for match in matches:
                    # 콤마 제거 후 숫자로 변환
                    amount_str = match.replace(',', '')
                    try:
                        amount = int(amount_str)
                        amounts.append({
                            'amount': amount,
                            'text': line.strip()
                        })
                    except ValueError:
                        continue
    
    return amounts

def calculate_cmr(total_mortgage, market_price):
    """CMR 지표 계산"""
    if market_price == 0:
        return None
    return (total_mortgage / market_price) * 100

def calculate_safe_deposit(market_price, total_mortgage):
    """안전보증금 계산"""
    return max(0, market_price - total_mortgage)

@app.route('/')
def index():
    """메인 페이지"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """파일 업로드 및 OCR 처리"""
    if 'file' not in request.files:
        return jsonify({'error': '파일이 업로드되지 않았습니다.'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': '파일이 선택되지 않았습니다.'}), 400
    
    # 파일 확장자 확인
    ext = Path(file.filename).suffix.lower()
    if ext not in ['.pdf', '.png', '.jpg', '.jpeg', '.bmp', '.tiff']:
        return jsonify({'error': '지원하지 않는 파일 형식입니다. PDF 또는 이미지 파일을 업로드해주세요.'}), 400
    
    try:
        # 임시 파일로 저장
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        file.save(temp_file.name)
        temp_file.close()
        
        # OCR 텍스트 추출
        if ext == '.pdf':
            text = extract_text_from_pdf(temp_file.name)
        else:
            text = extract_text_from_image(temp_file.name)
        
        # 임시 파일 삭제
        os.unlink(temp_file.name)
        
        # 주소 추출
        address_info = parse_address(text)
        
        # 채권최고액 추출
        mortgage_amounts = parse_mortgage_amounts(text)
        total_mortgage = sum([item['amount'] for item in mortgage_amounts])
        
        return jsonify({
            'success': True,
            'extracted_text': text[:1000],  # 처음 1000자만 반환
            'address_info': address_info,
            'mortgage_amounts': mortgage_amounts,
            'total_mortgage': total_mortgage
        })
    
    except Exception as e:
        return jsonify({'error': f'파일 처리 중 오류가 발생했습니다: {str(e)}'}), 500

@app.route('/calculate', methods=['POST'])
def calculate():
    """CMR 및 안전보증금 계산"""
    data = request.get_json()
    
    total_mortgage = data.get('total_mortgage', 0)
    market_price = data.get('market_price', 0)
    
    if market_price <= 0:
        return jsonify({'error': '실거래가를 올바르게 입력해주세요.'}), 400
    
    cmr = calculate_cmr(total_mortgage, market_price)
    safe_deposit = calculate_safe_deposit(market_price, total_mortgage)
    
    # 리스크 레벨 결정
    if cmr <= 50:
        risk_level = 'low'
        risk_text_ko = '낮음'
        risk_text_en = 'Low'
        risk_description_ko = '비교적 안전한 수준입니다.'
        risk_description_en = 'Relatively safe level.'
    elif cmr <= 70:
        risk_level = 'medium'
        risk_text_ko = '보통'
        risk_text_en = 'Medium'
        risk_description_ko = '주의가 필요한 수준입니다.'
        risk_description_en = 'Caution required.'
    else:
        risk_level = 'high'
        risk_text_ko = '높음'
        risk_text_en = 'High'
        risk_description_ko = '위험 수준이 높습니다. 신중한 검토가 필요합니다.'
        risk_description_en = 'High risk level. Careful review required.'
    
    return jsonify({
        'success': True,
        'cmr': round(cmr, 2),
        'safe_deposit': safe_deposit,
        'risk_level': risk_level,
        'risk_text_ko': risk_text_ko,
        'risk_text_en': risk_text_en,
        'risk_description_ko': risk_description_ko,
        'risk_description_en': risk_description_en
    })

if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG') == '1'
    app.run(debug=debug_mode, host='127.0.0.1', port=5000)
    



