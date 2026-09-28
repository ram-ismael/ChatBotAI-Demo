import { Component, inject, signal } from '@angular/core';
import { UiPreferencesService } from './core/services/ui-preferences.service';
import { UiStateService } from './core/services/ui-state.service';
import { TopbarComponent } from './components/topbar.component';
import { BusinessSelectorComponent } from './components/business-selector.component';
import { SidebarNavComponent } from './components/sidebar-nav.component';
import { ChatWindowComponent } from './components/chat-window.component';
import { DashboardComponent } from './components/dashboard.component';
import { IconComponent } from './shared/icons';

@Component({
  selector: 'app-root',
  imports: [
    TopbarComponent,
    BusinessSelectorComponent,
    SidebarNavComponent,
    ChatWindowComponent,
    DashboardComponent,
    IconComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly prefs = inject(UiPreferencesService);
  protected readonly ui = inject(UiStateService);
  protected readonly year = signal(new Date().getFullYear());
}
