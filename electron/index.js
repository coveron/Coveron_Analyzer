const { app, BrowserWindow, Menu, ipcMain, ipcRenderer, dialog } = require('electron')
const isDevMode = require('electron-is-dev')
const { CapacitorSplashScreen, configCapacitor } = require('@capacitor/electron')

const os = require('os')
const path = require('path')
const { create: xmlbuilder } = require('xmlbuilder2')
const electron = require('@capacitor/electron')
const { platform } = require('process')
const fs = require('fs')

// Place holders for our windows so they don't get garbage collected.
let mainWindow = null

// Placeholder for SplashScreen ref
let splashScreen = null

// Change this if you do not wish to have a splash screen
let useSplashScreen = false

// Create simple menu for easy devtools access, and for demo
const menuTemplateDev = [
  {
    label: 'Options',
    submenu: [
      {
        label: 'Open Dev Tools',
        click() {
          mainWindow.openDevTools()
        }
      }
    ]
  }
]

async function createWindow() {
  // Define our main window size
  if (os.platform() === 'darwin') {
    mainWindow = new BrowserWindow({
      height: 600,
      width: 800,
      show: false,
      frame: true,
      titleBarStyle: 'hidden',
      webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, 'node_modules', '@capacitor', 'electron', 'dist', 'electron-bridge.js')
      },
      title: "Coveron"
    })
  } else {
    mainWindow = new BrowserWindow({
      height: 600,
      width: 800,
      show: false,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, 'node_modules', '@capacitor', 'electron', 'dist', 'electron-bridge.js')
      },
      icon: path.join(__dirname, 'icons', 'icon.png'),
      title: "Coveron"
    })
  }

  configCapacitor(mainWindow)

  if (isDevMode) {
    // Set our above template to the Menu Object if we are in development mode, dont want users having the devtools.
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplateDev))
    // If we are developers we might as well open the devtools by default.
    //mainWindow.webContents.openDevTools()
  }

  if (useSplashScreen) {
    splashScreen = new CapacitorSplashScreen(mainWindow)
    splashScreen.init()
  } else {
    mainWindow.loadURL(`file://${__dirname}/app/index.html`)
    mainWindow.webContents.on('dom-ready', () => {
      mainWindow.show()
    })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some Electron APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// Define any IPC or other custom functionality below here
const { AnalyzerMain } = require("../dist/out-tsc/analyzer/AnalyzerMain");
const { fstat } = require('fs')
// const { AnalyzerMain } = require("../AnalyzerMain");

let analyzer_main = null;

ipcMain.on('load_report', function (event, args) {
  console.log("Loading report from " + args['filename']);
  mainWindow.webContents.send('report_opened');
  analyzer_main = new AnalyzerMain(args['filename'], null, mainWindow);
});

ipcMain.on('close_report', function (event, args) {
  console.log("Closing report.");
  analyzer_main = null;
  mainWindow.webContents.send('report_closed');
});

ipcMain.on('export_xml', function (event, args) {
  console.log("Exporting report to XML.");
  let coverage_data = {
    "coveron_report": {
      "file": {
        "filename": analyzer_main.cid_data['source_code_path'],
        "source_code_hash": analyzer_main.cid_data['source_code_hash'],
        "execution_count": analyzer_main.cid_data['recorded_executions'],
        "coverage": {
          "function": {
            "all_count": analyzer_main.cid_data['code_data']['executed_functions'] + analyzer_main.cid_data['code_data']['unexecuted_functions'],
            "executed": analyzer_main.cid_data['code_data']['executed_functions'],
            "coverage": (analyzer_main.cid_data['code_data']['executed_functions'] / (analyzer_main.cid_data['code_data']['executed_functions'] + analyzer_main.cid_data['code_data']['unexecuted_functions']))
          },
          "statement": {
            "all_count": analyzer_main.cid_data['code_data']['executed_statements'] + analyzer_main.cid_data['code_data']['unexecuted_statements'],
            "executed": analyzer_main.cid_data['code_data']['executed_statements'],
            "coverage": (analyzer_main.cid_data['code_data']['executed_statements'] / (analyzer_main.cid_data['code_data']['executed_statements'] + analyzer_main.cid_data['code_data']['unexecuted_statements']))
          },
          "branch": {
            "all_count": analyzer_main.cid_data['code_data']['taken_branches'] + analyzer_main.cid_data['code_data']['nottaken_branches'],
            "taken": analyzer_main.cid_data['code_data']['taken_branches'],
            "coverage": (analyzer_main.cid_data['code_data']['taken_branches'] / (analyzer_main.cid_data['code_data']['taken_branches'] + analyzer_main.cid_data['code_data']['nottaken_branches'])),
          },
          "mcdc": {
            "all_count": analyzer_main.cid_data['code_data']['evaluated_mcdc'] + analyzer_main.cid_data['code_data']['notevaluated_mcdc'],
            "evaluated": analyzer_main.cid_data['code_data']['evaluated_mcdc'],
            "coverage": (analyzer_main.cid_data['code_data']['evaluated_mcdc'] / (analyzer_main.cid_data['code_data']['evaluated_mcdc'] + analyzer_main.cid_data['code_data']['notevaluated_mcdc']))
          }
        }
      }
    }
  }
  let xml_data = xmlbuilder(coverage_data).end({ prettyPrint: true });
  let output_filepath = dialog.showSaveDialogSync({ title: "Store XML report", filters: [{ name: "XML file", extensions: ["xml"] }], defaultPath: "coverage_output.xml" });
  try {
    fs.writeFileSync(output_filepath, xml_data);
  } catch {
    mainWindow.webContents.send('error_xml_export_fail');
  }
});

ipcMain.on('export_json', function (event, args) {
  console.log("Exporting report to JSON.");
  let coverage_data = {
    "coveron_report": {
      "file": {
        "filename": analyzer_main.cid_data['source_code_path'],
        "source_code_hash": analyzer_main.cid_data['source_code_hash'],
        "execution_count": analyzer_main.cid_data['recorded_executions'],
        "coverage": {
          "function": {
            "all_count": analyzer_main.cid_data['code_data']['executed_functions'] + analyzer_main.cid_data['code_data']['unexecuted_functions'],
            "executed": analyzer_main.cid_data['code_data']['executed_functions'],
            "coverage": (analyzer_main.cid_data['code_data']['executed_functions'] / (analyzer_main.cid_data['code_data']['executed_functions'] + analyzer_main.cid_data['code_data']['unexecuted_functions']))
          },
          "statement": {
            "all_count": analyzer_main.cid_data['code_data']['executed_statements'] + analyzer_main.cid_data['code_data']['unexecuted_statements'],
            "executed": analyzer_main.cid_data['code_data']['executed_statements'],
            "coverage": (analyzer_main.cid_data['code_data']['executed_statements'] / (analyzer_main.cid_data['code_data']['executed_statements'] + analyzer_main.cid_data['code_data']['unexecuted_statements']))
          },
          "branch": {
            "all_count": analyzer_main.cid_data['code_data']['taken_branches'] + analyzer_main.cid_data['code_data']['nottaken_branches'],
            "taken": analyzer_main.cid_data['code_data']['taken_branches'],
            "coverage": (analyzer_main.cid_data['code_data']['taken_branches'] / (analyzer_main.cid_data['code_data']['taken_branches'] + analyzer_main.cid_data['code_data']['nottaken_branches'])),
          },
          "mcdc": {
            "all_count": analyzer_main.cid_data['code_data']['evaluated_mcdc'] + analyzer_main.cid_data['code_data']['notevaluated_mcdc'],
            "evaluated": analyzer_main.cid_data['code_data']['evaluated_mcdc'],
            "coverage": (analyzer_main.cid_data['code_data']['evaluated_mcdc'] / (analyzer_main.cid_data['code_data']['evaluated_mcdc'] + analyzer_main.cid_data['code_data']['notevaluated_mcdc']))
          }
        }
      }
    }
  }
  let json_data = JSON.stringify(coverage_data, null, 2);
  let output_filepath = dialog.showSaveDialogSync({ title: "Store JSON report", filters: [{ name: "JSON file", extensions: ["json"] }], defaultPath: "coverage_output.json" });
  try {
    fs.writeFileSync(output_filepath, json_data);
  } catch {
    mainWindow.webContents.send('error_json_export_fail');
  }
});

ipcMain.on('export_csv', function (event, args) {
  console.log("Exporting report to CSV.");
  let coverage_data = {
    "filename": analyzer_main.cid_data['source_code_path'],
    "execution_count": analyzer_main.cid_data['recorded_executions'],
    "function_all_count": analyzer_main.cid_data['code_data']['executed_functions'] + analyzer_main.cid_data['code_data']['unexecuted_functions'],
    "function_executed": analyzer_main.cid_data['code_data']['executed_functions'],
    "function_coverage": (analyzer_main.cid_data['code_data']['executed_functions'] / (analyzer_main.cid_data['code_data']['executed_functions'] + analyzer_main.cid_data['code_data']['unexecuted_functions'])),
    "statement_all_count": analyzer_main.cid_data['code_data']['executed_statements'] + analyzer_main.cid_data['code_data']['unexecuted_statements'],
    "statement_executed": analyzer_main.cid_data['code_data']['executed_statements'],
    "statement_coverage": (analyzer_main.cid_data['code_data']['executed_statements'] / (analyzer_main.cid_data['code_data']['executed_statements'] + analyzer_main.cid_data['code_data']['unexecuted_statements'])),
    "branch_all_count": analyzer_main.cid_data['code_data']['taken_branches'] + analyzer_main.cid_data['code_data']['nottaken_branches'],
    "branch_taken": analyzer_main.cid_data['code_data']['taken_branches'],
    "branch_coverage": (analyzer_main.cid_data['code_data']['taken_branches'] / (analyzer_main.cid_data['code_data']['taken_branches'] + analyzer_main.cid_data['code_data']['nottaken_branches'])),
    "mcdc_all_count": analyzer_main.cid_data['code_data']['evaluated_mcdc'] + analyzer_main.cid_data['code_data']['notevaluated_mcdc'],
    "mcdc_evaluated": analyzer_main.cid_data['code_data']['evaluated_mcdc'],
    "mcdc_coverage": (analyzer_main.cid_data['code_data']['evaluated_mcdc'] / (analyzer_main.cid_data['code_data']['evaluated_mcdc'] + analyzer_main.cid_data['code_data']['notevaluated_mcdc'])),
  }

  let line1 = ""
  let line2 = ""

  Object.keys(coverage_data).forEach((key, value) => {
    line1 += "\"" + key + "\","
    line2 += "\"" + coverage_data[key] + "\","
  });

  line1 = line1.slice(0, line1.length - 1);
  line2 = line2.slice(0, line2.length - 1);

  let output_filepath = dialog.showSaveDialogSync({ title: "Store CSV report", filters: [{ name: "CSV file", extensions: ["csv"] }], defaultPath: "coverage_output.csv" });
  try {
    fs.writeFileSync(output_filepath, line1 + "\n" + line2);
  } catch {
    mainWindow.webContents.send('error_csv_export_fail');
  }
});
