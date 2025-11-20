import { QuantityUnit } from './quantity-unit.enum';

export interface Reservation {
    id: string;
    itemId: string;
    userId: string;
    quantity: number;
    unit: QuantityUnit;
    createdAt: string; // ISO date
}
