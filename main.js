const server = require('./server');
server.start( function( expressServer ) {

  /**
  * Server is running at this moment
  *
  * Create Electron window
  */

  // Modules to control application life and create native browser window
  const { app, Menu, BrowserWindow } = require('electron');
  const path = require('path');

  // Remove main menu bar in window
  Menu.setApplicationMenu(null);

  // Instance of the mainWindow
  let mainWindow;

  function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
	  width : 1100,
	  height: 600,
	  icon: path.join(__dirname, 'public/icon/icon-310x310.png'),
	  backgroundColor: "#2d3a46",
	  center: true,
	  webPreferences: {
		devTools: true,
		nodeIntegration: true,
		enableRemoteModule: true
	  }
	});

	// Load URL
	mainWindow.loadURL(server.url + ':' + server.port);

	// Make the window full screen
	mainWindow.maximize();
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(function() {
	createWindow();
	app.on('activate',function() {
	  // On macOS it's common to re-create a window in the app when the
	  // dock icon is clicked and there are no other windows open.
	  if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	  }
	});
  })

  // Quit when all windows are closed.
  app.on('window-all-closed',function() {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin'){
	  app.quit();
	}

	// Shutdown server - close expressServer instance
	expressServer.close();
  });
});
