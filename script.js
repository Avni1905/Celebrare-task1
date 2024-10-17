
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
    let textElementsBySlide = Array(cards.length).fill().map(() => []);
    let undoStack = [];
    let redoStack = [];
    let selectedElement = null;

    function updateBackgroundImage() {
        backgroundImage.src = cards[currentSlide].querySelector('img').src;
        updateVisibleTextElements();
    }

    function updateVisibleTextElements() {
        imageContainer.querySelectorAll('.text-element').forEach(el => el.remove());
        textElementsBySlide[currentSlide].forEach(el => imageContainer.appendChild(el));
    }

    function createUndoAction(type, element, oldState, newState) {
        return { type, element, oldState, newState, slide: currentSlide };
    }

    function addTextElement() {
        const text = textArea.value || "New Text";
        const textElement = document.createElement('div');
        textElement.className = 'text-element';
        textElement.textContent = text;
        textElement.style.position = 'absolute';
        textElement.style.left = '10px';
        textElement.style.top = '10px';
        textElement.style.cursor = 'move';
        textElement.style.minWidth = '50px';
        textElement.style.minHeight = '20px';
        textElement.style.padding = '5px';
        textElement.style.border = '1px dashed #000';
        textElement.style.maxWidth = '90%';
        textElement.style.overflowWrap = 'break-word';

        const initialState = {
            text: text,
            styles: {
                fontFamily: document.getElementById('fontFamily').value,
                fontSize: `${document.getElementById('fontSize').value}px`,
                fontWeight: document.getElementById('fontStyle').value === 'bold' ? 'bold' : 'normal',
                fontStyle: document.getElementById('fontStyle').value === 'italic' ? 'italic' : 'normal',
                color: document.getElementById('textColor').value
            },
            position: { left: '10px', top: '10px' }
        };

        textElement.dataset.state = JSON.stringify(initialState);
        applyTextStyles(textElement, initialState.styles);
        makeEditableAndDraggable(textElement);

        imageContainer.appendChild(textElement);
        textElementsBySlide[currentSlide].push(textElement);

        undoStack.push(createUndoAction('add', textElement, null, initialState));
        redoStack = [];

        selectElement(textElement);
    }

    function keepElementInBounds(element) {
        const container = imageContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const padding = 5;

        let left = parseFloat(element.style.left);
        let top = parseFloat(element.style.top);

        if (left < padding) left = padding;
        if (top < padding) top = padding;
        if (left + elementRect.width > container.width - padding) {
            left = container.width - elementRect.width - padding;
        }
        if (top + elementRect.height > container.height - padding) {
            top = container.height - elementRect.height - padding;
        }

        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
    }

    function makeEditableAndDraggable(element) {
        let isDragging = false;
        let startX, startY;

        element.addEventListener('mousedown', (e) => {
            if (e.target === element) {
                isDragging = true;
                const rect = element.getBoundingClientRect();
                const containerRect = imageContainer.getBoundingClientRect();
                startX = e.clientX - rect.left;
                startY = e.clientY - rect.top;
                selectElement(element);
                e.preventDefault();
            }
        });

        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            element.contentEditable = true;
            element.focus();
        });

        element.addEventListener('blur', () => {
            element.contentEditable = false;
            const currentState = JSON.parse(element.dataset.state);
            if (currentState.text !== element.textContent) {
                const oldState = {...currentState};
                currentState.text = element.textContent;
                element.dataset.state = JSON.stringify(currentState);
                undoStack.push(createUndoAction('edit', element, oldState, currentState));
                redoStack = [];
                textArea.value = element.textContent;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const containerRect = imageContainer.getBoundingClientRect();
            const newX = e.clientX - containerRect.left - startX;
            const newY = e.clientY - containerRect.top - startY;

            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
            keepElementInBounds(element);
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                const currentState = JSON.parse(element.dataset.state);
                const newState = {
                    ...currentState,
                    position: {
                        left: element.style.left,
                        top: element.style.top
                    }
                };
                undoStack.push(createUndoAction('move', element, currentState, newState));
                element.dataset.state = JSON.stringify(newState);
                redoStack = [];
            }
        });

        element.addEventListener('click', (e) => {
            selectElement(element);
            e.stopPropagation();
        });
    }

    function selectElement(element) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }

        selectedElement = element;
        if (element) {
            element.classList.add('selected');
            updateControlsFromElement(element);
            
            textArea.value = element.textContent;
            textArea.disabled = false;
        } else {
            textArea.value = '';
            textArea.disabled = true;
        }
    }

    function updateControlsFromElement(element) {
        const state = JSON.parse(element.dataset.state);
        document.getElementById('fontFamily').value = state.styles.fontFamily;
        document.getElementById('fontSize').value = parseInt(state.styles.fontSize);
        document.getElementById('textColor').value = state.styles.color;
        
        let fontStyle = 'regular';
        if (state.styles.fontWeight === 'bold') fontStyle = 'bold';
        else if (state.styles.fontStyle === 'italic') fontStyle = 'italic';
        document.getElementById('fontStyle').value = fontStyle;
    }

    function applyTextStyles(element, newStyles = null) {
        const currentState = JSON.parse(element.dataset.state);
        const styles = newStyles || {
            fontFamily: document.getElementById('fontFamily').value,
            fontWeight: document.getElementById('fontStyle').value === 'bold' ? 'bold' : 'normal',
            fontStyle: document.getElementById('fontStyle').value === 'italic' ? 'italic' : 'normal',
            fontSize: `${document.getElementById('fontSize').value}px`,
            color: document.getElementById('textColor').value
        };

        const oldState = {...currentState};
        
        currentState.styles = styles;
        element.dataset.state = JSON.stringify(currentState);

        element.style.fontFamily = styles.fontFamily;
        element.style.fontWeight = styles.fontWeight;
        element.style.fontStyle = styles.fontStyle;
        element.style.fontSize = styles.fontSize;
        element.style.color = styles.color;

        return { oldState, newState: currentState };
    }

    function undo() {
        if (undoStack.length === 0) return;

        const action = undoStack.pop();
        if (action.slide !== currentSlide) {
            undoStack.push(action);
            return;
        }

        switch (action.type) {
            case 'add':
                action.element.remove();
                textElementsBySlide[action.slide] = textElementsBySlide[action.slide].filter(el => el !== action.element);
                break;
            case 'edit':
            case 'style':
            case 'move':
                action.element.dataset.state = JSON.stringify(action.oldState);
                action.element.textContent = action.oldState.text;
                applyTextStyles(action.element, action.oldState.styles);
                if (action.oldState.position) {
                    action.element.style.left = action.oldState.position.left;
                    action.element.style.top = action.oldState.position.top;
                }
                if (selectedElement === action.element) {
                    textArea.value = action.element.textContent;
                }
                break;
        }
        redoStack.push(action);
        updateVisibleTextElements();
    }

    function redo() {
        if (redoStack.length === 0) return;

        const action = redoStack.pop();
        if (action.slide !== currentSlide) {
            redoStack.push(action);
            return;
        }

        switch (action.type) {
            case 'add':
                textElementsBySlide[action.slide].push(action.element);
                imageContainer.appendChild(action.element);
                break;
            case 'edit':
            case 'style':
            case 'move':
                action.element.dataset.state = JSON.stringify(action.newState);
                action.element.textContent = action.newState.text;
                applyTextStyles(action.element, action.newState.styles);
                if (action.newState.position) {
                    action.element.style.left = action.newState.position.left;
                    action.element.style.top = action.newState.position.top;
                }
                if (selectedElement === action.element) {
                    textArea.value = action.element.textContent;
                }
                break;
        }
        undoStack.push(action);
        updateVisibleTextElements();
    }

    function changeSlide(direction) {
        currentSlide = (currentSlide + direction + cards.length) % cards.length;
        updateBackgroundImage();
        selectElement(null);
    }

    // Event Listeners
    addTextBtn.addEventListener('click', addTextElement);
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    prevSlideBtn.addEventListener('click', () => changeSlide(-1));
    nextSlideBtn.addEventListener('click', () => changeSlide(1));

    textArea.addEventListener('input', () => {
        if (selectedElement) {
            selectedElement.textContent = textArea.value;
            
            const currentState = JSON.parse(selectedElement.dataset.state);
            const oldState = {...currentState};
            currentState.text = textArea.value;
            selectedElement.dataset.state = JSON.stringify(currentState);
            
            undoStack.push(createUndoAction('edit', selectedElement, oldState, currentState));
            redoStack = [];
        }
    });

    ['fontFamily', 'fontStyle', 'fontSize', 'textColor'].forEach(controlId => {
        document.getElementById(controlId).addEventListener('change', () => {
            if (selectedElement) {
                const { oldState, newState } = applyTextStyles(selectedElement);
                undoStack.push(createUndoAction('style', selectedElement, oldState, newState));
                redoStack = [];
            }
        });
    });

    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            currentSlide = index;
            updateBackgroundImage();
            selectElement(null);
        });
    });

    imageContainer.addEventListener('click', (e) => {
        if (e.target === imageContainer || e.target === backgroundImage) {
            selectElement(null);
        }
    });

    updateBackgroundImage();
});