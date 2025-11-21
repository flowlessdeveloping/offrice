import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Aggiungi ToastController agli import
import { IonContent, IonCard, IonCardContent, IonList, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonTextarea, IonButton, IonSpinner, IonText, IonIcon, ToastController } from '@ionic/angular/standalone';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { arrowBackCircle, camera } from 'ionicons/icons';
import { Router } from '@angular/router';
import { ProductItem, QuantityUnit, ItemStatus } from 'src/app/model';
import { ProductItemService } from 'src/app/services/product-item.service';
import { AuthService } from 'src/app/services/auth.service';
import { PhotoService } from 'src/app/services/photo.service';

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.page.html',
  styleUrls: ['./add-item.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    AppToolbarComponent,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonGrid,
    IonRow,
    IonCol,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonButton,
    IonSpinner,
    IonText,
    IonIcon
    // ToastController non va qui negli imports, ma è un provider (già incluso in Ionic)
  ]
})
export class AddItemPage implements OnInit {

  public arrowBackCircle = arrowBackCircle;
  public camera = camera;

  public units = Object.values(QuantityUnit);
  public tempImage: string | undefined;

  // Definisco lo stato iniziale per poterlo resettare facilmente
  private initialFormState: Partial<ProductItem> = {
    productName: '',
    quantity: 0,
    unit: QuantityUnit.GRAM,
    description: '',
    location: ''
  };

  // Inizializzo il form copiando lo stato iniziale
  public itemForm: Partial<ProductItem> = { ...this.initialFormState };

  public saving = false;
  public errorMessage = '';

  private photoService = inject(PhotoService);
  // Inietta il ToastController
  private toastController = inject(ToastController);

  constructor(private router: Router, private productItemService: ProductItemService, private auth: AuthService) { }

  ngOnInit() {
  }

  goToDashboard() {
    this.router.navigate(['/tabs/my-pantry']);
  }

  async addPhoto() {
    try {
      const image = await this.photoService.takePhoto();
      if (image.base64String) {
        this.tempImage = 'data:image/jpeg;base64,' + image.base64String;
      }
    } catch (error) {
      console.log('Nessuna foto selezionata o errore camera', error);
    }
  }

  async saveItem() {
    this.errorMessage = '';
    const authUser = this.auth.getCurrentUserValue();

    if (!authUser) {
      this.errorMessage = 'Devi essere autenticato per condividere un elemento.';
      return;
    }

    let ownerFirstName = '';
    let ownerLastName = '';
    const dn = (authUser.displayName || '').trim();
    if (dn) {
      const parts = dn.split(/\s+/);
      ownerFirstName = parts.shift() || '';
      ownerLastName = parts.join(' ') || '';
    } else if (authUser.email) {
      ownerFirstName = authUser.email.split('@')[0];
    }

    if (!this.itemForm.productName || !this.itemForm.quantity || this.itemForm.quantity <= 0) {
      this.errorMessage = 'Compila i campi obbligatori: prodotto e quantità (>0).';
      return;
    }

    this.saving = true;
    try {
      const uid = this.auth.getUserId();

      let imageUrl = '';
      if (this.tempImage) {
        imageUrl = await this.photoService.uploadImage(this.tempImage);
      }

      const rawPayload: Partial<ProductItem> = {
        ownerId: uid || undefined,
        ownerFirstName: ownerFirstName,
        ownerLastName: ownerLastName,
        productName: this.itemForm.productName!.trim(),
        quantity: this.itemForm.quantity!,
        unit: this.itemForm.unit || QuantityUnit.GRAM,
        description: this.itemForm.description,
        images: imageUrl ? [imageUrl] : [],
        location: this.itemForm.location,
        status: ItemStatus.AVAILABLE
      };

      const payload: Record<string, any> = { ...rawPayload };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) {
          delete payload[k];
        }
      });

      await this.productItemService.addItem(payload as Partial<ProductItem>);

      // 1. Mostra il messaggio di successo
      await this.presentToast('Prodotto caricato con successo!');

      // 2. Resetta il form e l'immagine
      this.resetForm();

      // 3. Naviga alla dashboard
      this.router.navigate(['/tabs/my-pantry']);

    } catch (err) {
      console.error(err);
      this.errorMessage = 'Errore durante il salvataggio. Riprova.';
    } finally {
      this.saving = false;
    }
  }

  // Funzione helper per resettare tutto
  private resetForm() {
    this.itemForm = { ...this.initialFormState };
    this.tempImage = undefined;
    this.errorMessage = '';
  }

  // Funzione helper per mostrare il Toast
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000, // Durata del toast in millisecondi
      position: 'top' // Posizione del toast
    });
    await toast.present();
  }

}
