import { Injectable } from '@angular/core';
import { FirebaseInitService } from './firebase-init.service';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  updateDoc,
  Unsubscribe // Assicurati di importare Unsubscribe
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

  // Recupera un singolo prodotto tramite ID
  async getItemById(id: string): Promise<ProductItem | undefined> {
    const docRef = doc(this.fb.db, `items/${id}`); // Usa 'items' come collezione
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ProductItem;
    } else {
      return undefined;
    }
  }

  // Aggiorna un prodotto esistente
  async updateItem(id: string, data: Partial<ProductItem>): Promise<void> {
    const docRef = doc(this.fb.db, `items/${id}`);
    await updateDoc(docRef, data);
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

  // Metodo Real-time: Ascolta i cambiamenti e avvisa la pagina
  subscribeToMyItems(userId: string, callback: (items: ProductItem[]) => void): Unsubscribe {
    const q = query(
      this.col,
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // onSnapshot attiva la callback ogni volta che i dati cambiano
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data() as ProductItem;
        return { ...data, id: doc.id };
      });
      callback(items);
    }, (error) => {
      console.error("Errore listener:", error);
      // Fallback in caso di errore indice
      if (error.code === 'failed-precondition') {
        console.warn('Manca indice, riprova a creare indice dal link in console');
      }
    });
  }

}
