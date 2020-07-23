import { Injectable, ApplicationRef } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {

  // input information
  file_loaded = false;
  source_file_name = null;
  original_source_file_found = null;
  current_version_tested = null;
  cri_data = null;

  constructor(private electronSvc: ElectronService, private app: ApplicationRef) {
    let context = this;

    this.electronSvc.ipcRenderer.on("report_closed", function (event, args) {
      console.log("Report closed");
      context.file_loaded = false;
      app.tick();
    });

    this.electronSvc.ipcRenderer.on("report_opened", function (event, args) {
      console.log("Report opened");
      context.file_loaded = true;
      app.tick();
    });

    this.electronSvc.ipcRenderer.on("report_info_source_file_name", function (event, args) {
      context.source_file_name = args['source_file_name'];
      app.tick();
    });

    this.electronSvc.ipcRenderer.on("report_info_original_source_file_found", function (event, args) {
      context.original_source_file_found = args['original_source_file_found'];
      app.tick();
    });

    this.electronSvc.ipcRenderer.on("report_info_current_version_tested", function (event, args) {
      context.current_version_tested = args['current_version_tested'];
      app.tick();
    });

    this.electronSvc.ipcRenderer.on("report_info_cri_data", function (event, args) {
      context.cri_data = args['cri_data'];
      app.tick();
    });
  }
}
