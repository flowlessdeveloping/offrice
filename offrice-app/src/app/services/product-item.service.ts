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
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { ProductItem } from 'src/app/model';

@Injectable({ providedIn: 'root' })
export class ProductItemService {
  private col = collection(this.fb.db, 'items');

  constructor(private fb: FirebaseInitService) {}

  async addItem(item: Partial<ProductItem>) {
    const data = {
      ...item,
      createdAt: serverTimestamp(),
    };
    return addDoc(this.col, data);
  }

  async updateItem(id: string, data: Partial<ProductItem>) {
    const ref = doc(this.fb.db, 'items', id);
    return updateDoc(ref, data);
  }

  async deleteItem(id: string) {
    const ref = doc(this.fb.db, 'items', id);
    return deleteDoc(ref);
  }

  async getItemById(id: string) {
    const ref = doc(this.fb.db, 'items', id);
    return getDoc(ref);
  }

  async queryAvailable() {
    const q = query(this.col, where('status', '==', 'available'));
    return getDocs(q);
  }

  // real-time listener example: all items in a pantry
  listenItemsForPantry(pantryId: string, cb: (snap: any) => void) {
    const q = query(this.col, where('location', '==', pantryId));
    return onSnapshot(q, cb);
  }
}
