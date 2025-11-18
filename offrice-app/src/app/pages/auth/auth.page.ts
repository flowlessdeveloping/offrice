import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [AppToolbarComponent, IonButton, IonContent],
})
export class AuthPage implements OnInit {
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.checkPersistedLogin();
  }

  private checkPersistedLogin() {
    // aspetta il primo evento non-null dall'auth (se l'utente è già loggato)
    this.authService.getCurrentUser()
      .pipe(
        filter(user => !!user), // passa solo se c'è un utente
        take(1)                 // prende solo il primo e completa
      )
      .subscribe(() => {
        this.router.navigate(['/tabs/pantry']);
      });
  }

  async googleSignIn() {
    this.loading = true;
    this.errorMessage = '';

    try {
      await this.authService.googleSignIn();
      this.router.navigate(['/tabs/pantry']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Errore durante l\'accesso con Google';
    } finally {
      this.loading = false;
    }
  }
}
