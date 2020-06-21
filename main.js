const {app, BrowserWindow, Menu, Tray, ipcMain} = require('electron');
const path = require('path');
const url = require('url');

var config = {
    node: {
        __dirname: false
    }
}

var win;
var tray;

function createWindow() {
    // app.commandLine.appendSwitch('disable-web-security')
    win = new BrowserWindow({
        width:500,
        height:500,
        icon: path.join(__dirname, 'img/icon.png'),
        frame: false,
        // minHeight: 300,
        // minWidth: 300,
        backgroundColor: '#222',
        title: "Chronobreak",
        // "web-preferences": {
        //     "web-security": false
        // },
        webPreferences: {
            nodeIntegration: true,
        },
        resizable: false,
        show: false
    });
    // win.setMenu(null);

    win.once('ready-to-show', () => {
        win.show()
    })

    tray = new Tray(path.join(__dirname, "img/icon-tray.png"));

    global.shouldTick = false

    const contextMenu = Menu.buildFromTemplate([
        {label: 'Discard Pomodoro', click: function() {
            app.isQuiting = true;
            app.quit()
        }},
        {
            type: 'separator',
        },
        {
            label: 'Version 1.1.2'
        },
        {
            type: 'separator',
        },
        {label: 'Toggle Tick-Tock Sound', click: () => {
            global.shouldTick = !global.shouldTick
        }},
        {label: 'Open Pomodoro', click: function() {
            win.show()
        }}
    ])

    tray.on("click", () => {
        win.show()
    })

    tray.setToolTip('Click to open the Chronobreak timer.')
    tray.setContextMenu(contextMenu)


    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
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