import { Injectable } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseInitService {
  public app!: FirebaseApp;
  public db!: Firestore;
  public auth!: Auth;
  public storage!: FirebaseStorage;

  constructor() {
    // usa la config dal file environment
    const firebaseConfig = environment.firebaseConfig;

    if (!getApps().length) {
      this.app = initializeApp(firebaseConfig);
    } else {
      this.app = getApps()[0];
    }

    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.storage = getStorage(this.app);
  }
}
