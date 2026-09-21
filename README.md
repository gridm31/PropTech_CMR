## Summary
Many tenants in Korea hand a landlord a deposit that can approach the value of the home.
This tool reads a scanned property register with OCR, totals the active mortgage liens,
and compares them with the recent transaction price to estimate how much of a deposit
the property could still cover. The interface works in Korean and English.

# CMR 분석 프로그램 / CMR Analysis Program

세입자의 보증금 반환 리스크 점검을 위한 CMR(Charge-to-Market Ratio) 지표 산출 프로그램

Real estate deposit refund risk assessment program using CMR (Charge-to-Market Ratio) indicator

---

## 📋 프로그램 소개 / Program Introduction

본 프로그램은 부동산 등기부등본을 분석하여 **CMR(Charge-to-Market Ratio)** 지표를 산출하고, 세입자가 안전하게 설정할 수 있는 보증금 금액을 계산하는 도구입니다.

This program analyzes real estate registry documents to calculate the **CMR (Charge-to-Market Ratio)** indicator and determines the safe deposit amount for tenants.

### 주요 기능 / Key Features

- 📄 **OCR 기반 문서 분석**: PDF 및 이미지 형식의 등기부등본에서 자동으로 정보 추출
- 📍 **주소 자동 인식**: 물건 소재지 및 건물명 자동 추출
- 💰 **채권최고액 계산**: 유효한 담보권액 자동 합산
- 📊 **CMR 지표 산출**: 담보권액/실거래가 비율 계산
- 🏠 **안전보증금 계산**: 최대 안전 보증금 금액 제시
- 🌐 **한글/영문 지원**: 외국인도 이용 가능한 이중 언어 인터페이스

---

## ⚠️ 법적 고지 / Legal Notice

**중요**: 본 프로그램은 참고용 지표 산출 도구이며, 산출된 결과에 대해 법적 책임을 지지 않습니다. 실제 부동산 거래 시 반드시 전문가(변호사, 공인중개사 등)의 자문을 받으시기 바랍니다.

**Important**: This program is for reference purposes only and does not bear any legal responsibility for the calculated results. Please consult professionals (lawyers, real estate agents, etc.) for actual transactions.

---

## 🚀 설치 방법 / Installation

### 1. 시스템 요구사항 / System Requirements

- Python 3.8 이상 / Python 3.8 or higher
- Tesseract OCR

### 2. Tesseract OCR 설치 / Install Tesseract OCR

#### macOS
```bash
brew install tesseract
brew install tesseract-lang  # 한글 언어팩 포함
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-kor  # 한글 언어팩
```

