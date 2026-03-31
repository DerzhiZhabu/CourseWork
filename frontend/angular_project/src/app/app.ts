import {Component, inject} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {WA_LOCAL_STORAGE, WA_WINDOW} from '@ng-web-apis/common';
import {TUI_DARK_MODE, TUI_DARK_MODE_KEY, TuiRoot} from '@taiga-ui/core';
import {filter} from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  private readonly key = inject(TUI_DARK_MODE_KEY);
  private readonly storage = inject(WA_LOCAL_STORAGE);
  private readonly media = inject(WA_WINDOW).matchMedia('(prefers-color-scheme: dark)');
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly titleService = inject(Title);

  protected readonly darkMode = inject(TUI_DARK_MODE);

  constructor() {
    this.updateDocumentTitle();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateDocumentTitle();
      });
  }

  protected reset(): void {
    this.darkMode.set(this.media.matches);
    this.storage?.removeItem(this.key);
  }

  private updateDocumentTitle(): void {
    let route = this.activatedRoute;

    while (route.firstChild) {
      route = route.firstChild;
    }

    const pageTitle = route.snapshot.data['title'] as string | undefined;
    this.titleService.setTitle(pageTitle || 'Главная');
  }
}
