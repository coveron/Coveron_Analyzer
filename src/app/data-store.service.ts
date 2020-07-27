import { Injectable, ApplicationRef } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {

  // input information
  file_loaded = false;
  source_file_name = null;
  original_source_file_found = null;
  current_version_tested = null;
  cid_data = null;

  public cid_data_changed = new Subject<object>();


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
      console.log("Received source filename");
      context.source_file_name = args['source_file_name'];
      app.tick();
    });

    this.electronSvc.ipcRenderer.on("report_info_original_source_file_found", function (event, args) {
      console.log("Received 'original source file found' bool");
      context.original_source_file_found = args['original_source_file_found'];
      app.tick();
    });

    this.electronSvc.ipcRenderer.on("report_info_current_version_tested", function (event, args) {
      console.log("Received 'current version tested' bool");
      context.current_version_tested = args['current_version_tested'];
      app.tick();
    });

    this.electronSvc.ipcRenderer.on("report_info_cid_data", function (event, args) {
      console.log("Received CID data");
      context.cid_data = args['cid_data'];
      context.cid_data_changed.next();
      app.tick();
    });
  }
}
