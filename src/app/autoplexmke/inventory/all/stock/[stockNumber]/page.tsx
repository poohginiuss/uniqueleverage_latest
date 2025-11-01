"use client";

import GulfSeaAutoVehicleDetailPage from "./vehicle-detail-page";
import { useParams } from "next/navigation";

export default function GulfSeaAutoStockNumberPage() {
  // This will be handled by the client component
  return <GulfSeaAutoStockNumberPageClient />;
}

function GulfSeaAutoStockNumberPageClient() {
  const params = useParams();
  const stockNumber = params.stockNumber as string;
  
  return <GulfSeaAutoVehicleDetailPage stockNumber={stockNumber} />;
}
