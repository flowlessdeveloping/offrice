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
   * Crea o aggiorna una prenotazione e aggiorna la quantità dell'oggetto.
   */
  async reserveItem(
    user: { uid: string; firstName: string; lastName: string },
    item: { id: string; name: string; unit: string },
    quantityToReserve: number
  ) {
    const itemRef = doc(this.fb.db, 'items', item.id);

    // Query per cercare prenotazione esistente
    const existingResQuery = query(
      this.col,
      where('itemId', '==', item.id),
      where('reservedByUid', '==', user.uid),
      where('status', '==', 'active') // Assumiamo che solo le attive contino
    );

    try {
      await runTransaction(this.fb.db, async (transaction) => {
        // 1. Leggi il documento dell'oggetto
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists()) {
          throw new Error("L'oggetto non esiste più!");
        }

        const currentQty = Number(itemDoc.data()['quantity']);
        if (currentQty < quantityToReserve) {
          throw new Error("Quantità non sufficiente disponibile!");
        }

        // 2. Cerca prenotazione esistente (dobbiamo eseguire la query prima della transazione o usare getDocs dentro, 
        // ma getDocs non è supportato direttamente in transaction.get(). 
        // Tuttavia, per coerenza, possiamo leggere la query PRIMA della transazione, 
        // ma per sicurezza atomica dovremmo leggere dentro.
        // Firestore transaction non supporta query. Quindi dobbiamo leggere il doc se conosciamo l'ID, 
        // oppure accettare un piccolo rischio di race condition o strutturare diversamente (es. ID prenotazione deterministico).

        // SOLUZIONE MIGLIORE: Usare un ID deterministico per la prenotazione: `reservation_${itemId}_${userId}`
        const reservationId = `res_${item.id}_${user.uid}`;
        const reservationRef = doc(this.fb.db, 'reservations', reservationId);
        const reservationDoc = await transaction.get(reservationRef);

        const newItemQty = currentQty - quantityToReserve;

        if (reservationDoc.exists()) {
          // AGGIORNA ESISTENTE
          const currentResQty = Number(reservationDoc.data()['quantity']);
          const newResQty = currentResQty + quantityToReserve;

          transaction.update(reservationRef, {
            quantity: newResQty,
            updatedAt: serverTimestamp()
          });
        } else {
          // CREA NUOVA
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
          transaction.set(reservationRef, reservationData);
        }

        // Aggiorna quantità item
        transaction.update(itemRef, { quantity: newItemQty });
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
