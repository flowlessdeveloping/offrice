import { QuantityUnit } from './quantity-unit.enum';
import { ItemStatus } from './item-status.enum';
import { Reservation } from './reservation.model';

export interface ProductItem {
    id: string;
    ownerId?: string;
    ownerFirstName: string;
    ownerLastName: string;
    productName: string;
    quantity: number;
    unit: QuantityUnit;
    description?: string;
    tags?: string[];
    images?: string[]; // url o base64
    location?: string; // es. "Cucina piano 1"
    expiryDate?: string; // ISO date opzionale
    createdAt: string; // ISO date
    status: ItemStatus;
    reservations?: Reservation[];
}
