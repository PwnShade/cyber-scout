import { supabase } from "@/integrations/supabase/client";
import { Scan, ScanResult } from "@/types/recon";

export class ScanService {
  static async createScan(scan: Omit<Scan, 'id' | 'createdAt'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        name: scan.name,
        target: scan.target,
        status: scan.status,
        selected_modules: scan.selectedModules,
        module_options: scan.moduleOptions as any,
        execution_order: scan.executionOrder,
        progress: scan.progress,
        total_modules: scan.totalModules,
        completed_modules: scan.completedModules,
        started_at: scan.startedAt?.toISOString(),
        completed_at: scan.completedAt?.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapDbScanToScan(data);
  }

  static async updateScan(id: string, updates: Partial<Scan>) {
    const { data, error } = await supabase
      .from('scans')
      .update({
        status: updates.status,
        progress: updates.progress,
        completed_modules: updates.completedModules,
        started_at: updates.startedAt?.toISOString(),
        completed_at: updates.completedAt?.toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapDbScanToScan(data);
  }

  static async getScanById(id: string): Promise<Scan | null> {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    const results = await this.getScanResults(id);
    return this.mapDbScanToScan(data, results);
  }

  static async getUserScans(): Promise<Scan[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get results for all scans
    const scansWithResults = await Promise.all(
      data.map(async (scan) => {
        const results = await this.getScanResults(scan.id);
        return this.mapDbScanToScan(scan, results);
      })
    );

    return scansWithResults;
  }

  static async deleteScan(id: string) {
    const { error } = await supabase
      .from('scans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async createScanResult(scanId: string, result: Omit<ScanResult, 'id'>) {
    const { data, error } = await supabase
      .from('scan_results')
      .insert({
        scan_id: scanId,
        module_id: result.moduleId,
        module_name: result.moduleName,
        status: result.status,
        data: result.data as any,
        error_message: result.error,
        depends_on: result.dependsOn,
        started_at: result.startTime?.toISOString(),
        completed_at: result.endTime?.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapDbResultToResult(data);
  }

  static async updateScanResult(resultId: string, updates: Partial<ScanResult>) {
    const { data, error } = await supabase
      .from('scan_results')
      .update({
        status: updates.status,
        data: updates.data as any,
        error_message: updates.error,
        started_at: updates.startTime?.toISOString(),
        completed_at: updates.endTime?.toISOString()
      })
      .eq('id', resultId)
      .select()
      .single();

    if (error) throw error;
    return this.mapDbResultToResult(data);
  }

  static async getScanResults(scanId: string): Promise<ScanResult[]> {
    const { data, error } = await supabase
      .from('scan_results')
      .select('*')
      .eq('scan_id', scanId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(this.mapDbResultToResult);
  }

  private static mapDbScanToScan(dbScan: any, results: ScanResult[] = []): Scan {
    return {
      id: dbScan.id,
      target: dbScan.target,
      name: dbScan.name,
      status: dbScan.status,
      createdAt: new Date(dbScan.created_at),
      startedAt: dbScan.started_at ? new Date(dbScan.started_at) : undefined,
      completedAt: dbScan.completed_at ? new Date(dbScan.completed_at) : undefined,
      selectedModules: dbScan.selected_modules || [],
      moduleOptions: dbScan.module_options || {},
      results,
      executionOrder: dbScan.execution_order || [],
      progress: dbScan.progress || 0,
      totalModules: dbScan.total_modules || 0,
      completedModules: dbScan.completed_modules || 0
    };
  }

  private static mapDbResultToResult(dbResult: any): ScanResult {
    return {
      id: dbResult.id,
      moduleId: dbResult.module_id,
      moduleName: dbResult.module_name,
      status: dbResult.status,
      startTime: dbResult.started_at ? new Date(dbResult.started_at) : undefined,
      endTime: dbResult.completed_at ? new Date(dbResult.completed_at) : undefined,
      data: dbResult.data || {},
      error: dbResult.error_message,
      dependsOn: dbResult.depends_on || []
    };
  }
}