import { Component } from '@angular/core';

import { Platform, MenuController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { ElectronService } from 'ngx-electron';

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
    private menuCtrl: MenuController
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
}
