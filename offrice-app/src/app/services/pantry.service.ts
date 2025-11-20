import { Injectable } from '@angular/core';
import { FirebaseInitService } from './firebase-init.service';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { Pantry } from 'src/app/model';

@Injectable({ providedIn: 'root' })
export class PantryService {
  private col = collection(this.fb.db, 'pantries');

  constructor(private fb: FirebaseInitService) {}

  async createPantry(p: Partial<Pantry>) {
    return addDoc(this.col, p);
  }

  async updatePantry(id: string, data: Partial<Pantry>) {
    const ref = doc(this.fb.db, 'pantries', id);
    return updateDoc(ref, data);
  }

  async deletePantry(id: string) {
    const ref = doc(this.fb.db, 'pantries', id);
    return deleteDoc(ref);
  }

  async getPantry(id: string) {
    const ref = doc(this.fb.db, 'pantries', id);
    return getDoc(ref);
  }

  listenAll(cb: (snap: any) => void) {
    return onSnapshot(this.col, cb);
  }
}
