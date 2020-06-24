import { Component } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

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

  constructor(private electronSvc: ElectronService) {
  }


}
