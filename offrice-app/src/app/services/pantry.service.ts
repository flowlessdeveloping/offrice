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
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PantryService {
  private col = collection(this.fb.db, 'pantries');

  constructor(private fb: FirebaseInitService) { }

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

  /**
   * Recupera tutti gli elementi della dispensa creati da tutti gli utenti.
   * Restituisce un Observable per l'aggiornamento in tempo reale.
   */
  getAllPantryItems(): Observable<any[]> {
    return new Observable((observer) => {
      // Usa la collezione 'pantries' già definita in this.col
      const unsubscribe = onSnapshot(this.col,
        (querySnapshot) => {
          const items = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          observer.next(items);
        },
        (error) => {
          observer.error(error);
        }
      );

      // Funzione di pulizia quando l'observable viene disiscritto
      return () => unsubscribe();
    });
  }
}
