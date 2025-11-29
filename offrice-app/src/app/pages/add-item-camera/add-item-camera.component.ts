import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonImg, IonSpinner, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonTextarea, ModalController, LoadingController, ToastController
} from '@ionic/angular/standalone';
import { PhotoService } from 'src/app/services/photo.service';
import { ProductItemService } from 'src/app/services/product-item.service';
import { AuthService } from 'src/app/services/auth.service';
import { QuantityUnit, ItemStatus } from 'src/app/model';
import { close, camera, checkmark } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-add-item-camera',
  templateUrl: './add-item-camera.component.html',
  styleUrls: ['./add-item-camera.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonImg, IonSpinner, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonTextarea
  ]
})
export class AddItemCameraComponent implements OnInit {

  image: string | undefined;
  isAnalyzing = false;
  analysisComplete = false;

  // Form dati
  itemData = {
    productName: '',
    quantity: 1,
    unit: QuantityUnit.PIECE,
    description: '',
    location: ''
  };

  units = Object.values(QuantityUnit);

  constructor(
    private modalController: ModalController,
    private photoService: PhotoService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private productService: ProductItemService,
    private auth: AuthService
  ) {
    addIcons({ close, camera, checkmark });
  }

  ngOnInit() {
    // Avvia subito la fotocamera quando si apre la modale
    this.takePhoto();
  }

  async takePhoto() {
    try {
      const photo = await this.photoService.takePhoto();
      if (photo.base64String) {
        this.image = 'data:image/jpeg;base64,' + photo.base64String;
        this.analyzeImage(this.image);
      } else {
        // Se l'utente annulla, chiudi la modale o mostra un messaggio
        this.closeModal();
      }
    } catch (e) {
      console.error('Errore fotocamera', e);
      this.closeModal();
    }
  }

  async analyzeImage(base64Image: string) {
    this.isAnalyzing = true;

    // --- QUI VA LA CHIAMATA ALL'IA ---
    // Simuliamo una chiamata API per ora
    // In produzione, chiameresti una Cloud Function o un servizio backend che usa OpenAI/Google Vision

    try {
      // SIMULAZIONE RITARDO
      await new Promise(resolve => setTimeout(resolve, 2000));

      // SIMULAZIONE RISPOSTA IA (Sostituisci con logica reale)
      // Esempio: L'IA riconosce una mela
      this.itemData = {
        productName: 'Mela Rossa',
        quantity: 1, // L'IA potrebbe contare gli oggetti
        unit: QuantityUnit.PIECE,
        description: 'Mela fresca rilevata da fotocamera',
        location: ''
      };

      this.analysisComplete = true;

    } catch (error) {
      console.error('Errore analisi IA', error);
      this.showToast('Impossibile analizzare l\'immagine.', 'danger');
    } finally {
      this.isAnalyzing = false;
    }
  }

  async confirmAndSave() {
    if (!this.itemData.productName) {
      this.showToast('Il nome del prodotto è obbligatorio.', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Salvataggio...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const user = this.auth.getCurrentUserValue();
      if (!user) throw new Error('Utente non loggato');

      // 1. Carica immagine su Cloudinary (se necessario)
      let imageUrl = '';
      if (this.image) {
        imageUrl = await this.photoService.uploadImage(this.image);
      }

      // 2. Prepara payload
      const payload = {
        ...this.itemData,
        images: imageUrl ? [imageUrl] : [],
        ownerId: user.uid,
        ownerFirstName: user.displayName?.split(' ')[0] || 'Utente',
        ownerLastName: user.displayName?.split(' ')[1] || '',
        status: ItemStatus.AVAILABLE,
        createdAt: new Date().toISOString()
      };

      // 3. Salva su Firestore
      await this.productService.addItem(payload);

      this.showToast('Prodotto aggiunto con successo!', 'success');
      this.modalController.dismiss(true); // Ritorna true per indicare successo

    } catch (error) {
      console.error('Errore salvataggio', error);
      this.showToast('Errore durante il salvataggio.', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  closeModal() {
    this.modalController.dismiss();
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}
