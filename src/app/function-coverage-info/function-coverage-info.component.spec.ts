import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FunctionCoverageInfoComponent } from './function-coverage-info.component';

describe('FunctionCoverageInfoComponent', () => {
  let component: FunctionCoverageInfoComponent;
  let fixture: ComponentFixture<FunctionCoverageInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FunctionCoverageInfoComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FunctionCoverageInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
