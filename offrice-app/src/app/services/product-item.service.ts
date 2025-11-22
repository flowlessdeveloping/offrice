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
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { ProductItem } from 'src/app/model';

@Injectable({ providedIn: 'root' })
export class ProductItemService {
  private col = collection(this.fb.db, 'items');

  constructor(private fb: FirebaseInitService) { }

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

  // Recupera solo gli oggetti creati da uno specifico utente
  async getMyItems(userId: string): Promise<ProductItem[]> {
    try {
      // Usa this.col che punta già a 'items'
      // Oppure ricrealo se vuoi essere esplicito: collection(this.fb.db, 'items')

      // ATTENZIONE: Se questa query fallisce, controlla la console del browser per il link dell'indice
      const q = query(
        this.col, // Usa la collezione definita in alto ('items')
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data() as ProductItem;
        // Converti il timestamp se necessario, altrimenti ritorna i dati
        return { ...data, id: doc.id };
      });
    } catch (error: any) {
      console.error('Errore recupero miei oggetti:', error);

      // Se l'errore riguarda l'indice mancante, riprova senza ordinamento per test
      if (error.code === 'failed-precondition') {
        console.warn('Manca l\'indice Firestore! Provo a scaricare senza ordinamento...');
        // Riprova senza orderBy
        const qSimple = query(this.col, where('ownerId', '==', userId));
        const snap = await getDocs(qSimple);
        return snap.docs.map(doc => ({ ...doc.data() as ProductItem, id: doc.id }));
      }
      return [];
    }
  }

  // Metodo per eliminare un oggetto
  async deleteItem(itemId: string): Promise<void> {
    const docRef = doc(this.fb.db, `items/${itemId}`);
    await deleteDoc(docRef);
  }

}
