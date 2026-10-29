import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { LinkApiService } from './link-api.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: LinkApiService,
          useValue: { getLinks: () => of([]), createLink: () => of({}) },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the Snip link form and collection', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Long link.');
    expect(compiled.querySelector('input[name="url"]')).toBeTruthy();
    expect(compiled.querySelector('#links-title')?.textContent).toContain('Recent links');
  });
});
