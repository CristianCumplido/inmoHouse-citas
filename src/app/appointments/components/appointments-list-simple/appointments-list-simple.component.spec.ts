import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentsListSimpleComponent } from './appointments-list-simple.component';

describe('AppointmentsListSimpleComponent', () => {
  let component: AppointmentsListSimpleComponent;
  let fixture: ComponentFixture<AppointmentsListSimpleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AppointmentsListSimpleComponent]
    });
    fixture = TestBed.createComponent(AppointmentsListSimpleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
