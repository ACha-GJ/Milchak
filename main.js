document.addEventListener('DOMContentLoaded', () => {
    let images = [];
    let selectedIndices = new Set();
    
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
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const selectedCount = document.getElementById('selectedCount');

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
        // 인쇄 전 선택 초기화 (선택 표시가 인쇄되지 않도록)
        if(selectedIndices.size > 0) {
            selectedIndices.clear();
            updateSelectionUI();
            renderContactSheet();
        }
        window.print();
    });

    // 이벤트 리스너: 선택 삭제
    deleteSelectedBtn.addEventListener('click', () => {
        if(selectedIndices.size === 0) return;
        
        if(confirm(`선택한 ${selectedIndices.size}장의 사진을 삭제하시겠습니까?`)) {
            // 선택된 인덱스들을 내림차순 정렬하여 뒤에서부터 삭제 (인덱스 밀림 방지)
            const indicesToDelete = Array.from(selectedIndices).sort((a, b) => b - a);
            indicesToDelete.forEach(index => {
                images.splice(index, 1);
            });
            
            selectedIndices.clear();
            updateSelectionUI();
            updateUI();
        }
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

    // 사진 선택 토글 함수 (전역)
    window.toggleSelection = function(index) {
        if (selectedIndices.has(index)) {
            selectedIndices.delete(index);
        } else {
            selectedIndices.add(index);
        }
        
        updateSelectionUI();
        
        // 해당 프레임만 DOM 업데이트하여 성능 최적화
        const frameWrapper = document.getElementById(`frame-wrapper-${index}`);
        if(frameWrapper) {
            frameWrapper.classList.toggle('selected');
        }
    };
    
    // 선택 UI 상태 업데이트
    function updateSelectionUI() {
        if (selectedIndices.size > 0) {
            deleteSelectedBtn.classList.remove('d-none');
            selectedCount.textContent = selectedIndices.size;
        } else {
            deleteSelectedBtn.classList.add('d-none');
        }
    }

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
                
                const isSelectedClass = selectedIndices.has(j) ? 'selected' : '';

                frameDiv.innerHTML = `
                    <div id="frame-wrapper-${j}" class="frame-image-wrapper ${isSelectedClass}" title="클릭해서 선택/해제" onclick="toggleSelection(${j})">
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