export const menus = [
  {
    appName: "Finder",
    menus: {
      File: [
        { title: "New Finder Window", disabled: false },
        { title: "New Folder", disabled: false },
        { title: "New Folder with Selection", disabled: true },
        { title: "New Smart Folder", disabled: false },
        { title: "New Tab", disabled: false },
        { separator: true },
        { title: "Open", disabled: false },
        { title: "Open With", disabled: false },
        { title: "Close Window", disabled: false },
        { separator: true },
        { title: "Move to Trash", disabled: false },
        { separator: true },
        { title: "Get Info", disabled: false },
        { title: "Rename", disabled: false },
        { title: "Duplicate", disabled: true }
      ],
      Edit: [
        { title: "Undo", disabled: true },
        { title: "Redo", disabled: true },
        { separator: true },
        { title: "Cut", disabled: true },
        { title: "Copy", disabled: false },
        { title: "Paste", disabled: true },
        { title: "Select All", disabled: false }
      ],
      View: [
        { title: "As Icons", disabled: false },
        { title: "As List", disabled: false },
        { title: "As Columns", disabled: false },
        { title: "As Gallery", disabled: false },
        { separator: true },
        { title: "Hide Sidebar", disabled: false },
        { title: "Show Preview", disabled: false }
      ],
      Go: [
        { title: "Back", disabled: true },
        { title: "Forward", disabled: true },
        { title: "Enclosing Folder", disabled: false },
        { separator: true },
        { title: "Recent Folders", disabled: false },
        { title: "iCloud Drive", disabled: false },
        { title: "Applications", disabled: false },
        { title: "Desktop", disabled: false },
        { title: "Documents", disabled: false },
        { title: "Downloads", disabled: false }
      ],
      Window: [
        { title: "Minimize", disabled: false },
        { title: "Zoom", disabled: true },
        { separator: true },
        { title: "Bring All to Front", disabled: true }
      ],
      Help: [
        { title: "macOS Help", disabled: false },
        { title: "About Finder", disabled: false }
      ]
    }
  }
];

export const titleMenu = [
  {
    title: "Finder",
    menu: [
      { title: "About Finder", disabled: false },
      { title: "Quit Finder", disabled: false },
    ]
  },
  {
    title: "Calculator",
    menu: [
      { title: "About Calculator", disabled: false },
      { title: "Quit Calculator", disabled: false },
    ]
  }
];

export const appleMenu = [
  { title: "About This Mac", disabled: false },
  { separator: true },
  { title: "System Settings...", disabled: false },
  { title: "App Store...", disabled: true },
  { separator: true },
  { title: "Recent Items", disabled: false },
  { separator: true },
  { title: "Force Quit...", disabled: false },
  { separator: true },
  { title: "Sleep", disabled: false },
  { title: "Restart...", disabled: false },
  { title: "Shut Down...", disabled: false },
  { separator: true },
  { title: "Lock Screen", disabled: false },
  { title: "Log Out User...", disabled: false },
];