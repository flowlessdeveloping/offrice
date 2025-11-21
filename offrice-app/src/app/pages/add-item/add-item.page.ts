import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonCard, IonCardContent, IonList, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonTextarea, IonButton, IonSpinner, IonText, IonIcon } from '@ionic/angular/standalone';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { arrowBackCircle, camera } from 'ionicons/icons';
import { Router } from '@angular/router';
import { ProductItem, QuantityUnit, ItemStatus } from 'src/app/model';
import { ProductItemService } from 'src/app/services/product-item.service';
import { AuthService } from 'src/app/services/auth.service';
// Rimosse importazioni dirette di Camera e Storage
// Importa il nuovo servizio
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
  ]
})
export class AddItemPage implements OnInit {

  public arrowBackCircle = arrowBackCircle;
  public camera = camera;

  public units = Object.values(QuantityUnit);
  public tempImage: string | undefined;

  public itemForm: Partial<ProductItem> = {
    productName: '',
    quantity: 0,
    unit: QuantityUnit.GRAM,
    description: ''
  };

  public saving = false;
  public errorMessage = '';

  // Inietta il PhotoService invece di Storage direttamente
  private photoService = inject(PhotoService);

  constructor(private router: Router, private productItemService: ProductItemService, private auth: AuthService) { }

  ngOnInit() {
  }

  goToDashboard() {
    this.router.navigate(['/tabs/my-pantry']);
  }

  async addPhoto() {
    try {
      // Usa il servizio per scattare (la configurazione di compressione è centralizzata lì)
      const image = await this.photoService.takePhoto();

      if (image.base64String) {
        this.tempImage = 'data:image/jpeg;base64,' + image.base64String;
      }
    } catch (error) {
      console.log('Nessuna foto selezionata o errore camera', error);
    }
  }

  // Rimosso il metodo uploadImageToStorage (ora è nel servizio)

  async saveItem() {
    this.errorMessage = '';
    const authUser = this.auth.getCurrentUserValue();

    if (!authUser) {
      this.errorMessage = 'Devi essere autenticato per condividere un elemento.';
      return;
    }

    // estrai nome e cognome da displayName (fallback su email)
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

    // validazione minima: prodotto, quantità > 0
    if (!this.itemForm.productName || !this.itemForm.quantity || this.itemForm.quantity <= 0) {
      this.errorMessage = 'Compila i campi obbligatori: prodotto e quantità (>0).';
      console.warn('Campi obbligatori mancanti: productName, quantity');
      return;
    }

    this.saving = true;
    try {
      const uid = this.auth.getUserId();

      // 1. Se c'è un'immagine temporanea, caricala
      let imageUrl = '';
      if (this.tempImage) { // Non serve più controllare uid per il path
        // Rimuovi il secondo parametro 'path'
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
        // 2. Salva l'URL restituito da Storage
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

      console.log('Payload inviato a Firestore:', payload);
      await this.productItemService.addItem(payload as Partial<ProductItem>);

      console.log('Nuovo item creato su Firestore', payload);
      this.router.navigate(['/tabs/my-pantry']);
    } catch (err) {
      console.error(err);
      this.errorMessage = 'Errore durante il salvataggio. Riprova.';
    } finally {
      this.saving = false;
    }
  }

}
