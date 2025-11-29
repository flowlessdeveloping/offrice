import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonButton, IonFab, IonFabButton, IonIcon,
  IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonFabList,
  IonItemSliding, IonItemOptions, IonItemOption, IonSpinner,
  AlertController, ToastController, ViewWillEnter, ActionSheetController, ModalController,
  IonRefresher, IonRefresherContent // <--- Aggiunti import Refresher
} from '@ionic/angular/standalone';
import { add, trash, create, pricetag, fastFood, ellipsisVertical, close, camera } from 'ionicons/icons'; // Aggiunto camera
import { Router } from '@angular/router';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { ProductItemService } from 'src/app/services/product-item.service';
import { AuthService } from 'src/app/services/auth.service';
import { ProductItem } from 'src/app/model';
import { Unsubscribe } from 'firebase/firestore';
import { MyReservationsPage } from '../my-reservations/my-reservations.page';
import { AddItemCameraComponent } from '../add-item-camera/add-item-camera.component';
import { addIcons } from 'ionicons'; // Import necessario per addIcons

@Component({
  selector: 'app-my-pantry',
  templateUrl: './my-pantry.page.html',
  styleUrls: ['./my-pantry.page.scss'],
  standalone: true,
  imports: [
    IonContent, CommonModule, FormsModule, AppToolbarComponent,
    IonFab, IonFabButton, IonIcon, IonSegment, IonSegmentButton, IonLabel,
    IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption,
    IonSpinner, IonButton, MyReservationsPage, IonFabList,
    IonRefresher, IonRefresherContent // <--- Aggiunti ai imports
  ]
})
export class MyPantryPage implements OnInit, ViewWillEnter, OnDestroy {

  public add = add;
  public trash = trash;
  public create = create;
  public pricetag = pricetag;
  public fastFood = fastFood;
  public ellipsisVertical = ellipsisVertical;
  public close = close;
  public camera = camera; // Espongo icona camera

  public currentView: 'pantry' | 'reservations' = 'pantry';
  public myItems: ProductItem[] = [];
  public isLoading = true;

  private productService = inject(ProductItemService);
  private auth = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);
  private actionSheetCtrl = inject(ActionSheetController);
  private modalController = inject(ModalController);

  private itemsUnsubscribe: Unsubscribe | null = null;

  constructor() {
    addIcons({ add, trash, create, pricetag, fastFood, ellipsisVertical, close, camera });
  }

  ngOnInit() {
    // ngOnInit viene chiamato solo una volta alla creazione.
  }

  ionViewWillEnter() {
    if (this.currentView === 'pantry') {
      this.startListening();
    }
  }

  ionViewWillLeave() {
    this.stopListening();
  }

  ngOnDestroy() {
    this.stopListening();
  }

  startListening() {
    if (this.itemsUnsubscribe) return;

    this.isLoading = true;
    const uid = this.auth.getUserId();

    if (uid) {
      this.itemsUnsubscribe = this.productService.subscribeToMyItems(uid, (items) => {
        this.myItems = items;
        this.isLoading = false;
      });
    } else {
      this.isLoading = false;
    }
  }

  stopListening() {
    if (this.itemsUnsubscribe) {
      this.itemsUnsubscribe();
      this.itemsUnsubscribe = null;
    }
  }

  goToAddItem() {
    this.router.navigate(['/add-item']);
  }

  editItem(item: ProductItem) {
    this.router.navigate(['/add-item'], { queryParams: { id: item.id } });
  }

  async confirmDelete(item: ProductItem) {
    const alert = await this.alertCtrl.create({
      header: 'Elimina prodotto',
      message: `Sei sicuro di voler eliminare "${item.productName}"?`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: () => this.deleteItem(item)
        }
      ]
    });
    await alert.present();
  }

  async deleteItem(item: ProductItem) {
    if (!item.id) return;
    try {
      await this.productService.deleteItem(item.id);
      this.presentToast('Prodotto eliminato.');
    } catch (error) {
      console.error(error);
      this.presentToast('Errore durante l\'eliminazione.');
    }
  }

  async presentToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  async openOptions(item: ProductItem) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: item.productName,
      buttons: [
        {
          text: 'Modifica',
          icon: this.create,
          handler: () => {
            this.editItem(item);
          }
        },
        {
          text: 'Elimina',
          role: 'destructive',
          icon: this.trash,
          handler: () => {
            this.confirmDelete(item);
          }
        },
        {
          text: 'Annulla',
          icon: this.close,
          role: 'cancel',
          handler: () => { }
        }
      ]
    });

    await actionSheet.present();
  }

  async openCameraScan() {
    const modal = await this.modalController.create({
      component: AddItemCameraComponent
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        // Se ritorna true, ricarica la lista.
        // Dato che usiamo un listener realtime, l'aggiornamento dovrebbe essere automatico,
        // ma per sicurezza possiamo forzare un riavvio del listener se necessario.
        // In questo caso, non serve fare nulla se il listener è attivo.
        if (!this.itemsUnsubscribe) {
          this.startListening();
        }
      }
    });

    return await modal.present();
  }

  // Metodo per il refresher manuale
  async handleRefresh(event: any) {
    // Ferma e riavvia il listener per forzare un refresh
    this.stopListening();
    this.startListening();

    // Simula un piccolo ritardo per UX
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
