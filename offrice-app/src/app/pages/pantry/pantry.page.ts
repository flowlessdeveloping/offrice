import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonIcon,
  IonText,
  IonButton,
  AlertController,
  ToastController,
  LoadingController // <--- Aggiungi questo
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fastFood, person, bagAddOutline, close } from 'ionicons/icons'; // Aggiunto 'close'
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { ProductItemService } from 'src/app/services/product-item.service';
import { ReservationService } from 'src/app/services/reservation.service';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-pantry',
  templateUrl: './pantry.page.html',
  styleUrls: ['./pantry.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    AppToolbarComponent,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonIcon,
    IonButton
  ]
})
export class PantryPage implements OnInit {
  pantryItems: any[] = [];
  isLoading = false;
  currentUserId: string | null = null;

  fastFood = fastFood;
  person = person;
  bagAddOutline = bagAddOutline;
  close = close; // Espongo icona close

  constructor(
    private productService: ProductItemService,
    private reservationService: ReservationService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController // <--- Inject
  ) {
    addIcons({ fastFood, person, bagAddOutline, close });
  }

  ngOnInit() {
    this.checkUser();
    this.loadPantryItems();
  }

  ionViewWillEnter() {
    this.checkUser();
    this.loadPantryItems();
  }

  checkUser() {
    const auth = getAuth();
    this.currentUserId = auth.currentUser ? auth.currentUser.uid : null;
  }

  loadPantryItems() {
    this.isLoading = true;

    this.productService.getAllItems().subscribe({
      next: (items) => {
        // DEBUG: Guarda nella console del browser per vedere i campi reali dei tuoi oggetti
        console.log('Oggetti scaricati dal DB:', items);

        this.pantryItems = items
          .map((item: any) => {
            // Cerchiamo l'ID proprietario in tutti i campi possibili
            const ownerId = item.uid || item.userId || item.ownerId || item.creatorId;

            return {
              id: item.id,
              name: item.productName,
              imageUrl: (item.images && item.images.length > 0) ? item.images[0] : null,
              ownerFirstName: item.ownerFirstName,
              ownerLastName: item.ownerLastName,
              ownerUid: ownerId, // Campo normalizzato
              quantity: Number(item.quantity),
              unit: item.unit,
              description: item.description
            };
          })
          .filter(item => item.quantity > 0);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento della dispensa:', err);
        this.isLoading = false;
      }
    });
  }

  async reserveItem(item: any) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      this.showToast('Devi essere loggato per prenotare.', 'danger');
      return;
    }

    // BLOCCO DI SICUREZZA: Se sono il proprietario, blocco tutto.
    if (item.ownerUid === user.uid) {
      this.showToast('Non puoi prenotare un oggetto che hai messo tu in dispensa!', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: `Prenota ${item.name}`,
      message: `Disponibili: ${item.quantity} ${item.unit}. Quanto vuoi prenotare?`,
      cssClass: 'custom-reservation-alert',
      inputs: [
        {
          name: 'quantity',
          type: 'number',
          placeholder: 'Quantità',
          min: 1,
          max: item.quantity,
          cssClass: 'custom-alert-input'
        }
      ],
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Prenota',
          cssClass: 'alert-button-confirm',
          handler: async (data) => {
            const qty = Number(data.quantity);
            if (!qty || qty <= 0) {
              this.showToast('Inserisci una quantità valida.', 'warning');
              return false;
            }
            if (qty > item.quantity) {
              this.showToast('Quantità superiore alla disponibilità.', 'warning');
              return false;
            }

            // Procedi con la prenotazione
            await this.processReservation(user, item, qty);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async processReservation(user: any, item: any, qty: number) {
    // Mostra Loading
    const loading = await this.loadingController.create({
      message: 'Prenotazione in corso...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const userInfo = {
        uid: user.uid,
        firstName: user.displayName?.split(' ')[0] || 'Utente',
        lastName: user.displayName?.split(' ')[1] || ''
      };

      await this.reservationService.reserveItem(userInfo, item, qty);

      this.showToast('Prenotazione effettuata con successo!', 'success');
      this.loadPantryItems();

    } catch (error) {
      console.error(error);
      this.showToast('Errore durante la prenotazione.', 'danger');
    } finally {
      // Nascondi Loading
      await loading.dismiss();
    }
  }

  async showToast(msg: string, type: 'success' | 'danger' | 'warning') {
    let cssClass = 'custom-toast';

    if (type === 'success') cssClass += ' custom-toast-success';
    else if (type === 'danger') cssClass += ' custom-toast-error';
    else if (type === 'warning') cssClass += ' custom-toast-warning';

    const toast = await this.toastController.create({
      message: msg,
      duration: 2500,
      color: 'light', // <--- IMPORTANTE: Usa 'light' o 'white' per evitare sfondi colorati forzati
      position: 'top',
      cssClass: cssClass,
      buttons: [
        {
          icon: 'close',
          role: 'cancel',
          handler: () => { console.log('Toast chiuso'); }
        }
      ]
    });
    toast.present();
  }
}
