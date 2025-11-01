import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';

export async function GET(request: Request) {
  try {
    // Test simple query
    const result = await executeQuery('SELECT COUNT(*) as total FROM vehicles');
    console.log('📊 Vehicle count:', result);
    
    // Test specific query
    const durangos = await executeQuery("SELECT COUNT(*) as count FROM vehicles WHERE model = 'Durango'");
    console.log('🚗 Durango count:', durangos);
    
    // Test motorcycles
    const motorcycles = await executeQuery("SELECT COUNT(*) as count FROM vehicles WHERE make LIKE '%Harley%'") as any[];
    console.log('🏍️ Motorcycle count:', motorcycles);
    
    return NextResponse.json({
      success: true,
      totalVehicles: (result as any[])[0]?.total || 0,
      durangos: (durangos as any[])[0]?.count || 0,
      motorcycles: motorcycles[0]?.count || 0
    });
    
  } catch (error) {
    console.error('❌ Test query error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}