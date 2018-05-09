export default (app) => {
  return [{
    label: 'Application',
    submenu: [
      {
        accelerator: 'Command+Q',
        click() {
          app.quit();
        },
        label: 'Quit',
      },
    ],
  }, {
    label: 'Edit',
    submenu: [
      {
        accelerator: 'CmdOrCtrl+X',
        label: 'Cut',
        role: 'cut',
        selector: 'cut:',
      },
      {
        accelerator: 'CmdOrCtrl+C',
        label: 'Copy',
        role: 'copy',
        selector: 'copy:',
      },
      {
        accelerator: 'CmdOrCtrl+V',
        label: 'Paste',
        role: 'paste',
        selector: 'paste:',
      },
      {
        accelerator: 'CmdOrCtrl+A',
        label: 'Select All',
        role: 'selectall',
        selector: 'selectAll:',
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
