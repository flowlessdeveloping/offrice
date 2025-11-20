import { Injectable } from '@angular/core';
import { FirebaseInitService } from './firebase-init.service';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { Reservation } from 'src/app/model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private col = collection(this.fb.db, 'reservations');

  constructor(private fb: FirebaseInitService) {}

  async addReservation(res: Partial<Reservation>) {
    const data = {
      ...res,
      createdAt: serverTimestamp()
    };
    return addDoc(this.col, data);
  }

  async cancelReservation(id: string) {
    const ref = doc(this.fb.db, 'reservations', id);
    return deleteDoc(ref);
  }

  async getReservationsForItem(itemId: string) {
    const q = query(this.col, where('itemId', '==', itemId));
    return getDocs(q);
  }

  listenReservationsForItem(itemId: string, cb: (snap: any) => void) {
    const q = query(this.col, where('itemId', '==', itemId));
    return onSnapshot(q, cb);
  }

  // helper to update item status (call from client after adding reservation if needed)
  async updateItemStatus(itemId: string, status: string) {
    const itemRef = doc(this.fb.db, 'items', itemId);
    return updateDoc(itemRef, { status });
  }
}
