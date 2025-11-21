import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { IonContent } from '@ionic/angular/standalone';
import { IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { add } from 'ionicons/icons';


@Component({
  standalone: true,
  selector: 'app-my-pantry',
  templateUrl: './my-pantry.page.html',
  styleUrls: ['./my-pantry.page.scss'],
  imports: [IonContent, CommonModule, FormsModule, AppToolbarComponent, IonFab, IonFabButton, IonIcon]
})
export class MyPantryPage {
  constructor(private router: Router) { }

  public add = add;

  goToAddItem() {
    this.router.navigate(['/tabs/add-item']);
  }
}
