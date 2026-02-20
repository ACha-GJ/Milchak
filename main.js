document.addEventListener('DOMContentLoaded', () => {
    // 상태 변수
    let images = [];
    let currentSpread = 0; // 현재 펼쳐진 페이지 인덱스 (0: 사진 0,1 / 1: 사진 2,3 등)

    // DOM 요소
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const photoBookSection = document.getElementById('photoBookSection');
    const gallerySection = document.getElementById('gallerySection');
    const galleryContainer = document.getElementById('galleryContainer');
    const photoCount = document.getElementById('photoCount');
    
    // 책 요소
    const pageLeft = document.getElementById('pageLeft');
    const pageRight = document.getElementById('pageRight');
    const pageNumLeft = document.getElementById('pageNumLeft');
    const pageNumRight = document.getElementById('pageNumRight');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageIndicator = document.getElementById('pageIndicator');

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

    // 이벤트 리스너: 파일 선택
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });

    // 파일 처리 함수
    function handleFiles(files) {
        const fileArray = Array.from(files);
        
        fileArray.forEach(file => {
            // 이미지 파일인지 확인
            if (!file.type.startsWith('image/')) {
                console.warn('이미지 파일이 아닙니다:', file.name);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                images.push(e.target.result);
                // 모든 파일이 로드되었을 때만 렌더링하기 위해 length 비교
                // 간소화를 위해 파일 하나 로드될 때마다 렌더링 호출
                updateUI();
            };
            reader.readAsDataURL(file);
        });
        
        // 파일 인풋 초기화 (같은 파일 다시 선택 가능하도록)
        fileInput.value = '';
    }

    // 사진 삭제 함수
    window.deleteImage = function(index) {
        images.splice(index, 1);
        
        // 삭제 후 현재 펼침면 인덱스 조정
        const maxSpread = Math.max(0, Math.ceil(images.length / 2) - 1);
        if (currentSpread > maxSpread) {
            currentSpread = maxSpread;
        }
        
        updateUI();
    };

    // UI 전체 업데이트 함수
    function updateUI() {
        if (images.length === 0) {
            photoBookSection.style.display = 'none';
            gallerySection.style.display = 'none';
            photoCount.textContent = '0';
            return;
        }

        photoBookSection.style.display = 'block';
        gallerySection.style.display = 'block';
        photoCount.textContent = images.length.toString();

        renderGallery();
        renderBook();
    }

    // 갤러리 렌더링
    function renderGallery() {
        galleryContainer.innerHTML = '';
        
        images.forEach((imgSrc, index) => {
            const col = document.createElement('div');
            col.className = 'col-4 col-sm-3 col-md-2';
            
            col.innerHTML = `
                <div class="thumbnail-wrapper">
                    <img src="${imgSrc}" alt="thumbnail ${index + 1}">
                    <button class="delete-btn" onclick="deleteImage(${index})" title="삭제">
                        <i class="bi bi-x"></i>✕
                    </button>
                </div>
            `;
            
            galleryContainer.appendChild(col);
        });
    }

    // 포토북 렌더링
    function renderBook() {
        const totalSpreads = Math.max(1, Math.ceil(images.length / 2));
        
        // 왼쪽 페이지 (인덱스: currentSpread * 2)
        const leftIndex = currentSpread * 2;
        if (leftIndex < images.length) {
            pageLeft.innerHTML = `<img src="${images[leftIndex]}" alt="Page ${leftIndex + 1}">`;
        } else {
            pageLeft.innerHTML = `<span class="empty-page-text">빈 페이지</span>`;
        }
        pageNumLeft.textContent = leftIndex + 1;

        // 오른쪽 페이지 (인덱스: currentSpread * 2 + 1)
        const rightIndex = currentSpread * 2 + 1;
        if (rightIndex < images.length) {
            pageRight.innerHTML = `<img src="${images[rightIndex]}" alt="Page ${rightIndex + 1}">`;
        } else {
            pageRight.innerHTML = `<span class="empty-page-text">빈 페이지</span>`;
        }
        pageNumRight.textContent = rightIndex + 1;

        // 네비게이션 버튼 상태
        prevBtn.disabled = currentSpread === 0;
        nextBtn.disabled = currentSpread >= totalSpreads - 1;

        // 페이지 표시기
        pageIndicator.textContent = `${currentSpread + 1} / ${totalSpreads} 장 (총 ${images.length} 컷)`;
    }

    // 네비게이션 이벤트
    prevBtn.addEventListener('click', () => {
        if (currentSpread > 0) {
            currentSpread--;
            renderBook();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalSpreads = Math.ceil(images.length / 2);
        if (currentSpread < totalSpreads - 1) {
            currentSpread++;
            renderBook();
        }
    });
});
