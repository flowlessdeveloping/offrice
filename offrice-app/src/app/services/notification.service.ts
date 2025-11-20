import { Injectable } from '@angular/core';
import { FirebaseInitService } from './firebase-init.service';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { Notification } from 'src/app/model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private col = collection(this.fb.db, 'notifications');

  constructor(private fb: FirebaseInitService) {}

  async sendNotification(notification: Partial<Notification>) {
    const data = {
      ...notification,
      createdAt: serverTimestamp(),
      read: false
    };
    return addDoc(this.col, data);
  }

  async listNotificationsForUser(userId: string) {
    const q = query(this.col, where('userId', '==', userId));
    return getDocs(q);
  }

  listenForUser(userId: string, cb: (snap: any) => void) {
    const q = query(this.col, where('userId', '==', userId));
    return onSnapshot(q, cb);
  }

  async markRead(notificationId: string, read = true) {
    const ref = doc(this.fb.db, 'notifications', notificationId);
    return updateDoc(ref, { read });
  }
}
