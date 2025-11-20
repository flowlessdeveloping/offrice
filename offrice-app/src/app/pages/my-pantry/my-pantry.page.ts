import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { IonContent } from '@ionic/angular/standalone';


@Component({
  selector: 'app-my-pantry',
  templateUrl: './my-pantry.page.html',
  styleUrls: ['./my-pantry.page.scss'],
  imports: [IonContent, CommonModule, FormsModule, AppToolbarComponent]
})
export class MyPantryPage {
  constructor() { }
}
