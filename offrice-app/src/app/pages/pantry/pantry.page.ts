import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';

@Component({
  selector: 'app-pantry',
  templateUrl: './pantry.page.html',
  styleUrls: ['./pantry.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, AppToolbarComponent]
})
export class PantryPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
