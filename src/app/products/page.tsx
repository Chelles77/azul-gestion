'use client';

import { Suspense } from 'react';
import ProductsContent from './products-content';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111111] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
      <ProductsContent />
    </Suspense>
  );
}
