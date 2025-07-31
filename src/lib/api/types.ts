export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
}

export interface ApiError {
    message: string;
    status: number;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    data: T[];
    limit: number;
    page: number;
    total: number;
}

export interface UsersResponse {
    data: User[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// User tipleri
export interface User {
    id: number;
    name: string;
    surname: string;
    email: string;
    phone_number: string;
    is_active: boolean;
    created_at: string;
    last_signin_at?: string;
    role: string;
}

export type LoginData = {
    [key: string]: unknown;
    email: string;
    password: string;
};

export type RegisterData = {
    [key: string]: unknown;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

// Integration tipleri
export interface IntegrationCredentials {
    url: string;
    username: string;
    application_password?: string;
    seo_plugin: string;
}

export interface Integration {
    id: number;
    integration_id?: number;
    name: string;
    credentials: IntegrationCredentials;
    site_type: string;
}

// Article tipleri
export interface Article {
    id: string;
    title: string;
    content: string;
    status: "pending" | "completed" | "rejected";
    integrations: {
        publish_status: boolean;
        site_url: string;
        publish_url: string;
    };
    word_count: number;
    language_code: string;
    article_type_name: string;
    model_name: string;
    created_at: string;
    updated_at: string;
}

// Image tipleri
export interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    created_at: string;
}

// Wordpress tipleri
export interface WordpressCategory {
    id: number;
    name: string;
    slug: string;
}

export interface WordpressTag {
    id: number;
    name: string;
    slug: string;
}

// Product tipleri
export interface Product {
    id: number;
    name: string;
    code?: string;
    purchase_price?: number;
    sale_price?: number;
    stock_quantity?: number;
    description?: string;
    image?: string;
    unit?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateProductData {
    name: string;
    code?: string;
    purchasePrice?: number;
    salePrice?: number;
    stockQuantity?: number;
    description?: string;
    image?: string;
    unit?: string;
    isActive?: boolean;
}

export interface UpdateProductData {
    name?: string;
    code?: string;
    purchasePrice?: number;
    salePrice?: number;
    stockQuantity?: number;
    description?: string;
    image?: string;
    unit?: string;
    isActive?: boolean;
}

// Warehouse (Depo) tipleri
export interface Warehouse {
    id: number;
    name: string;
}

// Product Stock Status tipleri - Product interface ile aynı field adlarını kullanıyor
export interface ProductStockStatus {
    id: number;
    name: string;
    code?: string | null;
    image?: string | null;
    warehouse_id: number;
    warehouse_name: string;
    stock_quantity: number;
}

export interface GroupedProductStock {
    productId: number;
    productName: string;
    productCode?: string;
    productImage?: string;
    warehouses: {
        warehouseId: number;
        warehouseName: string;
        quantity: number;
    }[];
}

export interface UpdateStockQuantityData {
    [key: string]: unknown;
    quantity: number;
    warehouseId: number;
}

// Customer tipleri
export interface Customer {
    id: number;
    user_id: number;
    name: string;
    email: string;
    phone_number?: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateCustomerData {
    name: string;
    email?: string;
    phoneNumber?: string;
    description?: string;
}

export interface UpdateCustomerData {
    name?: string;
    email?: string;
    phoneNumber?: string;
    description?: string;
    isActive?: boolean;
}

// Vehicle tipleri
export interface Vehicle {
    id: number;
    name: string;
    brand_model?: string;
    image?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateVehicleData {
    name: string;
    brandModel?: string;
    image?: string;
    isActive?: boolean;
}

export interface UpdateVehicleData {
    name?: string;
    brandModel?: string;
    image?: string;
    isActive?: boolean;
}

// Vehicle Parts tipleri
export interface VehiclePart {
    id: number;
    vehicle_id: number;
    product_ids: number[];
    quantities: Record<string, number>; // Her product ID için miktar bilgisi
    vehicle_name: string;
    products: Product[];
    created_at: string;
    updated_at: string;
}

export interface CreateVehiclePartData {
    vehicleId: number;
    productIds: number[];
    quantities?: Record<string, number>; // Her product ID için miktar bilgisi
}

export interface UpdateVehiclePartData {
    vehicleId?: number;
    productIds?: number[];
    quantities?: Record<string, number>; // Her product ID için miktar bilgisi
}

// Warehouse tipleri
export interface Warehouse {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateWarehouseData {
    name: string;
    description?: string;
    isActive?: boolean;
}

export interface UpdateWarehouseData {
    name?: string;
    description?: string;
    isActive?: boolean;
}

// Operation tipleri
export interface Operation {
    id: number;
    name: string;
    quality_control: boolean;
    target_duration?: number;
    is_active: boolean;
    created_by: number;
    updated_by: number;
    created_at: string;
    updated_at: string;
}

export interface CreateOperationData {
    name: string;
    qualityControl?: boolean;
    targetDuration?: number;
}

export interface UpdateOperationData {
    name?: string;
    qualityControl?: boolean;
    targetDuration?: number;
}

// Station tipleri
export interface Station {
    id: number;
    name: string;
    is_active: boolean;
    created_by: number;
    updated_by: number;
    created_at: string;
    updated_at: string;
    created_by_name?: string;
    updated_by_name?: string;
}

export interface CreateStationData {
    name: string;
}

export interface UpdateStationData {
    name?: string;
}

// Production Plan tipleri
export interface ProductionPlan {
    id: number;
    name: string;
    vehicle_id: number;
    vehicle_name: string;
    vehicle_brand_model?: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by_name?: string;
    updated_by_name?: string;
    stations?: ProductionPlanStation[];
}

export interface ProductionPlanStation {
    id: number;
    station_id: number;
    station_name: string;
    sort_order: number;
    operations: ProductionPlanOperation[];
}

export interface ProductionPlanOperation {
    id: number;
    operation_id: number;
    operation_name: string;
    quality_control: boolean;
    sort_order: number;
}

export interface CreateProductionPlanData {
    name: string;
    vehicleId: number;
    description?: string;
    stations: {
        stationId: number;
        operations: {
            operationId: number;
            sortOrder: number;
        }[];
    }[];
}

export interface UpdateProductionPlanData {
    name?: string;
    vehicleId?: number;
    description?: string;
    isActive?: boolean;
    stations?: {
        stationId: number;
        operations: {
            operationId: number;
            sortOrder: number;
        }[];
    }[];
}
