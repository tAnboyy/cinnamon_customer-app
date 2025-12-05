export interface MenuItem {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image?: string;
    type?: 'menu' | 'catering';
}
