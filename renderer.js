const { ipcRenderer } = require('electron');

// Elements
const textSection = document.getElementById('text-section');
const todoSection = document.getElementById('todo-section');
const modeTextBtn = document.getElementById('mode-text');
const modeTodoBtn = document.getElementById('mode-todo');

const textInput = document.getElementById('text-input');
const fontSelect = document.getElementById('font-select');
const themeSelect = document.getElementById('theme-select');
const saveBtn = document.getElementById('save-btn');
const canvas = document.getElementById('wallpaper-canvas');

const todoInput = document.getElementById('todo-text');
const addTodoBtn = document.getElementById('add-todo');
const todoList = document.getElementById('todo-list');

let currentMode = 'text';

// Mode Switching
modeTextBtn.addEventListener('click', () => {
    currentMode = 'text';
    modeTextBtn.classList.add('active');
    modeTodoBtn.classList.remove('active');
    textSection.classList.add('active');
    todoSection.classList.remove('active');
});

modeTodoBtn.addEventListener('click', () => {
    currentMode = 'todo';
    modeTodoBtn.classList.add('active');
    modeTextBtn.classList.remove('active');
    todoSection.classList.add('active');
    textSection.classList.remove('active');
});

// Todo Logic
addTodoBtn.addEventListener('click', () => {
    const text = todoInput.value.trim();
    if (text) {
        addTodoItem(text);
        todoInput.value = '';
    }
});

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodoBtn.click();
    }
});

function addTodoItem(text) {
    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const span = document.createElement('span');
    span.textContent = text;
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '&#10006;';
    deleteBtn.className = 'delete-btn';
    
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) li.classList.add('done');
        else li.classList.remove('done');
    });

    deleteBtn.addEventListener('click', () => {
        li.style.transform = 'translateX(20px)';
        li.style.opacity = '0';
        setTimeout(() => li.remove(), 300);
    });
    
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
}

function getWrappedLines(ctx, text, maxWidth) {
    const words = text.split(' ');
    if (words.length === 0) return [''];
    
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// Wallpaper Generation
saveBtn.addEventListener('click', () => {
    saveBtn.disabled = true;
    saveBtn.innerText = 'GENERATING...';
    
    const text = textInput.value;
    const font = fontSelect.value;
    const theme = themeSelect.value;
    
    try {
        generateWallpaper(text, font, theme);
    } catch (err) {
        alert('Generation Error: ' + err.message);
        saveBtn.disabled = false;
        saveBtn.innerText = 'GENERATE & SET WALLPAPER';
    }
});

function generateWallpaper(text, font, theme) {
    const ctx = canvas.getContext('2d');
    // Reducing to 2K if 4K is causing issues, but let's stick to 4K first and fix logic
    canvas.width = 3840;
    canvas.height = 2160;
    
    const themes = {
        cyberpunk: { bg: '#f9f002', text: '#000000', accent: '#ff003c' },
        neon: { bg: '#050505', text: '#00f2ff', accent: '#7000ff' },
        midnight: { bg: '#0f0c29', text: '#ffffff', accent: '#302b63' },
        ocean: { bg: '#005f73', text: '#94d2bd', accent: '#0a9396' },
        forest: { bg: '#132a13', text: '#9ef01a', accent: '#38b000' },
        dark: { bg: '#121212', text: '#e0e0e0', accent: '#333333' },
        light: { bg: '#f8f9fa', text: '#212529', accent: '#dee2e6' }
    };

    const colors = themes[theme] || themes.dark;
    
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 1.0;

    if (theme === 'cyberpunk') {
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = colors.accent;
        ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    } else if (theme === 'neon') {
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(1, '#050505');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (currentMode === 'text') {
        let fontSize = 200;
        let maxWidth = canvas.width * 0.8;
        ctx.font = `bold ${fontSize}px ${font}`;
        
        let lines = [];
        const paragraphs = (text || "ENTER TEXT").split('\n');
        paragraphs.forEach(p => {
            if (p.trim() === '') lines.push('');
            else lines.push(...getWrappedLines(ctx, p, maxWidth));
        });

        if (lines.length > 6) {
            fontSize = Math.max(80, Math.floor(fontSize * (6 / lines.length)));
            ctx.font = `bold ${fontSize}px ${font}`;
            lines = [];
            paragraphs.forEach(p => {
                if (p.trim() === '') lines.push('');
                else lines.push(...getWrappedLines(ctx, p, maxWidth));
            });
        }

        const lineHeight = fontSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        const startY = (canvas.height / 2) - (totalHeight / 2) + (lineHeight / 2);
        
        ctx.shadowColor = colors.text + '88';
        ctx.shadowBlur = 40;

        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
        });
    } else {
        const todos = Array.from(todoList.querySelectorAll('li')).map(li => {
            return {
                text: li.querySelector('span').textContent,
                done: li.classList.contains('done')
            };
        });

        if (todos.length > 0) {
            ctx.font = `bold 120px ${font}`;
            ctx.textAlign = 'left';
            let todoY = 400;
            let startX = 400;
            ctx.fillText('TODO:', startX, 250);
            
            ctx.font = `100px ${font}`;
            todos.forEach(todo => {
                let symbol = todo.done ? '✓ ' : '□ ';
                ctx.shadowColor = colors.text + '44';
                ctx.shadowBlur = 15;
                if (todo.done) ctx.globalAlpha = 0.5;
                ctx.fillText(symbol + todo.text, startX, todoY);
                ctx.globalAlpha = 1.0;
                todoY += 150;
            });
        } else {
            ctx.font = `italic 100px ${font}`;
            ctx.fillText('NO OBJECTIVES FOUND', canvas.width / 2, canvas.height / 2);
        }
    }
    
    const dataUrl = canvas.toDataURL('image/png');
    ipcRenderer.send('save-wallpaper', dataUrl);
}

ipcRenderer.on('save-wallpaper-response', (event, response) => {
    saveBtn.disabled = false;
    saveBtn.innerText = 'GENERATE & SET WALLPAPER';
    
    if (response.success) {
        alert('Wallpaper updated successfully!');
    } else {
        alert('Error Setting Wallpaper: ' + response.error);
    }
});
