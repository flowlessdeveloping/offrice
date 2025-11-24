import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonButton,
    IonIcon,
    IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, personCircle } from 'ionicons/icons';
import { getAuth, signOut, User } from 'firebase/auth';
import { AppToolbarComponent } from 'src/app/shared/app-toolbar/app-toolbar.component';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonList,
        IonItem,
        IonLabel,
        IonAvatar,
        IonButton,
        IonIcon,
        IonText,
        AppToolbarComponent
    ]
})
export class ProfilePage implements OnInit {
    user: User | null = null;

    constructor(private router: Router) {
        addIcons({ logOutOutline, personCircle });
    }

    ngOnInit() {
        const auth = getAuth();
        this.user = auth.currentUser;
    }

    async logout() {
        const auth = getAuth();
        try {
            await signOut(auth);
            this.router.navigate(['/auth'], { replaceUrl: true });
        } catch (error) {
            console.error('Errore durante il logout:', error);
        }
    }
}
