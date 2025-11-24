import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonCard, IonCardContent, IonList, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonTextarea, IonButton, IonSpinner, IonText, IonIcon, ToastController } from '@ionic/angular/standalone';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { arrowBackCircle, camera } from 'ionicons/icons';
import { Router, ActivatedRoute } from '@angular/router';
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
  ]
})
export class AddItemPage implements OnInit {

  public arrowBackCircle = arrowBackCircle;
  public camera = camera;

  public units = Object.values(QuantityUnit);
  public tempImage: string | undefined;

  // --- VARIABILI MANCANTI AGGIUNTE QUI ---
  public pageTitle = 'Nuovo Prodotto';
  public isEditing = false;
  private itemId: string | null = null;
  // ---------------------------------------

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
  private toastController = inject(ToastController);
  private route = inject(ActivatedRoute);

  constructor(private router: Router, private productItemService: ProductItemService, private auth: AuthService) { }

  ngOnInit() {
    // Controlla se ci sono parametri nell'URL
    this.route.queryParams.subscribe(async params => {
      if (params['id']) {
        // MODALITÀ MODIFICA
        this.itemId = params['id'];
        this.isEditing = true;
        this.pageTitle = 'Modifica Prodotto';
        await this.loadItemData(this.itemId!);
      } else {
        // MODALITÀ CREAZIONE (Reset)
        this.resetForm();
      }
    });
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

  // Carica i dati dal DB e riempie il form
  async loadItemData(id: string) {
    this.saving = true;
    try {
      const item = await this.productItemService.getItemById(id);
      if (item) {
        // Popola il form
        this.itemForm = {
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          description: item.description || '',
          location: item.location || ''
        };

        // Gestione Immagine
        if (item.images && item.images.length > 0) {
          this.tempImage = item.images[0];
        }
      }
    } catch (error) {
      console.error(error);
      this.presentToast('Errore nel caricamento del prodotto.');
    } finally {
      this.saving = false;
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
      // Gestione Immagine (Upload solo se è cambiata ed è base64)
      let imageUrl = '';

      // Se c'è un'immagine
      if (this.tempImage) {
        // Se inizia con 'http', è un URL già esistente (non ricompriamo)
        if (this.tempImage.startsWith('http')) {
          imageUrl = this.tempImage;
        } else {
          // Altrimenti è base64, carichiamo su Cloudinary
          imageUrl = await this.photoService.uploadImage(this.tempImage);
        }
      }

      // Prepara il payload base
      const payload: Partial<ProductItem> = {
        productName: this.itemForm.productName!.trim(),
        quantity: this.itemForm.quantity!,
        unit: this.itemForm.unit || QuantityUnit.GRAM,
        description: this.itemForm.description,
        images: imageUrl ? [imageUrl] : [],
        location: this.itemForm.location,
      };

      if (this.isEditing && this.itemId) {
        // --- AGGIORNAMENTO ---
        await this.productItemService.updateItem(this.itemId, payload);
        await this.presentToast('Prodotto aggiornato!');
      } else {
        // --- CREAZIONE ---
        const uid = this.auth.getUserId();

        const createPayload = {
          ...payload,
          ownerId: uid || undefined,
          ownerFirstName: ownerFirstName,
          ownerLastName: ownerLastName,
          status: ItemStatus.AVAILABLE,
          // CORREZIONE QUI: Converti Date in stringa ISO
          createdAt: new Date().toISOString()
        };

        await this.productItemService.addItem(createPayload);
        await this.presentToast('Prodotto creato!');
      }

      this.resetForm();
      this.router.navigate(['/tabs/my-pantry']);

    } catch (err) {
      console.error(err);
      this.errorMessage = 'Errore durante il salvataggio.';
    } finally {
      this.saving = false;
    }
  }

  private resetForm() {
    this.isEditing = false;
    this.itemId = null;
    this.pageTitle = 'Nuovo Prodotto';
    this.itemForm = { ...this.initialFormState };
    this.tempImage = undefined;
    this.errorMessage = '';
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }
}
