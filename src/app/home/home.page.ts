import { Component } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { MenuController } from '@ionic/angular';
import { DataStoreService } from '../data-store.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  // selector for active segment
  active_source_viewer_segment = "overview";

  source_code: string[] = [
    'int main() {',
    '    return 0;',
    '}',
    'int main() {',
    '    return 0;',
    '}',
    'int main() {',
    '    return 0;',
    '}',
    'int main() {',
    '    return 0;',
    '}',
    'int main() {',
    '    return 0;',
    '}',
    'int main() {',
    '    return 0;',
    '}',
    'int main() {',
    '    return 0;',
    '}',
    'int main() {',
    '    return 0;',
    '}',
    'int main() {',
    '    return 0;',
    '}',
    'int main() {',
    '    return 0;',
    '}'
  ]

  constructor(private dataStore: DataStoreService) {
  }

  segmentChanged(ev) {
    // console.log(this.active_source_viewer_segment);
  }


}
