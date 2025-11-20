import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonFabButton } from '@ionic/angular/standalone';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';
import { arrowBackCircle } from 'ionicons/icons';
import { Router } from '@angular/router';


@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.page.html',
  styleUrls: ['./add-item.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, AppToolbarComponent, IonIcon, IonFabButton]
})
export class AddItemPage implements OnInit {

  public arrowBackCircle = arrowBackCircle;

  constructor(private router: Router) { }

  ngOnInit() {
  }

  goToDashboard() {
    this.router.navigate(['/my-pantry']);
  }

}
