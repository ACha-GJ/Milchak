document.addEventListener('DOMContentLoaded', () => {
    let images = [];
    
    // DOM 요소
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const addMoreInput = document.getElementById('addMoreInput');
    const uploadSection = document.getElementById('uploadSection');
    const contactSheetSection = document.getElementById('contactSheetSection');
    const contactSheet = document.getElementById('contactSheet');
    const photoCount = document.getElementById('photoCount');
    const addMoreBtn = document.getElementById('addMoreBtn');
    const printBtn = document.getElementById('printBtn');

    // 이벤트 리스너: 드래그 앤 드롭
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    // 이벤트 리스너: 파일 선택 (최초 업로드)
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });

    // 이벤트 리스너: 사진 추가 버튼 클릭 및 추가 업로드
    addMoreBtn.addEventListener('click', () => {
        addMoreInput.click();
    });

    addMoreInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });

    // 이벤트 리스너: 인쇄 / PDF 저장
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // 파일 처리 함수
    function handleFiles(files) {
        const fileArray = Array.from(files);
        let loadedCount = 0;
        
        fileArray.forEach(file => {
            if (!file.type.startsWith('image/')) {
                console.warn('이미지 파일이 아닙니다:', file.name);
                loadedCount++; // 무시된 파일도 카운트하여 진행 보장
                if (loadedCount === fileArray.length) updateUI();
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    if (img.height > img.width) {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.height;
                        canvas.height = img.width;
                        const ctx = canvas.getContext('2d');
                        
                        ctx.translate(canvas.width / 2, canvas.height / 2);
                        ctx.rotate(-90 * Math.PI / 180);
                        ctx.drawImage(img, -img.width / 2, -img.height / 2);
                        
                        images.push(canvas.toDataURL(file.type));
                    } else {
                        images.push(e.target.result);
                    }
                    
                    loadedCount++;
                    // 모든 파일이 로드되었을 때 UI 업데이트
                    if (loadedCount === fileArray.length) {
                        updateUI();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
        
        // 인풋 초기화
        fileInput.value = '';
        addMoreInput.value = '';
    }

    // 사진 삭제 함수 (전역)
    window.deleteImage = function(index) {
        if(confirm('이 프레임을 삭제하시겠습니까?')) {
            images.splice(index, 1);
            updateUI();
        }
    };

    // UI 전체 업데이트 함수
    function updateUI() {
        if (images.length === 0) {
            uploadSection.style.display = 'block';
            contactSheetSection.style.display = 'none';
            photoCount.textContent = '0';
            return;
        }

        uploadSection.style.display = 'none';
        contactSheetSection.style.display = 'block';
        photoCount.textContent = images.length.toString();

        renderContactSheet();
    }

    // 밀착 인화 시트 렌더링
    function renderContactSheet() {
        contactSheet.innerHTML = '';
        
        // 브라우저 너비에 따라 한 줄에 보여줄 이미지 수를 동적으로 조정할 수도 있지만,
        // 밀착 인화 느낌을 위해 한 줄(필름 스트립 하나)당 일정 개수(예: 4~5장)를 설정.
        const imagesPerStrip = 4;
        const totalStrips = Math.ceil(images.length / imagesPerStrip);
        
        let globalIndex = 0;

        for (let i = 0; i < totalStrips; i++) {
            const stripDiv = document.createElement('div');
            stripDiv.className = 'film-strip';
            
            // 필름 종류 텍스트 (랜덤한 배치 번호 추가)
            const brandText = document.createElement('div');
            brandText.className = 'film-brand-text';
            const batchNum = Math.floor(1000 + Math.random() * 9000);
            brandText.textContent = `KODAK 400TX ${batchNum}`;
            stripDiv.appendChild(brandText);

            // 해당 스트립에 들어갈 이미지 렌더링
            const startIdx = i * imagesPerStrip;
            const endIdx = Math.min(startIdx + imagesPerStrip, images.length);
            
            for (let j = startIdx; j < endIdx; j++) {
                const frameNum = j + 1;
                const frameDiv = document.createElement('div');
                frameDiv.className = 'frame';
                
                // 프레임 번호 표시 (예: 1 1A, 2 2A)
                const displayNum = `${frameNum} ${frameNum}A`;

                frameDiv.innerHTML = `
                    <div class="frame-image-wrapper" title="클릭해서 삭제" onclick="deleteImage(${j})">
                        <img src="${images[j]}" alt="Frame ${frameNum}">
                    </div>
                    <div class="frame-info">
                        <span>${j % 2 === 0 ? '▶' : ''}</span>
                        <span class="frame-number">${displayNum}</span>
                        <span>${j % 2 !== 0 ? '▶' : ''}</span>
                    </div>
                `;
                stripDiv.appendChild(frameDiv);
            }
            
            contactSheet.appendChild(stripDiv);
        }
    }
});