import { Injectable } from '@angular/core';
import { FirebaseInitService } from './firebase-init.service';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { User } from 'src/app/model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private col = collection(this.fb.db, 'users');

  constructor(private fb: FirebaseInitService) {}

  // create or overwrite profile
  async createOrUpdateUser(uid: string, data: Partial<User>) {
    const ref = doc(this.fb.db, 'users', uid);
    return setDoc(ref, data, { merge: true });
  }

  async getUser(uid: string) {
    const ref = doc(this.fb.db, 'users', uid);
    return getDoc(ref);
  }

  async updateUser(uid: string, data: Partial<User>) {
    const ref = doc(this.fb.db, 'users', uid);
    return updateDoc(ref, data);
  }
}
