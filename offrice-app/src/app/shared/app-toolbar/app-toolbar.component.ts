import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton } from '@ionic/angular/standalone';
import { AuthStateService } from '../../services/auth-state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-toolbar',
  templateUrl: './app-toolbar.component.html',
  styleUrls: ['./app-toolbar.component.scss'],
  imports: [IonHeader, IonTitle, IonToolbar, CommonModule]
})
export class AppToolbarComponent implements OnInit {
  @Input() title: string = 'Offrice';
  @Input() showProfileIcon: boolean = true;

  constructor(private authStateService: AuthStateService, private router: Router) { }

  ngOnInit() {
    this.authStateService.isLoggedIn$.subscribe(isLoggedIn => {
      this.showProfileIcon = isLoggedIn;
    });
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
