document.addEventListener('DOMContentLoaded', () => {
    let images = [];
    let selectedIndices = new Set();
    let isSelectionMode = false;
    const MAX_IMAGES = 36;
    
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
    const toggleSelectModeBtn = document.getElementById('toggleSelectModeBtn');
    
    // 날짜 표시
    document.getElementById('currentDate').textContent = new Date().toISOString().split('T')[0];
    
    // Modal 관련 요소
    const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
    const modalImage = document.getElementById('modalImage');

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
        if (images.length >= MAX_IMAGES) {
            alert(`최대 ${MAX_IMAGES}장(35mm 필름 1롤)까지만 업로드할 수 있습니다.`);
            return;
        }
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

    // 이벤트 리스너: 선택 모드 토글
    toggleSelectModeBtn.addEventListener('click', () => {
        isSelectionMode = !isSelectionMode;
        
        if (isSelectionMode) {
            toggleSelectModeBtn.classList.remove('btn-outline-dark');
            toggleSelectModeBtn.classList.add('btn-dark');
            toggleSelectModeBtn.textContent = 'SELECT MODE ON';
        } else {
            toggleSelectModeBtn.classList.add('btn-outline-dark');
            toggleSelectModeBtn.classList.remove('btn-dark');
            toggleSelectModeBtn.textContent = 'SELECT';
            
            // 선택 모드 해제 시 선택된 항목들 초기화
            selectedIndices.clear();
            updateSelectionUI();
            renderContactSheet();
        }
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
        // 현재 이미지 개수 확인
        if (images.length >= MAX_IMAGES) {
            alert(`최대 ${MAX_IMAGES}장까지만 업로드할 수 있습니다.`);
            fileInput.value = '';
            addMoreInput.value = '';
            return;
        }

        const fileArray = Array.from(files);
        const remainingSlots = MAX_IMAGES - images.length;
        
        if (fileArray.length > remainingSlots) {
            alert(`최대 ${MAX_IMAGES}장까지만 업로드 가능합니다. ${remainingSlots}장만 추가됩니다.`);
        }

        const filesToProcess = fileArray.slice(0, remainingSlots);
        let loadedCount = 0;
        
        filesToProcess.forEach(file => {
            if (!file.type.startsWith('image/')) {
                console.warn('이미지 파일이 아닙니다:', file.name);
                loadedCount++; 
                if (loadedCount === filesToProcess.length) updateUI();
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
                    if (loadedCount === filesToProcess.length) {
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

    // 사진 클릭 핸들러 (전역)
    window.handleImageClick = function(index) {
        if (isSelectionMode) {
            toggleSelection(index);
        } else {
            showModal(index);
        }
    };

    // 사진 선택 토글 함수
    function toggleSelection(index) {
        if (selectedIndices.has(index)) {
            selectedIndices.delete(index);
        } else {
            selectedIndices.add(index);
        }
        
        updateSelectionUI();
        
        const frameWrapper = document.getElementById(`frame-wrapper-${index}`);
        if(frameWrapper) {
            frameWrapper.classList.toggle('selected');
        }
    }

    // 모달 표시 함수
    function showModal(index) {
        modalImage.src = images[index];
        imageModal.show();
    }
    
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

        // 추가 버튼 비활성화 상태 업데이트 (36장 도달 시)
        if (images.length >= MAX_IMAGES) {
            addMoreBtn.disabled = true;
            addMoreBtn.textContent = 'FULL';
        } else {
            addMoreBtn.disabled = false;
            addMoreBtn.textContent = 'ADD (+)';
        }

        renderContactSheet();
    }

    // 밀착 인화 시트 렌더링
    function renderContactSheet() {
        contactSheet.innerHTML = '';
        
        // 브라우저 너비에 관계없이 필름 스트립 형태 유지 (반응형보다는 고정된 인화지 느낌)
        const imagesPerStrip = 5; // 한 줄에 5장 (표준 밀착 인화 느낌)
        const totalStrips = Math.ceil(images.length / imagesPerStrip);
        
        for (let i = 0; i < totalStrips; i++) {
            const stripDiv = document.createElement('div');
            stripDiv.className = 'film-strip';
            
            const brandText = document.createElement('div');
            brandText.className = 'film-brand-text';
            const batchNum = Math.floor(1000 + Math.random() * 9000);
            brandText.textContent = `KODAK 400TX ${batchNum}`;
            stripDiv.appendChild(brandText);

            const startIdx = i * imagesPerStrip;
            const endIdx = Math.min(startIdx + imagesPerStrip, images.length);
            
            for (let j = startIdx; j < endIdx; j++) {
                const frameNum = j + 1;
                const frameDiv = document.createElement('div');
                frameDiv.className = 'frame';
                
                const displayNum = `${frameNum} ${frameNum}A`;
                const isSelectedClass = selectedIndices.has(j) ? 'selected' : '';

                frameDiv.innerHTML = `
                    <div id="frame-wrapper-${j}" class="frame-image-wrapper ${isSelectedClass}" title="${isSelectionMode ? '클릭해서 선택' : '클릭해서 확대'}" onclick="handleImageClick(${j})">
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
            
            // 빈 공간 채우기 (필름 5장 길이 유지)
            if ((endIdx - startIdx) < imagesPerStrip) {
                const emptySlots = imagesPerStrip - (endIdx - startIdx);
                for (let k = 0; k < emptySlots; k++) {
                     const emptyFrame = document.createElement('div');
                     emptyFrame.className = 'frame';
                     emptyFrame.style.visibility = 'hidden'; // 공간만 차지
                     stripDiv.appendChild(emptyFrame);
                }
            }

            contactSheet.appendChild(stripDiv);
        }
    }
});