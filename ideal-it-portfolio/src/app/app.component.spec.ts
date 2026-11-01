import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('exposes direct category links in the shared navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('a[href="/desarrollos"]')).not.toBeNull();
    expect(element.querySelector('a[href="/aplicaciones"]')).not.toBeNull();
    expect(element.querySelector('a[href="/paginas-comerciales"]')).not.toBeNull();
    expect(element.querySelector('button[aria-controls="primary-navigation"]')).not.toBeNull();
  });
});
