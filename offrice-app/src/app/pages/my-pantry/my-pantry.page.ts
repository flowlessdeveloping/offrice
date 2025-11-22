import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonButton, IonFab, IonFabButton, IonIcon,
  IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonThumbnail,
  IonItemSliding, IonItemOptions, IonItemOption, IonText, IonSpinner,
  AlertController, ToastController, ViewWillEnter
} from '@ionic/angular/standalone';
import { add, trash, create, pricetag, fastFood, ellipsisVertical } from 'ionicons/icons'; // <--- Aggiungi ellipsisVertical
import { Router } from '@angular/router';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { ProductItemService } from 'src/app/services/product-item.service';
import { AuthService } from 'src/app/services/auth.service';
import { ProductItem } from 'src/app/model';

// Se hai già il componente prenotazioni importalo, altrimenti lascia stare per ora
// import { MyReservationsComponent } from ...

@Component({
  selector: 'app-my-pantry',
  templateUrl: './my-pantry.page.html',
  styleUrls: ['./my-pantry.page.scss'],
  standalone: true,
  imports: [
    IonContent, CommonModule, FormsModule, AppToolbarComponent,
    IonFab, IonFabButton, IonIcon, IonSegment, IonSegmentButton, IonLabel,
    IonList, IonItem, IonThumbnail, IonItemSliding, IonItemOptions, IonItemOption,
    IonText, IonSpinner, IonButton
    // Aggiungi qui MyReservationsComponent quando lo avrai
  ]
})
export class MyPantryPage implements OnInit, ViewWillEnter {

  public add = add;
  public trash = trash;
  public create = create;
  public pricetag = pricetag;
  public fastFood = fastFood;
  public ellipsisVertical = ellipsisVertical; // <--- Aggiungi questa riga

  // Gestisce quale tab è attiva: 'pantry' o 'reservations'
  public currentView: 'pantry' | 'reservations' = 'pantry';

  public myItems: ProductItem[] = [];
  public isLoading = true;

  private productService = inject(ProductItemService);
  private auth = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  constructor() { }

  ngOnInit() {
    // Caricamento iniziale
  }

  // ViewWillEnter viene chiamato ogni volta che la pagina diventa visibile
  // Utile per ricaricare la lista se torni dalla pagina "Aggiungi"
  ionViewWillEnter() {
    if (this.currentView === 'pantry') {
      this.loadMyItems();
    }
  }

  async loadMyItems() {
    this.isLoading = true;
    const uid = this.auth.getUserId();
    if (uid) {
      this.myItems = await this.productService.getMyItems(uid);
    }
    this.isLoading = false;
  }

  goToAddItem() {
    this.router.navigate(['/add-item']);
  }

  // Funzione per modificare (per ora solo log)
  editItem(item: ProductItem) {
    console.log('Modifica item:', item);
    // In futuro: this.router.navigate(['/edit-item', item.id]);
    this.presentToast('Funzionalità modifica in arrivo!');
  }

  // Funzione per eliminare con conferma
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
      // Rimuovi localmente dalla lista per non ricaricare tutto
      this.myItems = this.myItems.filter(i => i.id !== item.id);
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
}
