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
  serverTimestamp,
  runTransaction,
  orderBy // <--- Aggiunto import
} from 'firebase/firestore';
import { Reservation } from 'src/app/model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private col = collection(this.fb.db, 'reservations');

  constructor(private fb: FirebaseInitService) { }

  /**
   * Crea una prenotazione e aggiorna la quantità dell'oggetto.
   * Se la quantità scende a 0, l'oggetto viene aggiornato a 0 (e la UI lo nasconderà).
   */
  async reserveItem(
    user: { uid: string; firstName: string; lastName: string },
    item: { id: string; name: string; unit: string },
    quantityToReserve: number
  ) {
    const itemRef = doc(this.fb.db, 'items', item.id);
    const reservationRef = doc(collection(this.fb.db, 'reservations'));

    try {
      await runTransaction(this.fb.db, async (transaction) => {
        // 1. Leggi il documento dell'oggetto più recente
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists()) {
          throw new Error("L'oggetto non esiste più!");
        }

        const currentQty = Number(itemDoc.data()['quantity']);

        if (currentQty < quantityToReserve) {
          throw new Error("Quantità non sufficiente disponibile!");
        }

        const newQty = currentQty - quantityToReserve;

        // 2. Crea l'oggetto prenotazione
        const reservationData = {
          itemId: item.id,
          itemName: item.name,
          reservedByUid: user.uid,
          reservedByName: `${user.firstName} ${user.lastName}`,
          quantity: quantityToReserve,
          unit: item.unit,
          createdAt: serverTimestamp(),
          status: 'active'
        };

        // 3. Scrivi le modifiche
        transaction.set(reservationRef, reservationData);

        // Aggiorna la quantità. 
        // Nota: Se newQty è 0, l'oggetto rimane nel DB ma con qtà 0. 
        // La UI dovrà filtrare gli oggetti con qtà > 0.
        transaction.update(itemRef, { quantity: newQty });
      });

      return true;
    } catch (e) {
      console.error("Errore transazione prenotazione:", e);
      throw e;
    }
  }

  async addReservation(res: Partial<Reservation>) {
    const data = {
      ...res,
      createdAt: serverTimestamp()
    };
    return addDoc(this.col, data);
  }

  /**
   * Annulla una prenotazione e restituisce la quantità all'oggetto originale.
   */
  async cancelReservation(reservationId: string) {
    const reservationRef = doc(this.fb.db, 'reservations', reservationId);

    try {
      await runTransaction(this.fb.db, async (transaction) => {
        // 1. Leggi la prenotazione
        const resDoc = await transaction.get(reservationRef);
        if (!resDoc.exists()) {
          throw new Error("Prenotazione non trovata!");
        }

        const resData = resDoc.data();
        const itemId = resData['itemId'];
        const qtyToRestore = Number(resData['quantity']);

        // 2. Leggi l'item originale
        const itemRef = doc(this.fb.db, 'items', itemId);
        const itemDoc = await transaction.get(itemRef);

        if (itemDoc.exists()) {
          // Se l'item esiste ancora, aggiorna la quantità
          const currentQty = Number(itemDoc.data()['quantity']) || 0;
          const newQty = currentQty + qtyToRestore;
          transaction.update(itemRef, { quantity: newQty });
        } else {
          // Se l'item è stato eliminato dal proprietario, non possiamo restituire la quantità.
          // Possiamo decidere se bloccare l'annullamento o procedere solo cancellando la prenotazione.
          // Qui procediamo cancellando la prenotazione orfana.
          console.warn("L'oggetto originale non esiste più. Impossibile restituire la quantità.");
        }

        // 3. Elimina la prenotazione
        transaction.delete(reservationRef);
      });
    } catch (e) {
      console.error("Errore annullamento prenotazione:", e);
      throw e;
    }
  }

  async getReservationsForItem(itemId: string) {
    const q = query(this.col, where('itemId', '==', itemId));
    return getDocs(q);
  }

  listenReservationsForItem(itemId: string, cb: (snap: any) => void) {
    const q = query(this.col, where('itemId', '==', itemId));
    return onSnapshot(q, cb);
  }

  async updateItemStatus(itemId: string, status: string) {
    const itemRef = doc(this.fb.db, 'items', itemId);
    return updateDoc(itemRef, { status });
  }

  /**
   * Recupera la lista delle prenotazioni effettuate da un utente specifico.
   * Ordinate per data di creazione decrescente (più recenti prima).
   */
  async getReservationsByUser(userId: string) {
    // Nota: Se Firestore ti dà errore "requires an index", clicca sul link nella console per crearlo.
    const q = query(
      this.col,
      where('reservedByUid', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return getDocs(q);
  }
}
