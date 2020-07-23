import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class BackendErrorNotifierService {

  constructor(private electronSvc: ElectronService,
    private alertCtrl: AlertController) {

    let context = this;

    this.electronSvc.ipcRenderer.on("error_cri_not_fitting_to_cid", function (event, args) {
      console.log("Backend error: CRI not fitting to CID");
      context.error_cri_not_fitting_to_cid();
    });

    this.electronSvc.ipcRenderer.on("error_cid_not_openable", function (event, args) {
      console.log("Backend error: CID is not openable");
      context.error_cid_not_openable();
    });

    this.electronSvc.ipcRenderer.on("error_cri_not_openable", function (event, args) {
      console.log("Backend error: CRI not openable");
      context.error_cri_not_openable();
    });

  }

  async error_cri_not_fitting_to_cid() {
    const alert = await this.alertCtrl.create({
      header: 'CRI file not fitting to CID file',
      message: 'Coveron found a runtime information file, but it\'s not fitting to the given instrumentation data file.\n\nTry running the executable again.',
      buttons: ['Cancel']
    });

    await alert.present();
  }

  async error_cid_not_openable() {
    const alert = await this.alertCtrl.create({
      header: 'CID file couldn\'t be opened',
      message: 'Coveron found a instrumentation data file, but could\'t open it.',
      buttons: ['Cancel']
    });

    await alert.present();
  }

  async error_cri_not_openable() {
    const alert = await this.alertCtrl.create({
      header: 'CRI file couldn\'t be opened',
      message: 'Coveron couldn\'t open or find the runtime information file.',
      buttons: ['Cancel']
    });

    await alert.present();
  }

}
