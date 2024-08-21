export interface PaginationInterface<T> {
    content: T;
    total: number;
    totalPages: number
}