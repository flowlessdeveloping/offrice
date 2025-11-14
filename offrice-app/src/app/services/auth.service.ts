import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth!: Auth;
  private currentUser$ = new BehaviorSubject<User | null>(null);

  constructor() {
    // Inizializzare Firebase con la configurazione da environment
    initializeApp(environment.firebaseConfig);
    
    // Ottenere l'istanza di auth DOPO initializeApp
    this.auth = getAuth();

    // Monitorare i cambiamenti di autenticazione
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser$.next(user);
    });
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signup(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  googleSignIn() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  logout() {
    return signOut(this.auth);
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  getCurrentUserValue(): User | null {
    return this.currentUser$.value;
  }

  isAuthenticated(): boolean {
    return this.currentUser$.value !== null;
  }
}
