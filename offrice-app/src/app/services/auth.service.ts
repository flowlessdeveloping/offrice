import { Injectable } from '@angular/core';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signInAnonymously
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';

import { FirebaseInitService } from './firebase-init.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth!: Auth;
  private currentUser$ = new BehaviorSubject<User | null>(null);

  constructor(private fb: FirebaseInitService) {
    // usa l'istanza Auth già inizializzata in FirebaseInitService
    this.auth = this.fb.auth;

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

  // nuovo: signin anonimo
  anonymousSignIn() {
    return signInAnonymously(this.auth);
  }

  // osservabile utente
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  getCurrentUserValue(): User | null {
    return this.currentUser$.value;
  }

  isAuthenticated(): boolean {
    return this.currentUser$.value !== null;
  }

  // nuovi helper utili
  getUserId(): string | null {
    return this.currentUser$.value ? this.currentUser$.value.uid : null;
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    const u = this.currentUser$.value;
    if (!u) return null;
    return u.getIdToken(forceRefresh);
  }

  // reset password
  sendPasswordReset(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  // invia verifica email all'utente corrente (se presente)
  sendEmailVerificationForCurrentUser() {
    const u = this.currentUser$.value;
    if (!u) return Promise.reject(new Error('No user'));
    return sendEmailVerification(u);
  }

  // aggiornamento profilo (displayName, photoURL)
  updateProfileData(data: { displayName?: string; photoURL?: string }) {
    const u = this.currentUser$.value;
    if (!u) return Promise.reject(new Error('No user'));
    return updateProfile(u, data);
  }

  // aggiornamento email (richiede reautenticazione in alcuni casi)
  updateUserEmail(newEmail: string) {
    const u = this.currentUser$.value;
    if (!u) return Promise.reject(new Error('No user'));
    return updateEmail(u, newEmail);
  }

  // aggiornamento password (richiede reautenticazione in alcuni casi)
  updateUserPassword(newPassword: string) {
    const u = this.currentUser$.value;
    if (!u) return Promise.reject(new Error('No user'));
    return updatePassword(u, newPassword);
  }

  // reautenticazione via email/password (utile prima di operazioni sensibili)
  reauthenticateWithEmail(currentEmail: string, currentPassword: string) {
    const u = this.currentUser$.value;
    if (!u) return Promise.reject(new Error('No user'));
    const cred = EmailAuthProvider.credential(currentEmail, currentPassword);
    return reauthenticateWithCredential(u, cred);
  }
}
