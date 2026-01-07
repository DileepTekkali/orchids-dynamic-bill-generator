document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const signatureInput = document.getElementById('signature-input');
    const signaturePreview = document.getElementById('signature-preview');
    const removeBtn = document.getElementById('remove-signature');
    const dropZoneContent = document.querySelector('.drop-zone-content');

    // Click to upload
    dropZone.addEventListener('click', () => {
        signatureInput.click();
    });

    // Handle file selection
    signatureInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }, false);

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    signaturePreview.src = e.target.result;
                    signaturePreview.classList.remove('hidden');
                    removeBtn.classList.remove('hidden');
                    dropZoneContent.classList.add('hidden');
                };
                reader.readAsDataURL(file);

                // Optionally upload to server
                uploadFile(file);
            } else {
                alert('Please upload an image file.');
            }
        }
    }

    function uploadFile(file) {
        const formData = new FormData();
        formData.append('signature', file);

        fetch('/upload-signature', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        signaturePreview.src = '';
        signaturePreview.classList.add('hidden');
        removeBtn.classList.add('hidden');
        dropZoneContent.classList.remove('hidden');
        signatureInput.value = '';
    });
});
