import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonIcon,
  IonText,
  IonButton,
  IonBadge,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bagHandle, trashOutline, timeOutline, fastFood, close } from 'ionicons/icons'; // Aggiunto 'close'
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { ReservationService } from 'src/app/services/reservation.service';
import { getAuth } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-my-reservations',
  templateUrl: './my-reservations.page.html',
  styleUrls: ['./my-reservations.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonIcon,
    IonText,
    IonButton,
    IonBadge,
    AppToolbarComponent
  ]
})
export class MyReservationsPage implements OnInit {
  reservations: any[] = [];
  isLoading = false;

  bagHandle = bagHandle;
  trashOutline = trashOutline;
  timeOutline = timeOutline;
  fastFood = fastFood;
  close = close; // Espongo icona

  constructor(
    private reservationService: ReservationService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ bagHandle, trashOutline, timeOutline, fastFood, close }); // Aggiunto close
  }

  ngOnInit() {
    this.loadReservations();
  }

  ionViewWillEnter() {
    this.loadReservations();
  }

  async loadReservations() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    try {
      const snapshot = await this.reservationService.getReservationsByUser(user.uid);
      this.reservations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Converti Timestamp Firestore in Date JS per la pipe date
          createdAtDate: (data['createdAt'] as Timestamp)?.toDate()
        };
      });
    } catch (error) {
      console.error('Errore caricamento prenotazioni:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async cancelReservation(reservation: any) {
    const alert = await this.alertController.create({
      header: 'Annulla Prenotazione',
      message: `Vuoi davvero annullare la prenotazione di ${reservation.itemName}?`,
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sì, annulla',
          role: 'destructive',
          handler: async () => {
            try {
              await this.reservationService.cancelReservation(reservation.id);
              this.showToast('Prenotazione annullata.', 'success');
              this.loadReservations();
            } catch (e) {
              this.showToast('Errore durante la cancellazione.', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(msg: string, type: 'success' | 'danger' | 'warning') {
    let cssClass = 'custom-toast';

    if (type === 'success') cssClass += ' custom-toast-success';
    else if (type === 'danger') cssClass += ' custom-toast-error';
    else if (type === 'warning') cssClass += ' custom-toast-warning';

    const toast = await this.toastController.create({
      message: msg,
      duration: 2500,
      color: 'light', // Usa 'light' per sfondo bianco
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
