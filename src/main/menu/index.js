export default (app) => {
  return [{
    label: 'Application',
    submenu: [
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() {
          app.quit();
        },
      },
    ],
  }, {
    label: 'Edit',
    submenu: [
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:',
        role: 'cut',
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:',
        role: 'copy',
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:',
        role: 'paste',
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:',
        role: 'selectall',
      },
    ],
  },
  {
    label: 'View',
    submenu: [
      {
        role: 'zoomin',
      },
      {
        role: 'zoomout',
      },
      {
        label: 'Reset Zoom',
        role: 'resetzoom',
      },
    ],
  }];
};
