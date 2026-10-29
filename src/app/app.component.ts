import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { LinkApiService, LinkRecord } from './link-api.service';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './snip.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly api = inject(LinkApiService);

  readonly links = signal<LinkRecord[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly listError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly createdLink = signal<LinkRecord | null>(null);

  ngOnInit(): void {
    this.loadLinks();
  }

  createLink(event: SubmitEvent, input: HTMLInputElement): void {
    event.preventDefault();
    this.formError.set(null);
    this.createdLink.set(null);

    const enteredUrl = input.value.trim();
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(enteredUrl);
    } catch {
      this.formError.set('Enter a complete URL starting with http:// or https://.');
      return;
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      this.formError.set('Only http:// and https:// links can be shortened.');
      return;
    }

    this.isSubmitting.set(true);
    this.api.createLink(parsedUrl.href).subscribe({
      next: (link) => {
        this.links.update((currentLinks) => [
          link,
          ...currentLinks.filter((currentLink) => currentLink.code !== link.code),
        ]);
        this.listError.set(null);
        this.createdLink.set(link);
        this.isSubmitting.set(false);
        input.value = '';
      },
      error: (error: unknown) => {
        this.formError.set(this.getErrorMessage(error));
        this.isSubmitting.set(false);
      },
    });
  }

  private loadLinks(): void {
    this.api.getLinks().subscribe({
      next: (links) => {
        this.links.set(links);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.listError.set(this.getErrorMessage(error));
        this.isLoading.set(false);
      },
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Could not reach the Snip backend at localhost:3000.';
      }

      const serverMessage = (error.error as { error?: unknown } | null)?.error;
      if (typeof serverMessage === 'string') return serverMessage;
      return `The request failed with status ${error.status}.`;
    }

    return 'Something went wrong. Please try again.';
  }
}
