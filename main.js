const {app, BrowserWindow, Menu, Tray, ipcMain} = require('electron');
const path = require('path');
const url = require('url');

var win;
var tray;

function createWindow() {
    win = new BrowserWindow({
        width:500,
        height:500,
        icon:'img/icon.png',
        frame: false,
        // minHeight: 300,
        // minWidth: 300,
        title: "Chronobreak",
        resizable: false
    });
    // win.setMenu(null);

    tray = new Tray("img/icon-tray.png");

    global.shouldTick = true

    const contextMenu = Menu.buildFromTemplate([
        {label: 'Toggle Tick Sound', click: () => {
            global.shouldTick = !global.shouldTick
        }},
        {label: 'Check', click: function() {
            win.show()
        }},
        {label: 'Discard Pomodoro', click: function() {
            app.isQuiting = true;
            app.quit()
        }}
    ])

    tray.on("click", () => {
        win.show()
    })

    tray.setToolTip('Click to open the Chronobreak timer.')
    tray.setContextMenu(contextMenu)

    win.loadURL(url.format({
        pathname: path.join('index.html'),
        protocol: 'file:',
        slashes: true
    }));

    win.on("minimize", (event) => {
        event.preventDefault()
        win.hide()
    })

    win.on('closed', (event) => {
        if (!app.isQuiting) {
            event.preventDefault()
            win.hide()
        }
        return false
        // win = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== "darwin")
        app.quit();
})

app.on('activate', () => {
    if (win === null)
        createWindow();
})