#### Windows
1. [Tesseract GitHub Releases](https://github.com/UB-Mannheim/tesseract/wiki)에서 설치 파일 다운로드
2. 설치 시 한국어 언어팩 선택
3. 환경 변수에 Tesseract 경로 추가

### 3. Python 패키지 설치 / Install Python Packages

```bash
# 가상환경 생성 (권장) / Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 필요한 패키지 설치 / Install required packages
pip install -r requirements.txt
```

### 4. poppler 설치 (PDF 처리용) / Install poppler (for PDF processing)

#### macOS
```bash
brew install poppler
```

#### Ubuntu/Debian
```bash
sudo apt-get install poppler-utils
```

#### Windows
1. [Poppler for Windows](https://github.com/oschwartz10612/poppler-windows/releases/)에서 다운로드
2. 압축 해제 후 bin 폴더를 환경 변수 PATH에 추가

---

## 🎯 사용 방법 / How to Use

### 1. 프로그램 실행 / Run the Program

```bash
python app.py
```

프로그램이 실행되면 브라우저에서 http://localhost:5000 으로 접속합니다.

Once the program is running, access http://localhost:5000 in your browser.

### 2. 등기부등본 업로드 / Upload Registry Document

- PDF 또는 이미지 파일 선택 (최대 16MB)
- 드래그 앤 드롭으로 파일 업로드 가능
- 지원 형식: PDF, PNG, JPG, JPEG, BMP, TIFF

### 3. 자동 분석 확인 / Review Automated Analysis

- OCR로 추출된 주소 정보 확인
- 채권최고액(담보권액) 자동 합산 확인
- 필요시 수동으로 수정 가능

### 4. 실거래가 입력 / Enter Market Price

- 해당 물건의 최근 실거래가 입력
- 실거래가가 없는 경우, 같은 건물 내 유사 타입 물건의 실거래가 참고

### 5. 결과 확인 / View Results

- **CMR 지표**: 담보권액/실거래가 비율 (%)
- **리스크 레벨**: 낮음/보통/높음
- **안전보증금**: 최대로 설정 가능한 보증금 금액

---

## 📊 CMR 지표 해석 / CMR Interpretation

| CMR 범위 | 리스크 레벨 | 설명 |
|---------|----------|------|
| **≤ 50%** | 🟢 낮음 (Low) | 비교적 안전한 수준 / Relatively safe |
| **50% ~ 70%** | 🟡 보통 (Medium) | 주의 필요 / Caution required |
| **> 70%** | 🔴 높음 (High) | 위험 수준, 신중한 검토 필요 / High risk, careful review required |

### 계산식 / Formula

```
CMR = (총 채권최고액 ÷ 실거래가) × 100

안전보증금 = 실거래가 - 총 채권최고액
```

---

## 📁 프로젝트 구조 / Project Structure

```
.
├── app.py                  # Flask 백엔드 / Flask backend
├── requirements.txt        # Python 패키지 의존성 / Python dependencies
├── README.md              # 프로젝트 설명서 / Project documentation
├── templates/
│   └── index.html         # 메인 페이지 / Main page
└── static/
    ├── css/
    │   └── style.css      # 스타일시트 / Stylesheet
    └── js/
        └── main.js        # 프론트엔드 로직 / Frontend logic
```

---

## 🔧 문제 해결 / Troubleshooting

### OCR 인식이 잘 안 될 때 / Poor OCR Recognition

1. 고해상도 이미지 사용 (300 DPI 이상 권장)
2. 이미지가 흐릿하거나 기울어진 경우 사전 보정
3. PDF보다 이미지 파일이 더 나은 결과를 줄 수 있음

### Tesseract 경로 오류 / Tesseract Path Error

`app.py` 파일에서 Tesseract 경로 수정:

```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'/usr/local/bin/tesseract'  # 실제 경로로 수정
```

### 한글 인식 안 됨 / Korean Language Not Recognized

Tesseract 한글 언어팩이 설치되어 있는지 확인:

```bash
tesseract --list-langs
```

`kor`이 목록에 있어야 합니다.

---

## 💡 사용 팁 / Usage Tips

1. **실거래가 입력 시**: 국토교통부 실거래가 공개시스템에서 최근 거래 내역 확인
2. **채권최고액 확인**: 등기부등본의 '을구(소유권 이외의 권리에 관한 사항)' 섹션에서 말소되지 않은 항목만 합산
3. **안전보증금**: 산출된 안전보증금 이하로 계약하는 것을 권장하나, 반드시 전문가 자문 필요
4. **정기적 확인**: 부동산 거래 전 최신 등기부등본으로 재확인 필수

---

## 📞 지원 및 문의 / Support

프로그램 사용 중 문제가 발생하거나 개선 사항이 있으시면 이슈를 등록해주세요.

If you encounter any issues or have suggestions for improvement, please submit an issue.

---

## 📝 라이센스 / License

본 프로그램은 참고용으로 제공되며, 상업적 사용 시 별도 승인이 필요합니다.

This program is provided for reference purposes. Commercial use requires separate approval.

---

## 🙏 참고 자료 / References

- 대한민국 법원 인터넷등기소: https://www.iros.go.kr
- 국토교통부 실거래가 공개시스템: https://rt.molit.go.kr
- Tesseract OCR: https://github.com/tesseract-ocr/tesseract

---

**면책조항 / Disclaimer**: 본 프로그램은 교육 및 참고 목적으로 제공됩니다. 실제 법적 조언이나 금융 자문을 대체할 수 없으며, 프로그램 사용으로 인한 어떠한 손해에 대해서도 책임을 지지 않습니다.

This program is provided for educational and reference purposes only. It cannot replace actual legal advice or financial consulting, and we are not responsible for any damages resulting from the use of this program.



