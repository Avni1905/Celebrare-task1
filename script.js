document.addEventListener('DOMContentLoaded', () => {
    const backgroundImage = document.getElementById('backgroundImage');
    const cards = document.querySelectorAll('.card');
    const addTextBtn = document.getElementById('alignment');
    const textArea = document.getElementById('textArea');
    const undoBtn = document.getElementById('undo');
    const redoBtn = document.getElementById('redo');
    const prevSlideBtn = document.getElementById('prevSlide');
    const nextSlideBtn = document.getElementById('nextSlide');
    const imageContainer = document.querySelector('.image-container');

    let currentSlide = 0;
    let textElements = [];
    let undoStack = [];
    let redoStack = [];

    function updateBackgroundImage() {
        backgroundImage.src = cards[currentSlide].querySelector('img').src;
    }

    function addTextElement() {
        const text = textArea.value;
        if (!text) return;

        const textElement = document.createElement('div');
        textElement.className = 'text-element';
        textElement.textContent = text;
        textElement.style.position = 'absolute';
        textElement.style.left = '50%';
        textElement.style.top = '50%';
        textElement.style.transform = 'translate(-50%, -50%)';
        textElement.style.cursor = 'move';
        textElement.style.userSelect = 'none';

        applyTextStyles(textElement);
        makeDraggable(textElement);

        imageContainer.appendChild(textElement);
        textElements.push(textElement);

        undoStack.push({ type: 'add', element: textElement });
        redoStack = [];
    }

    function applyTextStyles(element) {
        const fontFamily = document.getElementById('fontFamily').value;
        const fontStyle = document.getElementById('fontStyle').value;
        const fontSize = document.getElementById('fontSize').value;
        const textColor = document.getElementById('textColor').value;

        element.style.fontFamily = fontFamily;
        element.style.fontWeight = fontStyle === 'bold' ? 'bold' : 'normal';
        element.style.fontStyle = fontStyle === 'italic' ? 'italic' : 'normal';
        element.style.fontSize = `${fontSize}px`;
        element.style.color = textColor;
    }

    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY;

        element.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        function startDrag(e) {
            isDragging = true;
            startX = e.clientX - element.offsetLeft;
            startY = e.clientY - element.offsetTop;
            e.preventDefault();
        }

        function drag(e) {
            if (!isDragging) return;
            const newX = e.clientX - startX;
            const newY = e.clientY - startY;
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        }

        function stopDrag() {
            isDragging = false;
        }
    }

    function undo() {
        if (undoStack.length === 0) return;

        const action = undoStack.pop();
        if (action.type === 'add') {
            action.element.remove();
            textElements = textElements.filter(el => el !== action.element);
            redoStack.push(action);
        }
    }

    function redo() {
        if (redoStack.length === 0) return;

        const action = redoStack.pop();
        if (action.type === 'add') {
            imageContainer.appendChild(action.element);
            textElements.push(action.element);
            undoStack.push(action);
        }
    }

    function changeSlide(direction) {
        currentSlide = (currentSlide + direction + cards.length) % cards.length;
        updateBackgroundImage();
    }

    addTextBtn.addEventListener('click', addTextElement);
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    prevSlideBtn.addEventListener('click', () => changeSlide(-1));
    nextSlideBtn.addEventListener('click', () => changeSlide(1));

    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            currentSlide = index;
            updateBackgroundImage();
        });
    });

    updateBackgroundImage();
});
