import { TestBed } from '@angular/core/testing';

import { BackendErrorNotifierService } from './backend-error-notifier.service';

describe('BackendErrorNotifierService', () => {
  let service: BackendErrorNotifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackendErrorNotifierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
