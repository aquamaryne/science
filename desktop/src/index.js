const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let reactProcess;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Загружаем URL React-сервера
    mainWindow.loadURL('http://localhost:3000');

    mainWindow.on('closed', () => {
        mainWindow = null;

        // Закрываем сервер React при закрытии Electron
        if (reactProcess) {
            reactProcess.kill();
        }
    });
};

app.on('ready', () => {
    // Запускаем React-сервер (npm start)
    const reactAppPath = path.join(__dirname, '../../desktop-app'); // Путь к React-приложению
    reactProcess = spawn('npm', ['start'], { cwd: reactAppPath, shell: true });

    reactProcess.stdout.on('data', (data) => {
        console.log(`[React]: ${data}`);
    });

    reactProcess.stderr.on('data', (data) => {
        console.error(`[React Error]: ${data}`);
    });

    reactProcess.on('close', (code) => {
        console.log(`React server exited with code ${code}`);
    });

    // Ждем 2-3 секунды, чтобы сервер успел запуститься
    setTimeout(createWindow, 3000); // 3000 ms = 3 секунды
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});




