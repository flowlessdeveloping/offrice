import { Component, OnInit, OnDestroy, inject } from '@angular/core'; // Aggiungi OnDestroy
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonButton, IonFab, IonFabButton, IonIcon,
  IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonThumbnail,
  IonItemSliding, IonItemOptions, IonItemOption, IonText, IonSpinner,
  AlertController, ToastController, ViewWillEnter, ActionSheetController
} from '@ionic/angular/standalone';
import { add, trash, create, pricetag, fastFood, ellipsisVertical, close } from 'ionicons/icons';
import { Router } from '@angular/router';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { ProductItemService } from 'src/app/services/product-item.service';
import { AuthService } from 'src/app/services/auth.service';
import { ProductItem } from 'src/app/model';
import { Unsubscribe } from 'firebase/firestore'; // Importa il tipo Unsubscribe
import { MyReservationsPage } from '../my-reservations/my-reservations.page';

@Component({
  selector: 'app-my-pantry',
  templateUrl: './my-pantry.page.html',
  styleUrls: ['./my-pantry.page.scss'],
  standalone: true,
  imports: [
    IonContent, CommonModule, FormsModule, AppToolbarComponent,
    IonFab, IonFabButton, IonIcon, IonSegment, IonSegmentButton, IonLabel,
    IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption,
    IonSpinner, IonButton, MyReservationsPage
  ]
})
export class MyPantryPage implements OnInit, ViewWillEnter, OnDestroy { // Aggiungi OnDestroy

  public add = add;
  public trash = trash;
  public create = create;
  public pricetag = pricetag;
  public fastFood = fastFood;
  public ellipsisVertical = ellipsisVertical;
  public close = close;

  public currentView: 'pantry' | 'reservations' = 'pantry';
  public myItems: ProductItem[] = [];
  public isLoading = true;

  private productService = inject(ProductItemService);
  private auth = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);
  private actionSheetCtrl = inject(ActionSheetController);

  // Variabile per memorizzare la funzione di stop del listener
  private itemsUnsubscribe: Unsubscribe | null = null;

  constructor() { }

  ngOnInit() {
    // ngOnInit viene chiamato solo una volta alla creazione.
    // Lasciamo il caricamento a ionViewWillEnter per gestire i ritorni.
  }

  // Questo metodo viene eseguito OGNI VOLTA che la pagina diventa visibile
  ionViewWillEnter() {
    // Se siamo sulla tab dispensa, ricarica i dati
    if (this.currentView === 'pantry') {
      this.startListening();
    }
  }

  // Quando cambi tab o esci dalla pagina
  ionViewWillLeave() {
    this.stopListening();
  }

  // Quando il componente viene distrutto definitivamente
  ngOnDestroy() {
    this.stopListening();
  }

  startListening() {
    // Se c'è già un ascolto attivo, non ne creare un altro
    if (this.itemsUnsubscribe) return;

    this.isLoading = true;
    const uid = this.auth.getUserId();

    if (uid) {
      // Ci abboniamo alle modifiche
      this.itemsUnsubscribe = this.productService.subscribeToMyItems(uid, (items) => {
        // Questa funzione viene chiamata AUTOMATICAMENTE ogni volta che il DB cambia
        this.myItems = items;
        this.isLoading = false;
        console.log('Lista aggiornata in tempo reale!', items.length);
      });
    } else {
      this.isLoading = false;
    }
  }

  stopListening() {
    if (this.itemsUnsubscribe) {
      this.itemsUnsubscribe(); // Ferma l'ascolto di Firebase
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
      // Non serve più: this.myItems = this.myItems.filter(...) 
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
          cssClass: 'action-sheet-edit-btn', // Classe personalizzata per il colore blu
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
}
