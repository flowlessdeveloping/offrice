import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonFabButton, IonFab, IonCard, IonCardContent, IonList, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonTextarea, IonButton, IonSpinner, IonText } from '@ionic/angular/standalone';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { arrowBackCircle } from 'ionicons/icons';
import { Router } from '@angular/router';
import { ProductItem, QuantityUnit, ItemStatus } from 'src/app/model'; // <-- aggiunti i modelli
import { ProductItemService } from 'src/app/services/product-item.service';
import { AuthService } from 'src/app/services/auth.service';

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
    IonIcon,
    IonFab,
    IonFabButton,
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
    IonText
    // rimosso IonDatetime perché non serve più
  ]
})
export class AddItemPage implements OnInit {

  public arrowBackCircle = arrowBackCircle;

  // nuovo stato locale per il form (rimosse images, expiryDate, ownerFirstName, ownerLastName, tags)
  public units = Object.values(QuantityUnit);
  public itemForm: Partial<ProductItem> = {
    productName: '',
    quantity: 0,
    unit: QuantityUnit.GRAM,
    description: ''
    // tags non gestito nel form per ora
  };

  public saving = false;
  public errorMessage = '';

  constructor(private router: Router, private productItemService: ProductItemService, private auth: AuthService) { }

  ngOnInit() {
  }

  goToDashboard() {
    this.router.navigate(['/my-pantry']);
  }

  // semplice validazione e creazione oggetto ProductItem
  async saveItem() {
    this.errorMessage = '';
    // recupera utente autenticato
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
      const uid = this.auth.getUserId(); // ownerId opzionale
      const rawPayload: Partial<ProductItem> = {
        ownerId: uid || undefined,
        ownerFirstName: ownerFirstName,
        ownerLastName: ownerLastName,
        productName: this.itemForm.productName!.trim(),
        quantity: this.itemForm.quantity!,
        unit: this.itemForm.unit || QuantityUnit.GRAM,
        description: this.itemForm.description,
        // tags removed from payload (kept in models for future)
        location: this.itemForm.location,
        status: ItemStatus.AVAILABLE
        // createdAt sarà impostato dal servizio (serverTimestamp)
      };

      // remove undefined fields to avoid Firestore error
      const payload: Record<string, any> = { ...rawPayload };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) {
          delete payload[k];
        }
      });

      console.log('Payload inviato a Firestore:', payload);
      await this.productItemService.addItem(payload as Partial<ProductItem>);
      // breve feedback e navigazione
      console.log('Nuovo item creato su Firestore', payload);
      this.router.navigate(['/my-pantry']);
    } catch (err) {
      console.error(err);
      this.errorMessage = 'Errore durante il salvataggio. Riprova.';
    } finally {
      this.saving = false;
    }
  }

}
