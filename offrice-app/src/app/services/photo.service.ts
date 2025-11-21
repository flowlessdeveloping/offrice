import { Injectable, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PhotoService {
    private http = inject(HttpClient);

    // CONFIGURAZIONE CLOUDINARY
    private cloudName = 'IL_TUO_CLOUD_NAME'; // <--- INSERISCI QUI IL NOME (dalla dashboard)
    private uploadPreset = 'IL_TUO_PRESET';  // <--- INSERISCI QUI IL PRESET (es. offrice_preset)

    constructor() { }

    /**
     * Scatta una foto o la seleziona dalla galleria
     * applicando compressione e ridimensionamento.
     */
    async takePhoto(): Promise<Photo> {
        return await Camera.getPhoto({
            quality: 50,             // Compressione JPEG (0-100)
            width: 800,              // Larghezza massima in pixel
            height: 800,             // Altezza massima in pixel
            allowEditing: false,
            resultType: CameraResultType.Base64, // Cloudinary accetta base64
            source: CameraSource.Prompt // Chiede all'utente (Camera o Galleria)
        });
    }

    /**
     * Carica l'immagine su Cloudinary e ritorna l'URL
     */
    async uploadImage(base64Data: string): Promise<string> {
        const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

        const payload = {
            file: base64Data,
            upload_preset: this.uploadPreset
        };

        try {
            // Convertiamo l'Observable in Promise
            const response: any = await firstValueFrom(this.http.post(url, payload));
            return response.secure_url; // Ritorna l'URL pubblico HTTPS
        } catch (error) {
            console.error('Errore upload Cloudinary:', error);
            throw error;
        }
    }
}