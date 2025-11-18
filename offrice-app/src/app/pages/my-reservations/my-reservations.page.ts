import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';

@Component({
  selector: 'app-my-reservations',
  templateUrl: './my-reservations.page.html',
  styleUrls: ['./my-reservations.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, AppToolbarComponent]
})
export class MyReservationsPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
