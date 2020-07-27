import { Component } from '@angular/core';
import { Plugins } from '@capacitor/core';

import { Platform, MenuController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { ElectronService } from 'ngx-electron';
import { DataStoreService } from './data-store.service';
import { BackendErrorNotifierService } from './backend-error-notifier.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {

  isWindows: boolean = false
  electronWindow: Electron.BrowserWindow = null

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private electronSvc: ElectronService,
    private menuCtrl: MenuController,
    private dataStore: DataStoreService,
    private backendErrorNotifier: BackendErrorNotifierService
  ) {
    this.initializeApp();

    // try electron actions
    try {
      // get electronWindow
      this.electronWindow = this.electronSvc.remote.getCurrentWindow();
    } catch (e) {
      console.log("Electron environment not found!");
    }
  }

  minimizeApp() {
    this.electronWindow.minimize();
  }

  maximizeApp() {
    this.electronWindow.maximize();
  }

  restoreApp() {
    this.electronWindow.restore();
  }

  closeApp() {
    this.electronWindow.close();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  openFile() {
    document.getElementById("file-opener").click();
  }

  openFileHandler() {
    let files = (<HTMLInputElement>document.getElementById("file-opener")).files;
    if (files.length == 1) {
      let filename = files[0].path;

      console.log(filename);

      this.electronSvc.ipcRenderer.send("load_report", { filename: filename });

      (<HTMLInputElement>document.getElementById("file-opener")).value = "";
    }
  }

  closeFile() {
    this.electronSvc.ipcRenderer.send("close_report", null);
  }

  openGitHub() {
    this.electronSvc.shell.openExternal("https://github.com/coveron");
  }

  openWebsite() {
    this.electronSvc.shell.openExternal("https://coveron.github.io");
  }

  exportXML() {
    this.electronSvc.ipcRenderer.send("export_xml");
  }

  exportJSON() {
    this.electronSvc.ipcRenderer.send("export_json");
  }

  exportCSV() {
    this.electronSvc.ipcRenderer.send("export_csv");
  }
}
