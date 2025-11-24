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
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; // Importante per le icone
import { fastFood, person } from 'ionicons/icons'; // Icone necessarie
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { ProductItemService } from 'src/app/services/product-item.service';

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
    IonText
  ]
})
export class PantryPage implements OnInit {
  pantryItems: any[] = [];
  isLoading = false;

  // Espongo le icone al template
  fastFood = fastFood;
  person = person;

  constructor(private productService: ProductItemService) {
    addIcons({ fastFood, person });
  }

  ngOnInit() {
    this.loadPantryItems();
  }

  ionViewWillEnter() {
    this.loadPantryItems();
  }

  loadPantryItems() {
    this.isLoading = true;

    this.productService.getAllItems().subscribe({
      next: (items) => {
        this.pantryItems = items.map(item => ({
          id: item.id,
          name: item.productName,
          imageUrl: (item.images && item.images.length > 0) ? item.images[0] : null,
          ownerFirstName: item.ownerFirstName,
          ownerLastName: item.ownerLastName,
          quantity: item.quantity,
          unit: item.unit,
          description: item.description
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento della dispensa:', err);
        this.isLoading = false;
      }
    });
  }
}
