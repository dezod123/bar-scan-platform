export type CodeType = 'QR' | 'BARCODE';
export type ActionType = 'AWAITING' | 'DEPLOY' | 'RETURN';

export type Product = {
  id: string;
  name: string;
  codeValue: string;
  codeType: CodeType;
  createdAt: string;
  updatedAt: string;
};

export type Scan = {
  id: string;
  codeValue: string;
  codeType: CodeType;
  action: ActionType | null;
  productId: string;
  createdAt: string;
  updatedAt: string;
  product: Product;
};

export type CreateScanResponse = {
  scan: Scan;
  wasDuplicate: boolean;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw) as { message?: string };
      throw new Error(parsed.message || raw || `Request failed with ${response.status}`);
    } catch {
      throw new Error(raw || `Request failed with ${response.status}`);
    }
  }

  return response.json() as Promise<T>;
}

export async function getScans(action?: ActionType): Promise<Scan[]> {
  const query = action ? `?action=${action}` : '';
  return apiFetch<Scan[]>(`/scans${query}`);
}

export async function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>('/products');
}

export async function createProduct(input: {
  name: string;
  codeType: CodeType;
}): Promise<Product> {
  return apiFetch<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateScanAction(id: string, action: ActionType): Promise<Scan> {
  return apiFetch<Scan>(`/scans/${id}/action`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
}

export async function createScan(input: {
  codeValue: string;
  codeType: CodeType;
}): Promise<CreateScanResponse> {
  return apiFetch<CreateScanResponse>('/scans', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
