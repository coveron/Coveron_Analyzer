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

    this.electronSvc.ipcRenderer.on("error_xml_export_fail", function (event, args) {
      console.log("Backend error: XML export failed");
      context.error_xml_export_fail();
    });

    this.electronSvc.ipcRenderer.on("error_json_export_fail", function (event, args) {
      console.log("Backend error: JSON export failed");
      context.error_json_export_fail();
    });

    this.electronSvc.ipcRenderer.on("error_csv_export_fail", function (event, args) {
      console.log("Backend error: CSV export failed");
      context.error_csv_export_fail();
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

  async error_xml_export_fail() {
    const alert = await this.alertCtrl.create({
      header: 'XML export couldn\'t be created',
      message: 'Coveron couldn\'t create the XML output. Check, if you have sufficient permissions to modify the file.',
      buttons: ['Cancel']
    });

    await alert.present();
  }

  async error_json_export_fail() {
    const alert = await this.alertCtrl.create({
      header: 'JSON export couldn\'t be created',
      message: 'Coveron couldn\'t create the JSON output. Check, if you have sufficient permissions to modify the file.',
      buttons: ['Cancel']
    });

    await alert.present();
  }

  async error_csv_export_fail() {
    const alert = await this.alertCtrl.create({
      header: 'CSV export couldn\'t be created',
      message: 'Coveron couldn\'t create the CSV output. Check, if you have sufficient permissions to modify the file.',
      buttons: ['Cancel']
    });

    await alert.present();
  }

}
