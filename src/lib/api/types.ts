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
    allowed_menus?: string[]; // Kullanıcının erişebileceği menü ID'leri
    default_page?: string; // Kullanıcının varsayılan sayfası
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
export interface StationAuthorizedUser {
    id: number;
    name: string;
    surname: string;
    email: string;
}

export interface Station {
    id: number;
    name: string;
    is_active: boolean;
    authorized_users?: StationAuthorizedUser[];
    created_by: number;
    updated_by: number;
    created_at: string;
    updated_at: string;
    created_by_name?: string;
    updated_by_name?: string;
}

export interface CreateStationData {
    name: string;
    authorized_users?: number[];
}

export interface UpdateStationData {
    name?: string;
    authorized_users?: number[];
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

// Vehicle Acceptance tipleri
export interface DamageMarker {
    id?: number;
    x_coordinate: number;
    y_coordinate: number;
    marker_type: "dot" | "cross" | "line";
}

export interface VehicleFeature {
    celik_jant: boolean;
    garanti_belgesi: boolean;
    jant_kapagi: boolean;
    koltuk_kilifi: boolean;
    paspas: boolean;
    ruhsat: boolean;
    stepne: boolean;
    trafik_sigortasi: boolean;
    trafik_seti: boolean;
    yangin_tupu: boolean;
    yedek_anahtar: boolean;
    zincir: boolean;
    kriko: boolean;
}

export interface VehicleAcceptance {
    id?: number;
    date: string;
    plate_number: string;
    entry_km?: number;
    exit_km?: number;
    tse_entry_datetime?: string;
    tse_exit_datetime?: string;
    delivery_date?: string;
    description?: string;
    fuel_level: number;
    features: VehicleFeature;
    damage_markers: DamageMarker[];
    created_at?: string;
    updated_at?: string;
    created_by?: number;
    created_by_name?: string; // backward compatibility
    created_user?: string; // concatenated name + surname from backend list query
}

export interface CreateVehicleAcceptanceData {
    date: string;
    plate_number: string;
    entry_km?: number;
    exit_km?: number;
    tse_entry_datetime?: string;
    tse_exit_datetime?: string;
    delivery_date?: string;
    description?: string;
    fuel_level: number;
    features: VehicleFeature;
    damage_markers: DamageMarker[];
}

export interface UpdateVehicleAcceptanceData {
    date?: string;
    plate_number?: string;
    entry_km?: number;
    exit_km?: number;
    tse_entry_datetime?: string;
    tse_exit_datetime?: string;
    delivery_date?: string;
    description?: string;
    fuel_level?: number;
    features?: Partial<VehicleFeature>;
    damage_markers?: DamageMarker[];
    status?: "active" | "completed" | "cancelled";
}

// Production Operation tipleri
export type ProductionStatus =
    | "pending"
    | "in_progress"
    | "completed"
    | "paused"
    | "error"
    | "awaiting_quality_control";

export interface ProductionOperation {
    id: number;
    name: string;
    plan_name: string;
    customer_name?: string;
    vehicle_name: string;
    station_name: string;
    offer_number?: string;
    status: ProductionStatus;
    progress: number;
    elapsed_time: number; // dakika cinsinden
    target_time: number; // dakika cinsinden
    target_duration_formatted?: string; // okunabilir format (örn: "1 saat 20 dk")
    start_time?: string;
    end_time?: string;
    assigned_worker_ids?: number[]; // Atanmış usta ID'leri
    quality_control?: boolean;
    quality_check_passed?: boolean | null;
    production_number?: number;
    created_at: string;
    updated_at: string;
}

export interface UpdateProductionOperationData {
    status?: ProductionStatus;
    progress?: number;
    elapsed_time?: number;
    end_time?: string;
}

// Operation Pause tipleri
export interface OperationPause {
    id: number;
    operation_id: number;
    paused_by: number;
    paused_by_name?: string;
    paused_by_surname?: string;
    pause_reason?: string;
    pause_time: string;
    resume_time?: string;
    duration_minutes?: number;
    created_at: string;
    updated_at: string;
}

// Production Execution tipleri
export type ProductionExecutionStatus = "idle" | "running" | "paused" | "completed" | "cancelled";
export type OperationExecutionStatus =
    | "pending"
    | "in_progress"
    | "completed"
    | "paused"
    | "skipped"
    | "awaiting_quality_control";

export interface ProductionExecution {
    id: number;
    production_plan_id: number;
    offer_id?: number;
    customer_id?: number;
    vehicle_acceptance_id?: number;
    status: ProductionExecutionStatus;
    started_at?: string;
    paused_at?: string;
    completed_at?: string;
    cancelled_at?: string;
    total_duration?: number;
    description?: string;
    number?: number;
    created_at: string;
    updated_at: string;
    created_by: number;
    updated_by?: number;
    // JOIN'den gelen veriler - listeleme için optimize edilmiş
    production_plan_name?: string;
    vehicle_id?: number;
    vehicle_name?: string;
    vehicle_brand_model?: string;
    customer_name?: string;
    customer_email?: string;
    offer_number?: string;
    offer_total_amount?: number;
    plate_number?: string;
    acceptance_date?: string;
    created_by_name?: string;
    total_operations?: number;
    completed_operations?: number;
    in_progress_operations?: number;
    pending_operations?: number;
    progress_percentage?: number;
    operations?: ProductionExecutionOperation[];
}

export interface ProductionExecutionOperation {
    id: number;
    production_execution_id: number;
    station_id: number;
    operation_id: number;
    original_operation_id?: number;
    original_station_id?: number;
    sort_order: number;
    status: OperationExecutionStatus;
    start_time?: string;
    end_time?: string;
    pause_time?: string;
    resume_time?: string;
    duration: number;
    target_duration?: number;
    quality_control: boolean;
    quality_check_passed?: boolean;
    quality_notes?: string;
    operation_notes?: string;
    created_at: string;
    updated_at: string;
    station_name?: string;
    operation_name?: string;
    original_station_name?: string;
    original_operation_name?: string;
    production_number?: number;
}

export interface ProductionExecutionOperationData {
    stationId: number;
    operationId: number;
    originalOperationId: number; // operations tablosundaki gerçek operation ID
    originalStationId: number; // operations tablosundaki gerçek station ID
    sortOrder: number;
    targetDuration?: number;
    qualityControl?: boolean;
}

export interface CreateProductionExecutionData {
    productionPlanId: number;
    offerId?: number;
    customerId?: number;
    vehicleAcceptanceId?: number;
    status?: ProductionExecutionStatus;
    description?: string;
    number?: number;
    operations?: ProductionExecutionOperationData[];
}

export interface UpdateProductionExecutionData {
    offerId?: number;
    customerId?: number;
    vehicleAcceptanceId?: number;
    status?: ProductionExecutionStatus;
    description?: string;
    number?: number;
    operations?: ProductionExecutionOperationData[];
}

export interface UpdateOperationExecutionData {
    status?: OperationExecutionStatus;
    qualityCheckPassed?: boolean;
    qualityNotes?: string;
    operationNotes?: string;
}
