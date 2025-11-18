import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  constructor(private authService: AuthService) {
    this.initializeAuthState();
  }

  private initializeAuthState() {
    // Sottoscrivi al cambio dell'utente corrente e aggiorna lo stato di login
    this.authService.getCurrentUser()
      .pipe(map(user => !!user))
      .subscribe(isLoggedIn => {
        this.isLoggedInSubject.next(isLoggedIn);
      });
  }
}
